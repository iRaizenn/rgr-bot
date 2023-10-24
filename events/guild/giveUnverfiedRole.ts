import { GuildMember } from 'discord.js';

export default {
	name: 'guildMemberAdd',

	async execute(member: GuildMember) {
		const role = member.guild.roles.cache.get('1061313455182839829');
		if (!role) return console.log('No unverified role found.');

		member.roles.add(role).catch(err => {
			console.error(
				'Could not add unverified role to ' + member.user.username ||
					member.user.tag + err,
			);
		});
	},
};
