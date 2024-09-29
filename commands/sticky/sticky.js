const { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } = require('discord.js');
const { addSticky } = require('../../db');

//////////////////////////////////////////////////////////////////////////////////////
//                           SLASH COMMAND DOCUMENTATION                            //
// https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses //
//////////////////////////////////////////////////////////////////////////////////////
module.exports = {
	data: new SlashCommandBuilder()
		.setName('sticky')
		.setDescription('Make a message stick to the bottom of this channel.')
		.addStringOption(option =>
			option.setName('message')
				.setDescription('The message to sticky').setRequired(true)),
	async execute(/** @type {ChatInputCommandInteraction} */interaction) {
		if(!interaction?.member?.permissionsIn(interaction?.channel)?.has(PermissionFlagsBits.Administrator))
		{
			await interaction.reply({
				content: 'You need administrator permissions to sticky a post!', 
				// HIDE THE COMMAND FROM THE PUBLIC
				ephemeral: true // Makes the message only visible to the user that triggered it
			});
			return;
		}
		let messageToSticky = interaction?.options?.getString("message");
		messageToSticky = messageToSticky.split('\\n').join('\n')
		if(!messageToSticky){
			await interaction.reply({
				content: 'I have no idea how you managed this, but you tried to sticky nothing?', 
				// HIDE THE COMMAND FROM THE PUBLIC
				ephemeral: true // Makes the message only visible to the user that triggered it
			});
			return;
		}
		addSticky(interaction?.channel?.id, messageToSticky);
		await interaction.reply({
			content: messageToSticky, 
		});
	},
};