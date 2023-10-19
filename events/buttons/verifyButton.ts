import {
	ButtonInteraction,
	GuildMember,
	GuildMemberRoleManager,
	AttachmentBuilder,
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
} from 'discord.js';
import { Captcha } from 'captcha-canvas';
const wait = require('node:timers/promises').setTimeout;

export default {
	name: 'interactionCreate',

	async execute(interaction: ButtonInteraction) {
		if (
			interaction.type !== InteractionType.MessageComponent ||
			interaction.componentType !== ComponentType.Button ||
			interaction.customId !== 'verify'
		)
			return;

		const member = interaction.member as GuildMember;
		const role = member?.roles as GuildMemberRoleManager;

		if (role.cache.has('910848061855629352'))
			return interaction.reply({
				content: 'You are already verified.',
				ephemeral: true,
			});

		const captcha = new Captcha();

		captcha.async = false;
		captcha.addDecoy();
		captcha.drawTrace();
		captcha.drawCaptcha();

		const attachment = new AttachmentBuilder(await captcha.png, {
			name: 'captcha.png',
			description: `${interaction.user.username}'s captcha`,
		});

		const embed = new EmbedBuilder()
			.setTitle('Please complete the captcha below.')
			.setDescription(
				'Type the highlighted text in green in the modal by clicking the button below.',
			)
			.setColor('Yellow')
			.setImage('attachment://captcha.png');

		const submitButton = new ButtonBuilder()
			.setCustomId(`${interaction.user.id}-captcha-submit`)
			.setLabel('Submit captcha')
			.setStyle(ButtonStyle.Success)
			.setDisabled(false);

		const submitButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			submitButton,
		);

		await interaction.deferReply({ ephemeral: true });
		const reply = await interaction.followUp({
			embeds: [embed],
			files: [attachment],
			components: [submitButtonRow],
		});
		const buttonCollector = reply.createMessageComponentCollector({
			filter: i => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			maxUsers: 2,
			time: 60 * 1000,
		});

		buttonCollector.on('collect', async i => {
			const modal = new ModalBuilder()
				.setCustomId(`${interaction.user.id}-captcha-modal`)
				.setTitle('Enter the green text in the image.');

			const textInput = new TextInputBuilder()
				.setCustomId(`${interaction.user.id}-captcha-text-input`)
				.setLabel('Type the captcha in the box below.')
				.setStyle(TextInputStyle.Short)
				.setMinLength(6)
				.setMaxLength(6)
				.setRequired(true);

			const modalActionRow =
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
					textInput,
				);
			modal.addComponents(modalActionRow);
			await i.showModal(modal);

			i.awaitModalSubmit({
				time: 60 * 1000,
				filter: int => int.user.id === interaction.user.id,
			}).then(async int => {
				const captchaText = captcha.text;
				const inputText = int.fields.getTextInputValue(
					`${interaction.user.id}-captcha-text-input`,
				);

				if (captchaText === inputText) {
					await wait(500);
					await int.reply({
						content:
							'You have successfully completed the captcha. Please wait while we unlock the channels for you.',
						ephemeral: true,
					});
					await role.add('910848061855629352');
					await wait(1000);
					await role.remove('1061313455182839829');
					return int.editReply({
						content:
							"All the channels have been unlocked! Enjoy your stay at Raizen's and Ginny's Realm.",
					});
				} else {
					await int.reply({ content: '_ _', ephemeral: true });
					return int.editReply({
						embeds: [
							new EmbedBuilder()
								.setTitle('Captcha failed.')
								.setDescription(
									'You have failed the captcha. Please click the green Verify button again to try again.',
								)
								.setColor('Red')
								.setImage(null),
						],
						files: [],
						components: [],
					});
				}
			});
		});

		buttonCollector.on('end', async () => {
			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Captcha timed out.')
						.setDescription(
							'The captcha timed out. Please click the green Verify button again to try again.',
						)
						.setColor('Red')
						.setImage(null),
				],
				files: [],
				components: [],
			});
		});
	},
};
