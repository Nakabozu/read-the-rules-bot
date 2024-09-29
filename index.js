//#region Imports
const fs = require("node:fs");
const path = require("node:path");
const { gT, ansiR, rT, buT, mT, cT } = require("./ansiCodes.js");
require("dotenv").config();
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
  Message,
} = require("discord.js");
const { initializeDb, getAllNoDupes, getAllStickies } = require("./db.js");
const token = process.env.TOKEN;
let isDeletingDupePosts = false;
let isDeletingLastSticky = false;

//#endregion
//#region Initialize Db
/** @type {string[]} */
let nodupeChannels = [];
/** @type {{channelId: string, message: string}[]} */
let currentStickies = [];
initializeDb();
getAllNoDupes((nodupes) => {
  nodupeChannels = nodupes.map((nodupeObject) => nodupeObject?.channelId);
});
getAllStickies((stickies) => {
  currentStickies = [...stickies];
});
//#endregion

//#region Initialize Discord Bot
// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Register your slash commands
client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}
// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);

//#endregion
//#region Slash Command
// Add your slash command listeners
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    // console.debug(`${mT}Ran command ${buT}${interaction.commandName}${mT}:`);

    if (
      interaction?.member
        ?.permissionsIn(interaction?.channel)
        ?.has(PermissionFlagsBits.Administrator)
    ) {
      if (interaction.commandName === "sticky") {
        currentStickies = currentStickies.filter(
          (sticky) => sticky?.channelId !== interaction?.channel?.id
        );
        currentStickies.push({
          channelId: interaction?.channel?.id,
          message: interaction?.options?.getString("message"),
        });
      } else if (interaction.commandName === "unsticky") {
        currentStickies = currentStickies.filter(
          (sticky) => sticky?.channelId !== interaction?.channel?.id
        );
      } else if (interaction.commandName === "onemessage") {
        nodupeChannels.push(interaction?.channel?.id);
      } else if (interaction.commandName === "disableonemessage") {
        nodupeChannels = nodupeChannels?.filter(
          (channelId) => channelId !== interaction?.channel?.id
        );
      }
    }
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});
//#endregion
//#region Message Commands
client.on(Events.MessageCreate, async (message) => {
  try {
    if (message?.author?.bot) {
      //console.log(`${rT}Bot doesn't care about other bots!${ansiR}`);
      return;
    }

    const userId = message.author.id;
    const channel = message.channel;
    /** @type {Collection<string, Message<boolean>>} */
    let last100Messages = null;

    //#region Sticky Time
    const stickyMsg = currentStickies.find(
      (sticky) => sticky?.channelId === message?.channel?.id
    );
    if (stickyMsg || nodupeChannels.includes(channel?.id)) {
      // Fetch up to 100 messages before the current message in the channel
      last100Messages = await channel.messages.fetch({
        limit: 100,
        before: message.id,
      });
    }
    if (stickyMsg) {
      //   console.debug(
      //     `${mT}Found a sticky for channel ${buT}${
      //       message?.channel?.name
      //     }${mT} with the contents ${cT}${JSON.stringify(
      //       stickyMsg
      //     )}${mT}.${ansiR}`
      //   );
      const lastSticky = last100Messages?.filter(
        (msg) => msg?.author?.bot && msg?.content === stickyMsg?.message
      );
      if (lastSticky && lastSticky.size > 0 && !isDeletingLastSticky) {
        isDeletingLastSticky = true;
        // Check if the messages exist and can be deleted before attempting
        await Promise.all(
          lastSticky.map((stickyToDelete) => {
            if (stickyToDelete.deletable) {
              return stickyToDelete
                .delete()
                .catch((e) =>
                  console.error("Failed to delete sticky message:", e)
                );
            }
            return "NOT DELETABLE";
          })
        )
          .catch((err) => {
            console.log("Error deleting one of the sticky messages", err);
          })
          .finally(() => {
            isDeletingLastSticky = false;
          });
      }
      message.channel.send(stickyMsg?.message);
    }
    //#endregion
    //#region Duplicate Posts
    if (
      nodupeChannels.includes(channel?.id) &&
      !message?.member
        ?.permissionsIn(message?.channel)
        ?.has(PermissionFlagsBits.Administrator)
    ) {
      //console.log(`${gT}Checking for duplicate posts in ${buT}${message?.channel?.name} (${message?.channel?.id})${gT}!${ansiR}`);

      // Check if any of those last100Messages are from the same user
      const userMessages = last100Messages.filter(
        (msg) => msg?.author?.id === userId
      );

      if (isDeletingDupePosts) {
        return;
      }
      if (userMessages.size === 0) {
        // console.log(`${gT}This is the first message in the channel from user ${userId}.${ansiR}`);
      } else {
        isDeletingDupePosts = true;
        await Promise.all(
          userMessages.map((message) => {
            if (message?.deletable)
              return message?.delete().catch((err) => {
                console.error(
                  "Couldn't delete the user's duplicate messages",
                  err
                );
              });
            return "NOT DELETABLE";
          })
        )
          .catch((err) => {
            console.log(
              "Error deleting one of the user's duplicate messages",
              err
            );
          })
          .finally(() => {
            isDeletingDupePosts = false;
          });
      }
    }
    //#endregion
  } catch (err) {
    console.error(`The bot failed to read the message`, err, message);
  }
});
//#endregion

module.exports = { nodupeChannels, currentStickies };
