import {
	StringSelectMenuInteraction,
	InteractionType,
	ComponentType,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	ModalActionRowComponentBuilder,
	ChannelType,
	PermissionFlagsBits,
	OverwriteType,
	time,
	EmbedBuilder,
	hyperlink,
	ButtonBuilder,
	ButtonStyle,
} from 'discord.js';
import { randomUUID } from 'crypto';
import ticketSchema from '../../schemas/tickets';

export default {
	name: 'interactionCreate',

	async execute(interaction: StringSelectMenuInteraction) {
		if (
			interaction.type !== InteractionType.MessageComponent ||
			interaction.componentType !== ComponentType.StringSelect ||
			interaction.customId !== 'supportTicketMenu'
		)
			return;

		switch (interaction.values[0]) {
			case 'reportMemberTicket':
				const reportMemberModal = new ModalBuilder()
					.setCustomId('reportMemberModal')
					.setTitle('Please provide more info about your ticket.');

				const memberToReport = new TextInputBuilder()
					.setCustomId('memberToReportTextInput')
					.setLabel('Provide the username and ID of the member.')
					.setStyle(TextInputStyle.Short)
					.setMinLength(10)
					.setMaxLength(32 + 20)
					.setRequired(true);

				const reasonForReport = new TextInputBuilder()
					.setCustomId('reasonForReportTextInput')
					.setStyle(TextInputStyle.Short)
					.setLabel('What did the member do? Provide a reason.')
					.setMinLength(20)
					.setMaxLength(100)
					.setRequired(true);

				const reportDescription = new TextInputBuilder()
					.setCustomId('reportDescriptionTextInput')
					.setStyle(TextInputStyle.Paragraph)
					.setLabel('Please provide a description of the incident.')
					.setMinLength(100)
					.setMaxLength(4000)
					.setRequired(true);

				const memberToReportRow =
					new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
						memberToReport,
					);
				const reasonForReportRow =
					new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
						reasonForReport,
					);
				const reportDescriptionRow =
					new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
						reportDescription,
					);

				reportMemberModal.addComponents(
					memberToReportRow,
					reasonForReportRow,
					reportDescriptionRow,
				);

				await interaction.showModal(reportMemberModal);
				interaction
					.awaitModalSubmit({
						filter: i =>
							i.user.id === interaction.user.id &&
							i.customId === 'reportMemberModal',
						time: 60000 * 5,
					})
					.then(async i => {
						try {
							const ticketId = randomUUID();
							const ticketChannel = await i.guild?.channels.create({
								name: `${i.user.username}-ticket`,
								type: ChannelType.GuildText,
								topic: `Ticket created by ${i.user.username} to report a member.`,
								parent: '1114953044782747739',
								permissionOverwrites: [
									{
										id: i.guild.roles.everyone.id,
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
									type: 'report-member',
									ticketId: ticketId,
									channel: ticketChannel.id,
									member: {
										id: i.user.id,
										username: i.user.username,
									},
									createdAt: new Date().toUTCString(),
									createdTimestamp: time(Date.now(), 'F'),
									lock: [false],
									unlock: [true],
									closed: [false],
								});

								const replyEmbed = new EmbedBuilder()
									.setTitle('Successfully created ticket.')
									.setDescription(
										`Your ticket has been successfully created. Click ${hyperlink(
											'here',
											ticketChannel.url,
										)} to go to your ticket.`,
									)
									.setColor('Green')
									.setFooter({ text: `Your ticket ID: ${ticketId}` })
									.setTimestamp();

								const ticketEmbed = new EmbedBuilder()
									.setAuthor({
										name: i.user.username,
										iconURL: i.user.displayAvatarURL({ extension: 'png' }),
										url: `https://discord.com/users/${i.user.id}`,
									})
									.setTitle(
										`Report member ticket created by ${i.user.username}`,
									)
									.setDescription(
										`**Member to report:** ${i.fields.getTextInputValue(
											'memberToReportTextInput',
										)}\n**Reason for report:** ${i.fields.getTextInputValue(
											'reasonForReportTextInput',
										)}\n\n**Description:** ${i.fields.getTextInputValue(
											'reportDescriptionTextInput',
										)}`,
									)
									.setFooter({ text: `Ticket ID: ${ticketId}` })
									.setTimestamp();

								const buttons =
									new ActionRowBuilder<ButtonBuilder>().addComponents(
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

								return i.reply({
									embeds: [replyEmbed],
									ephemeral: true,
								});
							}
						} catch (err) {
							console.error(
								`Error in creating report-member ticket with user: ${interaction.user.username} \n\nError:\n${err}`,
							);
						}
					})
					.catch(() => {
						return;
					});
				break;

			case 'reportBugTicket':
				const reportBugModal = new ModalBuilder()
					.setCustomId('reportBugModal')
					.setTitle('Please provide more info about your ticket.');

				const briefDescription = new TextInputBuilder()
					.setCustomId('briefDescriptionTextInput')
					.setStyle(TextInputStyle.Short)
					.setLabel('Provide a brief description of the bug.')
					.setMinLength(10)
					.setMaxLength(50)
					.setRequired(true);

				const bugDescription = new TextInputBuilder()
					.setCustomId('bugDescriptionTextInput')
					.setStyle(TextInputStyle.Paragraph)
					.setLabel('Please provide a description of the bug.')
					.setMinLength(100)
					.setMaxLength(4000)
					.setRequired(true);

				const bugReproduce = new TextInputBuilder()
					.setCustomId('bugReproduceTextInput')
					.setStyle(TextInputStyle.Paragraph)
					.setLabel('Please provide steps to reproduce the bug.')
					.setMinLength(100)
					.setRequired(true);

				const briefDescriptionRow =
					new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
						briefDescription,
					);
				const bugDescriptionRow =
					new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
						bugDescription,
					);

				const bugReproduceRow =
					new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
						bugReproduce,
					);

				reportBugModal.addComponents(
					briefDescriptionRow,
					bugDescriptionRow,
					bugReproduceRow,
				);

				await interaction.showModal(reportBugModal);

				await interaction
					.awaitModalSubmit({
						filter: i =>
							i.user.id === interaction.user.id &&
							i.customId === 'reportBugModal',
						time: 60000 * 5,
					})
					.then(async i => {
						try {
							const ticketId = randomUUID();
							const ticketChannel = await i.guild?.channels.create({
								name: `${i.user.username}-ticket`,
								type: ChannelType.GuildText,
								topic: `Ticket created by ${i.user.username} to report a member.`,
								parent: '1114953044782747739',
								permissionOverwrites: [
									{
										id: i.guild.roles.everyone.id,
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
									type: 'report-bug',
									ticketId: ticketId,
									channel: ticketChannel.id,
									member: {
										id: i.user.id,
										username: i.user.username,
									},
									createdAt: new Date().toUTCString(),
									createdTimestamp: time(Date.now(), 'F'),
									lock: [false],
									unlock: [true],
									closed: [false],
								});

								const replyEmbed = new EmbedBuilder()
									.setTitle('Successfully created ticket.')
									.setDescription(
										`Your ticket has been successfully created. Click ${hyperlink(
											'here',
											ticketChannel.url,
										)} to go to your ticket.`,
									)
									.setColor('Green')
									.setFooter({ text: `Your ticket ID: ${ticketId}` })
									.setTimestamp();

								const ticketEmbed = new EmbedBuilder()
									.setAuthor({
										name: i.user.username,
										iconURL: i.user.displayAvatarURL({ extension: 'png' }),
										url: `https://discord.com/users/${i.user.id}`,
									})
									.setTitle(`Bug report ticket created by ${i.user.username}`)
									.setDescription(
										`**Brief description:** ${i.fields.getTextInputValue(
											'briefDescriptionTextInput',
										)}\n**Description:** ${i.fields.getTextInputValue(
											'bugDescriptionTextInput',
										)}\n\n**Steps to reproduce:** ${i.fields.getTextInputValue(
											'bugReproduceTextInput',
										)}`,
									)
									.setFooter({ text: `Ticket ID: ${ticketId}` })
									.setTimestamp();

								const buttons =
									new ActionRowBuilder<ButtonBuilder>().addComponents(
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

								return i.reply({
									embeds: [replyEmbed],
									ephemeral: true,
								});
							}
						} catch (err) {
							console.error(
								`Error in creating report-bug ticket with user: ${interaction.user.username} \n\nError:\n${err}`,
							);
						}
					})
					.catch(() => {
						return;
					});
				break;

			case 'suggestFeatureTicket':
				const suggestFeatureModal = new ModalBuilder()
					.setCustomId('suggestFeatureModal')
					.setTitle('Please provide more info about your ticket.');

				const featureDescription = new TextInputBuilder()
					.setCustomId('featureDescriptionTextInput')
					.setStyle(TextInputStyle.Paragraph)
					.setLabel('Please provide a description of the feature.')
					.setMinLength(100)
					.setMaxLength(4000)
					.setRequired(true);

				const featureDescriptionRow =
					new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
						featureDescription,
					);
				suggestFeatureModal.addComponents(featureDescriptionRow);

				await interaction.showModal(suggestFeatureModal);
				await interaction
					.awaitModalSubmit({
						filter: i =>
							i.user.id === interaction.user.id &&
							i.customId === 'suggestFeatureModal',
						time: 60000 * 5,
					})
					.then(async i => {
						try {
							const ticketId = randomUUID();
							const ticketChannel = await i.guild?.channels.create({
								name: `${i.user.username}-ticket`,
								type: ChannelType.GuildText,
								topic: `Ticket created by ${i.user.username} to suggest a feature.`,
								parent: '1114953044782747739',
								permissionOverwrites: [
									{
										id: i.guild.roles.everyone.id,
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
									type: 'suggest-feature',
									ticketId: ticketId,
									channel: ticketChannel.id,
									member: {
										id: i.user.id,
										username: i.user.username,
									},
									createdAt: new Date().toUTCString(),
									createdTimestamp: time(Date.now(), 'F'),
									lock: [false],
									unlock: [true],
									closed: [false],
								});

								const replyEmbed = new EmbedBuilder()
									.setTitle('Successfully created ticket.')
									.setDescription(
										`Your ticket has been successfully created. Click ${hyperlink(
											'here',
											ticketChannel.url,
										)} to go to your ticket.`,
									)
									.setColor('Green')
									.setFooter({ text: `Your ticket ID: ${ticketId}` })
									.setTimestamp();

								const ticketEmbed = new EmbedBuilder()
									.setAuthor({
										name: i.user.username,
										iconURL: i.user.displayAvatarURL({ extension: 'png' }),
										url: `https://discord.com/users/${i.user.id}`,
									})
									.setTitle(
										`Feature suggestion ticket created by ${i.user.username}`,
									)
									.setDescription(
										`**Description:** ${i.fields.getTextInputValue(
											'featureDescriptionTextInput',
										)}`,
									)
									.setFooter({ text: `Ticket ID: ${ticketId}` })
									.setTimestamp();

								const buttons =
									new ActionRowBuilder<ButtonBuilder>().addComponents(
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
							console.error(
								`Error in creating suggest-feature ticket with user: ${interaction.user.username} \n\nError:\n${err}`,
							);
						}
					});
				break;
			case 'otherTicket':
				const otherModal = new ModalBuilder()
					.setCustomId('otherModal')
					.setTitle('Please provide more info about your ticket.');

				const reasonForTicket = new TextInputBuilder()
					.setCustomId('reasonForTicketTextInput')
					.setStyle(TextInputStyle.Short)
					.setLabel('What is the reason for your ticket?')
					.setPlaceholder('(eg: i need help with something)')
					.setMinLength(10)
					.setMaxLength(50)
					.setRequired(true);

				const descriptionOfTicket = new TextInputBuilder()
					.setCustomId('descriptionOfTicketTextInput')
					.setStyle(TextInputStyle.Paragraph)
					.setLabel('Please provide a description of your ticket.')
					.setMinLength(100)
					.setRequired(true);

				const reasonForTicketRow =
					new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
						reasonForTicket,
					);
				const descriptionOfTicketRow =
					new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
						descriptionOfTicket,
					);

				otherModal.addComponents(reasonForTicketRow, descriptionOfTicketRow);

				await interaction.showModal(otherModal);
				await interaction
					.awaitModalSubmit({
						filter: i =>
							i.user.id === interaction.user.id && i.customId === 'otherModal',
						time: 60000 * 5,
					})
					.then(async i => {
						try {
							const ticketId = randomUUID();
							const ticketChannel = await i.guild?.channels.create({
								name: `${i.user.username}-ticket`,
								type: ChannelType.GuildText,
								topic: `Ticket created by ${i.user.username} for another reason.`,
								parent: '1114953044782747739',
								permissionOverwrites: [
									{
										id: i.guild.roles.everyone.id,
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
									type: 'other',
									ticketId: ticketId,
									channel: ticketChannel.id,
									member: {
										id: i.user.id,
										username: i.user.username,
									},
									createdAt: new Date().toUTCString(),
									createdTimestamp: time(Date.now(), 'F'),
									lock: [false],
									unlock: [true],
									closed: [false],
								});

								const replyEmbed = new EmbedBuilder()
									.setTitle('Successfully created ticket.')
									.setDescription(
										`Your ticket has been successfully created. Click ${hyperlink(
											'here',
											ticketChannel.url,
										)} to go to your ticket.`,
									)
									.setColor('Green')
									.setFooter({ text: `Your ticket ID: ${ticketId}` })
									.setTimestamp();

								const ticketEmbed = new EmbedBuilder()
									.setAuthor({
										name: i.user.username,
										iconURL: i.user.displayAvatarURL({ extension: 'png' }),
										url: `https://discord.com/users/${i.user.id}`,
									})
									.setTitle(`Ticket created by ${i.user.username}`)
									.setDescription(
										`**Reason for ticket:** ${i.fields.getTextInputValue(
											'reasonForTicketTextInput',
										)}\n**Description:** ${i.fields.getTextInputValue(
											'descriptionOfTicketTextInput',
										)}`,
									)
									.setFooter({ text: `Ticket ID: ${ticketId}` })
									.setTimestamp();

								const buttons =
									new ActionRowBuilder<ButtonBuilder>().addComponents(
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
							console.error(
								`Error in creating other ticket with user: ${interaction.user.username} \n\nError:\n${err}`,
							);
						}
					})
					.catch(() => {
						return;
					});

				break;
		}
	},
};
