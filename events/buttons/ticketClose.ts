import {
	ButtonInteraction,
	InteractionType,
	ComponentType,
	PermissionFlagsBits,
	ChannelType,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	TextBasedChannel,
	time,
} from 'discord.js';
import { createTranscript } from 'discord-html-transcripts';
import ticketSchema from '../../schemas/tickets';

export default {
	name: 'interactionCreate',

	async execute(interaction: ButtonInteraction) {
		if (
			interaction.type !== InteractionType.MessageComponent ||
			interaction.componentType !== ComponentType.Button ||
			interaction.customId !== 'close_ticket' ||
			!interaction.guild?.available ||
			!interaction.guild ||
			!interaction.member ||
			!interaction.channel ||
			interaction.channel.type !== ChannelType.GuildText
		)
			return;

		if (
			!interaction.guild.members.me ||
			!interaction.guild.members.me.permissions.has(
				PermissionFlagsBits.ManageChannels,
			)
		)
			return interaction.reply({
				content: 'I do not have the `Manage Channels` permission.',
				ephemeral: true,
			});

		if (!interaction.memberPermissions?.has('ManageChannels'))
			return interaction.reply({
				content:
					"You aren't allowed to close tickets, please ask a staff member to close the ticket.",
				ephemeral: true,
			});

		const ticket = await ticketSchema.findOne({
			channel: interaction.channelId,
		});

		if (ticket.closed[0] === true)
			return interaction.reply({
				content: 'This ticket is already closed.',
				ephemeral: true,
			});

		interaction.deferReply();

		if (!ticket)
			return interaction.reply({
				content: 'This channel is not a ticket.',
				ephemeral: true,
			});

		try {
			await interaction.channel.send({
				content:
					'This ticket will be closed in a minute. If you want to cancel please click the button below.',
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId('cancel_close_ticket')
							.setLabel('Cancel')
							.setEmoji('❌')
							.setStyle(ButtonStyle.Danger)
							.setDisabled(false),
					),
				],
			});

			setTimeout(async () => {
				if (!interaction.channel)
					return console.log('Returning because channel is null.');
				if (ticket.closed[0] === true) return;

				const transcriptChannel = await interaction.client.guilds.cache
					.get('874260708655783977')
					?.channels.cache.get('1088190744008851536');

				await interaction.editReply({ content: 'Closing ticket...' });

				const transcript = await createTranscript(interaction.channel, {
					limit: -1,
					saveImages: true,
					footerText: 'Exported {number} message{s}',
					filename: `${interaction.user.username}-ticket-${ticket.ticketId}.html`,
					poweredBy: false,
				});

				if (transcriptChannel?.type === ChannelType.GuildText) {
					(transcriptChannel as TextBasedChannel).send({
						embeds: [
							new EmbedBuilder()
								.setTitle('Ticket transcript for ticket ID: ' + ticket.ticketId)
								.setColor('Blurple')
								.setTimestamp(),
						],
						files: [transcript],
					});
				}

				await interaction.guild?.members.cache
					.get(ticket.member.id)
					?.send({
						content:
							'Your ticket has been closed. Here is the transcript of the ticket ' +
							ticket.ticketId,
						files: [transcript],
					})
					.catch(() => {
						(transcriptChannel as TextBasedChannel).send({
							content: 'Failed to DM transcript to user.',
						});
					});

				await ticketSchema.updateOne(
					{ channel: interaction.channelId },
					{
						closed: [
							{
								closedBy: `${interaction.user.username} (${interaction.user.id})`,
								closedAt: new Date().toUTCString(),
								closedTimestamp: time(new Date(), 'F'),
							},
						],
					},
				);

				await interaction.channel?.delete();
			}, 60 * 1000);
		} catch (err) {
			return console.error(err);
		}
	},
};
