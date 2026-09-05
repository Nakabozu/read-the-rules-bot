const {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    Client,
    EmbedBuilder,
    Message,
} = require('discord.js');
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
        await interaction.channel
            .send(messageToPost)
            .then(async (/** @type {Message} */ msg) => {
                await interaction.reply({
                    content: 'Message posted successfully!',
                    ephemeral: true, // Makes the message only visible to the user that triggered it
                });
                const channel = interaction.guild.channels.cache.find(
                    (ch) => ch.name === 'bot-logs'
                );
                const embedReply = new EmbedBuilder()
                    .setColor('#FF7400')
                    .setTitle(`An admin used the /post command`)
                    .setImage('https://i.imgur.com/7cZmf1K.png')
                    .setDescription(
                        `**Name**: ${interaction?.user?.username} (${interaction?.user?.id})` +
                            `\n**Time**: ${new Date()?.toLocaleString?.()}` +
                            `\n**Channel**:\n<#${interaction?.channel?.id}>` +
                            `\n**Message Link**: [Jump to message](${msg?.url})`
                    );

                await channel.send({ embeds: [embedReply] });
            })
            .catch(async (err) => {
                await interaction.reply({
                    content: `Failed to post the message!\nError: ${err?.message}`,
                    ephemeral: true, // Makes the message only visible to the user that triggered it
                });
                console.error(
                    rT + "OH NO! Couldn't post that message!" + ansiR,
                    err
                );
            });
    },
};
