const {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
} = require('discord.js');
const { setNonoWords } = require('../../db');

//////////////////////////////////////////////////////////////////////////////////////
//                           SLASH COMMAND DOCUMENTATION                            //
// https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses //
//////////////////////////////////////////////////////////////////////////////////////
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setnonowords')
        .setDescription('Sets the words users are not allowed to say.')
        .addStringOption((option) =>
            option
                .setName('nonowords')
                .setDescription(
                    'A list of comma-separated words that users cannot say.  If they say one, their message is deleted.'
                )
                .setRequired(true)
        ),
    async execute(/** @type {ChatInputCommandInteraction} */ interaction) {
        if (
            !interaction?.member
                ?.permissionsIn(interaction?.channel)
                ?.has(PermissionFlagsBits.Administrator)
        ) {
            await interaction.reply({
                content:
                    'You need administrator permissions to set the no-no words!',
                // HIDE THE COMMAND FROM THE PUBLIC
                ephemeral: true, // Makes the message only visible to the user that triggered it
            });
            return;
        }
        const nonoWordsString = interaction?.options?.getString('nonowords');
        const trimmedNonoWordsArray = nonoWordsString.split(',').map((word) => {
            return word.trim();
        });
        const trimmedNonoWordsString = trimmedNonoWordsArray.join(',');

        if (!trimmedNonoWordsString) {
            await interaction.reply({
                content:
                    'I have no idea how you managed this, but you tried to set the no-no words to nothing?',
                // HIDE THE COMMAND FROM THE PUBLIC
                ephemeral: true, // Makes the message only visible to the user that triggered it
            });
            return;
        }
        console.log(`No-no words were set to ${trimmedNonoWordsString}`);
        setNonoWords(trimmedNonoWordsString);
        await interaction.reply({
            content: `Successfully set the no-no words to ${trimmedNonoWordsString}`,
            // HIDE THE COMMAND FROM THE PUBLIC
            ephemeral: true, // Makes the message only visible to the user that triggered it
        });
    },
};
