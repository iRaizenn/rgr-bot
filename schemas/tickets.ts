import { model, Schema } from 'mongoose';

export default model(
	'tickets',
	new Schema({
		type: { type: String, required: true },
		ticketId: { type: String, required: true },
		channel: { type: String, required: true },
		member: { type: Object, required: true },
		createdAt: { type: String, required: true },
		createdTimestamp: { type: String, required: true },
		lock: { type: Array, required: false },
		unlock: { type: Array, required: false },
		closed: { type: Array, required: true },
	}),
);
