import {
	ButtonInteraction,
	InteractionType,
	ComponentType,
	PermissionFlagsBits,
	ChannelType,
} from 'discord.js';
import ticketSchema from '../../schemas/tickets';

export default {
	name: 'interactionCreate',

	async execute(interaction: ButtonInteraction) {
		if (
			interaction.type !== InteractionType.MessageComponent ||
			interaction.componentType !== ComponentType.Button ||
			interaction.customId !== 'unlock_ticket' ||
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

		if (!ticket) {
			return interaction.reply({
				content: 'Ticket not found.',
				ephemeral: true,
			});
		}

		if (ticket.lock[0] !== true) {
			return interaction.reply({
				content: 'Ticket is not locked.',
				ephemeral: true,
			});
		}

		// Log the unlocking event
		const unlockingEvent = {
			unlockedBy: `${interaction.user.username} (${interaction.user.id})`,
			unlockedAt: new Date().toUTCString(),
		};

		// Update the ticket information
		ticket.lock[0] = false; // Set to unlocked
		ticket.unlock.push(unlockingEvent); // Log the unlocking event

		try {
			// Use a database transaction to ensure data consistency
			const session = await ticketSchema.startSession();
			session.startTransaction();
			await ticket.save({ session: session });
			await session.commitTransaction();
			session.endSession();

			// Change channel permissions
			await interaction.channel.permissionOverwrites.edit(ticket.member.id, {
				SendMessages: null,
				ViewChannel: true,
				AddReactions: null,
			});

			// Respond to the user
			await interaction.channel.send({
				content: `Ticket unlocked by ${interaction.user}.`,
			});

			if (interaction.deferred || interaction.replied)
				await interaction.editReply({
					content: `Ticket unlocked.`,
				});
			else
				await interaction.reply({
					content: `Ticket unlocked.`,
					ephemeral: true,
				});
		} catch (error) {
			console.error(error);
			return interaction.reply({
				content: 'An error occurred while unlocking the ticket.',
				ephemeral: true,
			});
		}
	},
};
