import * as dgram from 'node:dgram';
import { dnsParser } from './message/parser';
import { DNSObject } from './message/types';

export async function forwardResolver(
	request: Buffer,
	host: string,
	port: number,
) {
	const answer = (await new Promise((resolve, reject) => {
		const socket = dgram.createSocket('udp4');

		socket.on('message', (data, _rinfo) => {
			try {
				const header = dnsParser.header(data);
				const message = dnsParser.questionAndAnswer(data);
				const response: DNSObject = {
					header,
					answers: message.answers,
					questions: message.questions,
					authority: message.authority,
					additional: message.additional,
				};
				socket.close();
				resolve(response);
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
	})) as DNSObject;

	return answer;
}

