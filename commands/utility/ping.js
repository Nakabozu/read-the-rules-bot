const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		// INTERACTION TAKE TOO LONG?  YOU CAN DEFER FOR A LITTLE LONGER!
		// await interaction.deferReply({
		// 	ephemeral: true // Makes the deferred reply only visible to the user that triggered it
		// });
		// await wait(4_000);


		await interaction.reply({
			content: 'Pong!', 

			// HIDE YOUR RESPONSE
			// ephemeral: true // Makes the message only visible to the user that triggered it

		});
		// FOLLOW UP WITH ANOTHER MESSAGE THAT LINKS TO THE THE REPLY BEFORE IT
		//		await interaction.followUp('Pong again!');

		// EDIT YOUR RESPONSE
		// await wait(2_000);
		// await interaction.editReply('Pong again!');
	},
};