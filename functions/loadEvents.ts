import { Client } from 'discord.js';
import { Table } from 'console-table-printer';
import readyFile from '../events/client/ready';

function loadEvents(client: Client) {
	const table = new Table({
		title: 'Events',
		columns: [
			{
				name: 'name',
				title: 'Event Name',
				alignment: 'left',
				color: 'white',
			},
			{
				name: 'eventStatus',
				title: 'Status',
				alignment: 'left',
				color: 'white',
			},
		],
	});
	const { readdirSync } = require('fs');

	const eventFolders = readdirSync('./events');
	for (const folder of eventFolders) {
		const files = readdirSync(`./events/${folder}`).filter((file: string) =>
			file.endsWith('.js'),
		);

		for (const file of files) {
			const event = require(`../events/${folder}/${file}`).default;

			if (event.rest) {
				if (event.once)
					client.rest.once(event.name, (...args: any[]) =>
						event.execute(...args, client),
					);
				else
					client.rest.on(event.name, (...args: any[]) =>
						event.execute(...args, client),
					);
			} else {
				if (event.once)
					client.once(event.name, (...args: any[]) =>
						event.execute(...args, client),
					);
				else
					client.on(event.name, (...args: any[]) =>
						event.execute(...args, client),
					);
			}
			table.addRow({ name: file, eventStatus: 'loaded' });
			continue;
		}
	}
	console.log(table.render());
}

export default loadEvents;
