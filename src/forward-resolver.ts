import * as dgram from 'node:dgram';
import { dnsParser } from './message/parser';
import { DNSObject } from './message/types';

export async function forwardResolver(
	request: Buffer,
	host: string,
	port: number,
) {
	const answer = await new Promise<DNSObject>((resolve, reject) => {
		const socket = dgram.createSocket('udp4');

		socket.on('message', (data, _rinfo) => {
			try {
				const message = dnsParser.parse(data);
				socket.close();
				resolve(message);
			} catch (error) {
				console.error('Error in forwardResolver:', error);
				reject(error);
			}
		});

		socket.on('error', (err) => {
			socket.close();
			reject(err);
		});

		socket.send(request, port, host);
	});

	return answer;
}

