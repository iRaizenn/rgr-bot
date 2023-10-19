import { Client as DiscordClient, Collection, Partials } from 'discord.js';
import 'dotenv/config';

import loadEvents from './functions/loadEvents';
import loadCommands from './functions/loadCommands';

const { Channel, GuildMember, Message, User } = Partials;

class CustomClient extends DiscordClient {
	commands: Collection<string, any> = new Collection();
}

export default CustomClient;

const client = new CustomClient({
	intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
	partials: [Channel, GuildMember, Message, User],
});

client.commands = new Collection();

client.login(process.env.token).then(() => {
	loadEvents(client);
	loadCommands(client);
});
