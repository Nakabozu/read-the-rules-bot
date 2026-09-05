const {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
} = require('discord.js');
const { addSticky } = require('../../db');
const { rT, ansiR } = require('../../ansiCodes');

//////////////////////////////////////////////////////////////////////////////////////
//                           SLASH COMMAND DOCUMENTATION                            //
// https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses //
//////////////////////////////////////////////////////////////////////////////////////
module.exports = {
    data: new SlashCommandBuilder()
        .setName('post')
        .setDescription('Have the bot post a one-time message.')
        .addStringOption((option) =>
            option
                .setName('message')
                .setDescription('The message to post')
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
                    'You need administrator permissions to post a message!',
                // HIDE THE COMMAND FROM THE PUBLIC
                ephemeral: true, // Makes the message only visible to the user that triggered it
            });
            return;
        }
        let messageToPost = interaction?.options?.getString('message');
        messageToPost = messageToPost.split('\\n').join('\n').trim();
        if (!messageToPost) {
            await interaction.reply({
                content:
                    'I have no idea how you managed this, but you tried to post nothing?',
                // HIDE THE COMMAND FROM THE PUBLIC
                ephemeral: true, // Makes the message only visible to the user that triggered it
            });
            return;
        }
        // console.log(`Post message for channel ${interaction?.channel?.id}:\n${messageToPost}`);
        addSticky(interaction?.channel?.id, messageToPost);
        await interaction.channel.send(messageToPost).catch((err) => {
            console.error(
                rT + "OH NO! Couldn't post that message!" + ansiR,
                err
            );
        });
    },
};
