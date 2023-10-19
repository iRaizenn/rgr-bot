import {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	PermissionFlagsBits,
	Client,
} from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription("Check the bot's latency and whether it's alive or not")
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
	async execute(interaction: ChatInputCommandInteraction, client: Client) {
		await interaction.reply({
			content: `Pong! :ping_pong: \`${client.ws.ping}\`ms`,
		});
	},
};
