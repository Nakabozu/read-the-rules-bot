//#region Imports
const fs = require('node:fs');
const path = require('node:path');
const { gT, ansiR, rT, buT, mT, cT, buB, wT } = require('./ansiCodes.js');
require('dotenv').config();
const {
    Client,
    Collection,
    Events,
    GatewayIntentBits,
    PermissionFlagsBits,
    Message,
} = require('discord.js');
const {
    initializeDb,
    getAllNoDupes,
    getAllStickies,
    getNonoWords,
} = require('./db.js');
const token = process.env.TOKEN;

//#endregion
//#region Initialization
/** @type {string[]} */
let nodupeChannels = [];
/** @type {{channelId: string, message: string}[]} */
let currentStickies = [];
/** @type {string[]} */
let nonoWords = [];
/** @type {string[]} */
let deleteMessageQueue = [];
let isStickyQueued = false;

initializeDb();

getAllNoDupes((nodupes) => {
    // console.debug(`${gT}NODUPE INITIALIZATION COMPLETE!${ansiR}:`, nodupes);

    nodupeChannels = nodupes.map((nodupeObject) => nodupeObject?.channelId);
});
getAllStickies((stickies) => {
    // console.debug(`${gT}STICKY INITIALIZATION COMPLETE!${ansiR}:`, stickies);

    currentStickies = [...stickies];
});
getNonoWords((initNonoWords) => {
    console.debug(
        `${gT}NO-NO WORDS INITIALIZATION COMPLETE!${ansiR}:`,
        nonoWords
    );

    nonoWords = [...initNonoWords];
});
//#endregion

//#region Initialize Discord Bot
// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Register your slash commands
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
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
//#region Slash Comm Listener
// Add your slash command listeners
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`
        );
        return;
    }

    try {
        // console.debug(`${mT}Ran command ${buT}${interaction.commandName}${mT}:`);

        if (
            interaction?.member
                ?.permissionsIn(interaction?.channel)
                ?.has(PermissionFlagsBits.Administrator)
        ) {
            if (interaction.commandName === 'sticky') {
                currentStickies = currentStickies.filter(
                    (sticky) => sticky?.channelId !== interaction?.channel?.id
                );
                currentStickies.push({
                    channelId: interaction?.channel?.id,
                    message: interaction?.options
                        ?.getString('message')
                        .split('\\n')
                        .join('\n'),
                });
                // console.debug(
                //   `${buB}${wT}currentStickies${ansiR}${mT} was updated.${ansiR}`,
                //   currentStickies
                // );
            } else if (interaction.commandName === 'unsticky') {
                currentStickies = currentStickies.filter(
                    (sticky) => sticky?.channelId !== interaction?.channel?.id
                );
                // console.debug(
                //   `${buB}${wT}currentStickies${ansiR}${mT} was updated.${ansiR}`,
                //   currentStickies
                // );
            } else if (interaction.commandName === 'onemessage') {
                nodupeChannels.push(interaction?.channel?.id);
                // console.debug(
                //   `${buB}${wT}nodupeChannels${ansiR}${mT} was updated.${ansiR}`,
                //   nodupeChannels
                // );
            } else if (interaction.commandName === 'disableonemessage') {
                nodupeChannels = nodupeChannels?.filter(
                    (channelId) => channelId !== interaction?.channel?.id
                );
                // console.debug(
                //   `${buB}${wT}nodupeChannels${ansiR}${mT} was updated.${ansiR}`,
                //   nodupeChannels
                // );
            } else if (interaction.commandName === 'getnonowords') {
                // console.debug(
                //     `${buB}${wT}getnonowords${ansiR}${mT} was run.${ansiR}`,
                //     nonoWords
                // );
            } else if (interaction.commandName === 'setnonowords') {
                nodupeChannels = nodupeChannels?.filter(
                    (channelId) => channelId !== interaction?.channel?.id
                );
                const nonoWordsString =
                    interaction?.options?.getString('nonowords');
                const trimmedNonoWordsArray = nonoWordsString
                    .split(',')
                    .map((word) => {
                        return word.trim();
                    });

                if (nonoWordsString) nonoWords = [...trimmedNonoWordsArray];

                // console.debug(
                //     `${buB}${wT}setnonowords${ansiR}${mT} updated nonoWords.${ansiR}`,
                //     nonoWords
                // );
            }
        }
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
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
        const messageContent = message?.content;

        const isUserAdmin = message?.member
            ?.permissionsIn(channel)
            ?.has(PermissionFlagsBits.Administrator);
        /** @type {Collection<string, Message<boolean>>} */
        let last100Messages = null;

        //#region No-no words
        // if (!isUserAdmin) {
        let nonoWord = '';
        const hasNonoWord = nonoWords.some((nnw) => {
            // console.debug(
            //     `${mT}Checking to see if ${
            //         isUserAdmin ? 'ADMIN: ' : ''
            //     }${messageContent} contains ${nnw}${ansiR}`
            // );
            if (messageContent?.includes(nnw)) {
                nonoWord = nnw;
                return true;
            }
        });
        if (hasNonoWord) {
            message
                ?.delete()
                .then(() => {
                    message.channel
                        .send(`YOU CAN'T SAY ${nonoWord}!`)
                        .catch((err) => {
                            console.error(
                                rT +
                                    "OH NO!  Couldn't tell them that they couldn't say that!" +
                                    ansiR,
                                err
                            );
                        });
                })
                .catch((err) => {
                    console.error(
                        rT + "OH NO!  Couldn't delete their message!" + ansiR,
                        err
                    );
                });
        } else {
            // console.debug(`${gT}Your words are accepted${ansiR}`);
        }
        // }
        //#endregion

        //#region Sticky Time
        const stickyMsg = currentStickies.find(
            (sticky) =>
                sticky?.channelId &&
                message?.channel?.id &&
                sticky?.channelId === message?.channel?.id
        );
        if (stickyMsg || nodupeChannels.includes(channel?.id)) {
            // Fetch up to 100 messages before the current message in the channel
            last100Messages = await channel.messages
                .fetch({
                    limit: 100,
                    before: message.id,
                })
                .then((messages) =>
                    messages.filter(
                        // Message already queued for deletion.  Don't worry about it.
                        (message) => !deleteMessageQueue.includes(message?.id)
                    )
                );
        }
        if (stickyMsg && !isStickyQueued) {
            isStickyQueued = true;
            // console.debug(
            //   `${mT}Found a sticky for channel ${buT}${
            //     message?.channel?.name
            //   }${mT} with the contents ${cT}${JSON.stringify(
            //     stickyMsg
            //   )}${mT}.${ansiR}`
            // );
            const oldStickiesToDelete = last100Messages?.filter(
                (oldStickyMsg) => {
                    if (
                        oldStickyMsg?.author?.bot &&
                        oldStickyMsg?.content?.trim() ===
                            stickyMsg?.message?.trim() &&
                        !deleteMessageQueue.includes(oldStickyMsg?.id)
                    ) {
                        deleteMessageQueue.push(oldStickyMsg?.id);
                        return true;
                    }
                    return false;
                }
            );
            if (oldStickiesToDelete && oldStickiesToDelete.size > 0) {
                // Check if the messages exist and can be deleted before attempting
                oldStickiesToDelete.forEach((stickyToDelete) => {
                    if (stickyToDelete.deletable) {
                        stickyToDelete
                            .delete()
                            .catch((e) =>
                                console.error(
                                    'Failed to delete sticky message:',
                                    e
                                )
                            )
                            .finally(() => {
                                const indexOfDeletedMessage =
                                    deleteMessageQueue.indexOf(message?.id);
                                if (indexOfDeletedMessage >= 0) {
                                    deleteMessageQueue.splice(
                                        indexOfDeletedMessage,
                                        1
                                    );
                                }
                            });
                    }
                });
            }
            message.channel
                .send(stickyMsg?.message)
                .catch((err) => {
                    console.error(
                        "Wow!  This is a rare one...  Couldn't send your sticky message."
                    );
                })
                .finally(() => {
                    isStickyQueued = false;
                });
        }
        //#endregion
        //#region Duplicate Posts
        if (
            nodupeChannels.includes(channel?.id) &&
            !message?.member
                ?.permissionsIn(message?.channel)
                ?.has(PermissionFlagsBits.Administrator)
        ) {
            // console.log(
            //   `${mT}Checking for duplicate posts in ${buT}${message?.channel?.name} (${message?.channel?.id})${mT}!${ansiR}`
            // );

            // Check if any of those last100Messages are from the same user and aren't queued for deletion already
            const userMessages = last100Messages.filter((usrMsg) => {
                if (
                    usrMsg?.author?.id === userId &&
                    !deleteMessageQueue.includes(usrMsg?.id)
                ) {
                    deleteMessageQueue.push(usrMsg?.id);
                    return true;
                }
                return false;
            });

            if (userMessages.size === 0) {
                // console.log(`${gT}This is the first message in the channel from user ${userId}.${ansiR}`);
            } else {
                userMessages.map((message) => {
                    //   console.log(
                    //     `${mT}Attempting to ${rT}DELETE${mT} message ${buT}${message?.id}${mT} from user ${buT}${message?.member?.nickname}${mT}.${ansiR}`
                    //   );
                    if (message?.deletable)
                        message
                            ?.delete()
                            .catch((err) => {
                                console.error(
                                    "Couldn't delete the user's duplicate message",
                                    err
                                );
                            })
                            .finally(() => {
                                console.log(
                                    `${rT}REMOVING${mT} message ${buT}${message?.id}${mT} from the delete queue.${ansiR}`
                                );
                                const indexOfDeletedMessage =
                                    deleteMessageQueue.indexOf(message?.id);
                                if (indexOfDeletedMessage >= 0) {
                                    deleteMessageQueue.splice(
                                        indexOfDeletedMessage,
                                        1
                                    );
                                }
                            });
                });
            }
        }
        //#endregion
    } catch (err) {
        console.error(`The bot failed to read the message`, err, message);
    }
});
//#endregion
