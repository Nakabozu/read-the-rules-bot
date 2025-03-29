const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { dbDump } = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dbdiag")
    .setDescription("Dumps diagnostic information about the database."),
  async execute(interaction) {
    // interaction.user is the object representing the User who ran the command
    // interaction.member is the GuildMember object, which represents the user in the specific guild
    if (
      !interaction?.member
        ?.permissionsIn(interaction?.channel)
        ?.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.reply({
        content:
          "You need administrator permissions to see database diagnostics!",
        // HIDE THE COMMAND FROM THE PUBLIC
        ephemeral: true, // Makes the message only visible to the user that triggered it
      });
      return;
    }

    const dbDumpRes = await dbDump();

    await interaction.reply(
        dbDumpRes
    );
  },
};
