import {
	ButtonInteraction,
	InteractionType,
	ComponentType,
	ChannelType,
	GuildMember,
	OverwriteType,
	PermissionFlagsBits,
} from 'discord.js';
import ticketSchema from '../../schemas/tickets';

export default {
	name: 'interactionCreate',

	async execute(interaction: ButtonInteraction) {
		if (
			interaction.type !== InteractionType.MessageComponent ||
			interaction.componentType !== ComponentType.Button ||
			interaction.customId !== 'lock_ticket' ||
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
				content: 'You do not have the `Manage Channels` permission.',
				ephemeral: true,
			});
		const ticket = await ticketSchema.findOne({
			channel: interaction.channelId,
		});

		if (!ticket || ticket.channel !== interaction.channel.id) {
			return;
		}

		if (ticket.lock.includes(true)) {
			return interaction.reply({
				content: 'Ticket is already locked.',
				ephemeral: true,
			});
		}

		try {
			if (ticket.member) {
				ticket.lock = [true];
				ticket.lockedAt = new Date().toUTCString();
				ticket.lockedBy = `${interaction.user.username} (${interaction.user.id})`;

				await ticket.save();

				await interaction.channel.permissionOverwrites.edit(
					interaction.guild.members.cache.get(ticket.member.id) as GuildMember,
					{ SendMessages: false, AddReactions: false },
					{
						reason: `Ticket ${ticket.ticketId} locked by ${
							interaction.user.username
						} on ${new Date().toUTCString()}`,
						type: OverwriteType.Member,
					},
				);

				await interaction.channel.send({
					content: `Ticket locked by ${interaction.user}.`,
				});
				if (interaction.deferred || interaction.replied) {
					await interaction.editReply({
						content: `Ticket locked.`,
					});
				} else {
					await interaction.reply({
						content: `Ticket locked.`,
						ephemeral: true,
					});
				}
			}
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: 'An error occurred while trying to lock the ticket.',
				ephemeral: true,
			});
		}
	},
};
