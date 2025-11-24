const {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
} = require('discord.js');
const { getNonoWords } = require('../../db');

//////////////////////////////////////////////////////////////////////////////////////
//                           SLASH COMMAND DOCUMENTATION                            //
// https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses //
//////////////////////////////////////////////////////////////////////////////////////
module.exports = {
    data: new SlashCommandBuilder()
        .setName('getnonowords')
        .setDescription('Gets the list words users are not allowed to say.'),
    async execute(/** @type {ChatInputCommandInteraction} */ interaction) {
        if (
            !interaction?.member
                ?.permissionsIn(interaction?.channel)
                ?.has(PermissionFlagsBits.Administrator)
        ) {
            await interaction.reply({
                content:
                    'You need administrator permissions to see the no-no words!',
                // HIDE THE COMMAND FROM THE PUBLIC
                ephemeral: true, // Makes the message only visible to the user that triggered it
            });
            return;
        }
        getNonoWords(async (nonoWords) => {
            const nonoWordsString = nonoWords?.join(', ');
            console.log(`No-no words are ${nonoWordsString}`);
            await interaction.reply({
                content:
                    nonoWords && nonoWords?.length > 0
                        ? `These are the current no-no words: \n${nonoWordsString}`
                        : 'There are no no-no words.',
                // HIDE THE COMMAND FROM THE PUBLIC
                ephemeral: true, // Makes the message only visible to the user that triggered it
            });
        });
    },
};
