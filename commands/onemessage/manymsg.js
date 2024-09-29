const { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } = require('discord.js');
const { deleteNoDupe } = require('../../db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('disableonemessage')
		.setDescription('Allows users to post as many messages as they want.'),
	async execute(/** @type {ChatInputCommandInteraction} */interaction) {
		if(!interaction?.member?.permissionsIn(interaction?.channel)?.has(PermissionFlagsBits.Administrator))
			{
				await interaction.reply({
					content: 'You need administrator permissions to disable one message mode!', 
					// HIDE THE COMMAND FROM THE PUBLIC
					ephemeral: true // Makes the message only visible to the user that triggered it
				});
				return;
			}	
        deleteNoDupe(interaction?.channel?.id)
		await interaction.reply({
			content: "This channel is no longer in **one message mode**!\nPost as much as you like.", 
		});
	},
};