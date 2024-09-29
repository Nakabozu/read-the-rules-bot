const { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } = require('discord.js');
const { addNoDup } = require('../../db');

//////////////////////////////////////////////////////////////////////////////////////
//                           SLASH COMMAND DOCUMENTATION                            //
// https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses //
//////////////////////////////////////////////////////////////////////////////////////
module.exports = {
	data: new SlashCommandBuilder()
		.setName('onemessage')
		.setDescription('Only allows users 1 post in the last 100 posts.'),
	async execute(/** @type {ChatInputCommandInteraction} */interaction) {
		if(!interaction?.member?.permissionsIn(interaction?.channel)?.has(PermissionFlagsBits.Administrator))
		{
			await interaction.reply({
				content: 'You need administrator permissions to enable one message mode!', 
				// HIDE THE COMMAND FROM THE PUBLIC
				ephemeral: true // Makes the message only visible to the user that triggered it
			});
			return;
		}
		addNoDup(interaction?.channel?.id);
		await interaction.reply({
			content: "This channel is now in **one message mode**!\nPosting a message will delete all prior messages.", 
		});
	},
};