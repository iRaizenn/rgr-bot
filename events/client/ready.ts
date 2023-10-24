import { Client, ChannelType } from 'discord.js';
import { connect } from 'mongoose';
import 'dotenv/config';

export default {
	name: 'ready',
	once: true,

	async execute(client: Client) {
		await connect(process.env.mongoDbUri as string, {
			keepAlive: true,
		})
			.then(() => {
				console.log('Connected to MongoDB');
			})
			.catch(err => {
				console.error(err);
			});
		console.log(`Logged in as ${client.user?.tag}`);
	},
};
