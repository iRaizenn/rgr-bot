import {
	ButtonInteraction,
	EmbedBuilder,
	ComponentType,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ModalBuilder,
	ModalActionRowComponentBuilder,
	TextInputBuilder,
	TextInputStyle,
	InteractionType,
	PermissionFlagsBits,
	ChannelType,
	OverwriteType,
	time,
} from 'discord.js';
import ticketSchema from '../../schemas/tickets';

export default {
	name: 'interactionCreate',

	async execute(interaction: ButtonInteraction) {
		if (
			interaction.type !== InteractionType.MessageComponent ||
			interaction.componentType !== ComponentType.Button ||
			interaction.customId !== 'verifyHelp' ||
			!interaction.guild?.available
		)
			return;

		const modal = new ModalBuilder()
			.setCustomId('verifyHelpModal')
			.setTitle('Please provide more info about your ticket.');

		const problemBrief = new TextInputBuilder()
			.setCustomId('problemBriefTextInput')
			.setLabel('Write a brief description of your problem.')
			.setStyle(TextInputStyle.Short)
			.setMinLength(20)
			.setMaxLength(100)
			.setRequired(true);

		const problemDetails = new TextInputBuilder()
			.setCustomId('problemDetailsTextInput')
			.setStyle(TextInputStyle.Paragraph)
			.setLabel('Write a detailed description of your problem.')
			.setMinLength(50)
			.setRequired(true);

		const problemBriefRow =
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
				problemBrief,
			);
		const problemDetailsRow =
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
				problemDetails,
			);

		modal.addComponents(problemBriefRow, problemDetailsRow);

		await interaction.showModal(modal);

		interaction
			.awaitModalSubmit({
				filter: i =>
					i.user.id === interaction.user.id &&
					i.customId === modal.data.custom_id,
				time: 60000,
			})
			.then(async i => {
				const { guild } = i;
				const { ManageChannels } = PermissionFlagsBits;
				if (!i.guild?.members.me?.permissions.has(ManageChannels))
					return i.reply({
						content:
							'I do not have the required permissions to create a ticket channel. Please contact a staff member.',
						ephemeral: true,
					});

				const ticketId = Math.random().toString(36).substring(2, 7);

				try {
					const ticketChannel = await guild?.channels.create({
						name: `${i.user.username}-${ticketId}-ticket`,
						type: ChannelType.GuildText,
						topic: `Verification help ticket created by ${i.user.username}`,
						reason: 'Verification help ticket channel',
						parent: '1114953044782747739',
						permissionOverwrites: [
							{
								id: guild.roles.everyone.id,
								deny: [
									PermissionFlagsBits.ViewChannel,
									PermissionFlagsBits.ReadMessageHistory,
								],
								type: OverwriteType.Role,
							},
							{
								id: i.user.id,
								allow: [
									PermissionFlagsBits.ViewChannel,
									PermissionFlagsBits.ReadMessageHistory,
									PermissionFlagsBits.SendMessages,
									PermissionFlagsBits.AttachFiles,
								],
								type: OverwriteType.Member,
							},
							{
								id: '910847741687648267',
								allow: [
									PermissionFlagsBits.ViewChannel,
									PermissionFlagsBits.ReadMessageHistory,
									PermissionFlagsBits.SendMessages,
									PermissionFlagsBits.AttachFiles,
								],
								type: OverwriteType.Role,
							},
							{
								id: '1114175550064439337',
								allow: [
									PermissionFlagsBits.ViewChannel,
									PermissionFlagsBits.ReadMessageHistory,
									PermissionFlagsBits.SendMessages,
									PermissionFlagsBits.AttachFiles,
								],
							},
							{
								id: '910848142809894912',
								allow: [
									PermissionFlagsBits.ViewChannel,
									PermissionFlagsBits.ReadMessageHistory,
									PermissionFlagsBits.SendMessages,
									PermissionFlagsBits.AttachFiles,
								],
							},
							{
								id: '910848106176839712',
								allow: [
									PermissionFlagsBits.ViewChannel,
									PermissionFlagsBits.ReadMessageHistory,
									PermissionFlagsBits.SendMessages,
									PermissionFlagsBits.AttachFiles,
								],
							},
							{
								id: i.client.user!.id,
								allow: [
									PermissionFlagsBits.ViewChannel,
									PermissionFlagsBits.ReadMessageHistory,
									PermissionFlagsBits.SendMessages,
									PermissionFlagsBits.AttachFiles,
									PermissionFlagsBits.ManageChannels,
									PermissionFlagsBits.ManageMessages,
									PermissionFlagsBits.AddReactions,
									PermissionFlagsBits.EmbedLinks,
									PermissionFlagsBits.UseExternalEmojis,
								],
							},
						],
					});

					if (ticketChannel) {
						await ticketSchema.create({
							type: 'verification_help',
							channel: ticketChannel.id,
							member: {
								id: i.user.id,
								username: i.user.username,
							},
							ticketId: ticketId,
							createdAt: new Date().toUTCString(),
							createdTimestamp: time(new Date(), 'F'),
							lock: [false],
							unlock: [true],
							closed: [false],
						});

						const replyEmbed = new EmbedBuilder()
							.setTitle('Ticket Created')
							.setDescription(
								`Your ticket has been created. Please wait for a staff member to respond. You can view your ticket [here](https://discord.com/channels/${i.guild.id}/${ticketChannel.id}).`,
							)
							.setColor('Green')
							.setTimestamp();

						const ticketEmbed = new EmbedBuilder()
							.setAuthor({
								name: i.user.username,
								iconURL: i.user.displayAvatarURL(),
							})
							.setTitle(`Verification help ticket #${ticketId}`)
							.setDescription(
								`**Problem Brief:** ${i.fields.getTextInputValue(
									'problemBriefTextInput',
								)}\n**Problem Details:** ${i.fields.getTextInputValue(
									'problemDetailsTextInput',
								)}`,
							)
							.setColor('Blurple')
							.setTimestamp()
							.setFooter({
								text: `Ticket ID: ${ticketId}`,
								iconURL: i.guild.iconURL({ size: 1024, extension: 'png' })!,
							});

						const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setCustomId('close_ticket')
								.setLabel('Close Ticket')
								.setEmoji('✉️')
								.setStyle(ButtonStyle.Danger),
							new ButtonBuilder()
								.setCustomId('lock_ticket')
								.setEmoji('🔒')
								.setLabel('Lock Ticket')
								.setStyle(ButtonStyle.Secondary),
							new ButtonBuilder()
								.setCustomId('unlock_ticket')
								.setEmoji('🔓')
								.setLabel('Unlock Ticket')
								.setStyle(ButtonStyle.Success),
						);

						await ticketChannel.send({
							embeds: [ticketEmbed],
							components: [buttons],
						});

						return i.reply({ embeds: [replyEmbed], ephemeral: true });
					}
				} catch (err) {
					console.error(err);
					return i.reply({
						content: 'An error has occurred. Please contact a staff member.',
						ephemeral: true,
					});
				}
			})
			.catch(() => {
				return;
			});
	},
};
