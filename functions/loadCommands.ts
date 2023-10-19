import CustomClient from '../main';
import { Table } from 'console-table-printer';

function loadCommands(client: CustomClient) {
	const table = new Table({
		title: 'Commands',
		columns: [
			{
				name: 'name',
				title: 'Event Name',
				alignment: 'left',
				color: 'white',
			},
			{
				name: 'commandStatus',
				title: 'Status',
				alignment: 'right',
				color: 'white',
			},
		],
	});
	const { readdirSync } = require('fs');
	let commandsArray = [];

	const commandsFolder = readdirSync('./commands');
	for (const folder of commandsFolder) {
		const files = readdirSync(`./commands/${folder}`).filter((file: string) =>
			file.endsWith('.js'),
		);

		for (const file of files) {
			const command = require(`../commands/${folder}/${file}`).default;

			if ('data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);
				commandsArray.push(command.data.toJSON());
				client.application?.commands.set(commandsArray);
				table.addRow(
					{ name: command.data.name, commandStatus: 'loaded' },
					{ color: 'green' },
				);
				continue;
			} else
				table.addRow(
					{ name: command.name, commandStatus: 'error' },
					{ color: 'red' },
				);
		}
	}
	return console.log(table.render());
}

export default loadCommands;
