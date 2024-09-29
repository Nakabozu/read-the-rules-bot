const { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } = require('discord.js');
const { deleteSticky } = require('../../db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unsticky')
		.setDescription('Removes the sticky message in this channel.'),
	async execute(/** @type {ChatInputCommandInteraction} */interaction) {
		if(!interaction?.member?.permissionsIn(interaction?.channel)?.has(PermissionFlagsBits.Administrator))
			{
				await interaction.reply({
					content: 'You need administrator permissions to unsticky a post!', 
					// HIDE THE COMMAND FROM THE PUBLIC
					ephemeral: true // Makes the message only visible to the user that triggered it
				});
				return;
			}
        deleteSticky(interaction?.channel?.id);
		await interaction.reply({
			content: 'Any sticky posts will no longer be stuck in this channel.', 
			// HIDE THE COMMAND FROM THE PUBLIC
			ephemeral: true // Makes the message only visible to the user that triggered it
		});
	},
};