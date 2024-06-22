import * as dgram from 'node:dgram';
import { dnsParser } from './message/parser';
import { DNSObject, RECORD_TYPE } from './message/types';
import { DNSBuilder } from './message/builder';

const udpSocket: dgram.Socket = dgram.createSocket('udp4');
udpSocket.bind(2053, '127.0.0.1');

udpSocket.on('message', async (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
	try {
		const reqHeaderPacket = dnsParser.header(data);
		const { questions: reqQuestionPacket } = dnsParser.questionAndAnswer(data);

		if (reqHeaderPacket.QDCOUNT <= 0) {
			throw new Error('No questions found in the request');
		}

		if (reqQuestionPacket.length !== reqHeaderPacket.QDCOUNT) {
			throw new Error(
				'Question count does not match the number of questions found',
			);
		}

		if (reqHeaderPacket.ANCOUNT > 0) {
			throw new Error('Answer count must be 0');
		}

		if (reqHeaderPacket.QR !== 0) {
			throw new Error('QR bit must be 0 to be considered as a valid query');
		}

		const responseObject: DNSObject = {
			header: {
				...reqHeaderPacket,
				QR: 1,
			},
			questions: reqQuestionPacket,
			answers: [
				{
					NAME: 'example.com',
					CLASS: 1,
					RDATA: Buffer.from([192, 168, 1, 1]),
					RDLENGTH: 4,
					TTL: 60,
					TYPE: RECORD_TYPE.A,
				},
			],
		};
		const dnsBuilder = new DNSBuilder(responseObject);
		const response = dnsBuilder.toBuffer();
		udpSocket.send(response, remoteAddr.port, remoteAddr.address);
	} catch (e) {
		console.error(`Error sending data: ${e}`);
	}
});

udpSocket.on('error', (err) => {
	console.error(`Error: ${err}`);
	udpSocket.close();
});

