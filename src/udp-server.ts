import * as dgram from 'node:dgram';
import * as fs from 'node:fs';
import { DNSBuilder } from './message/builder';
import { dnsParser } from './message/parser';
import {
	Bool,
	DNSAnswer,
	DNSHeader,
	DNSObject,
	QRIndicator,
} from './message/types';
import { recursiveLookup } from './reccursive-resolver';

const udpSocket: dgram.Socket = dgram.createSocket('udp4');
udpSocket.bind(2053, '127.0.0.1');

console.log('UDP server is running on port 2053');

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

		const header: DNSHeader = {
			ID: reqHeaderPacket.ID,
			QR: QRIndicator.RESPONSE,
			OPCODE: reqHeaderPacket.OPCODE,
			AA: Bool.FALSE,
			TC: Bool.FALSE,
			RD: reqHeaderPacket.RD,
			RA: Bool.TRUE,
			Z: 0,
			RCODE: reqHeaderPacket.OPCODE === 0 ? 0 : 4,
			QDCOUNT: reqQuestionPacket.length,
			ANCOUNT: reqQuestionPacket.length,
			NSCOUNT: 0,
			ARCOUNT: 0,
		};

		const dnsAnsObjectsFromForwardingServer: DNSAnswer[] = [];

		for (const question of reqQuestionPacket) {
			const answers = await recursiveLookup(question);
			dnsAnsObjectsFromForwardingServer.push(...answers);
		}

		const responseObject: DNSObject = {
			header: {
				...header,
				ANCOUNT: dnsAnsObjectsFromForwardingServer.length,
			},
			questions: reqQuestionPacket,
			answers: dnsAnsObjectsFromForwardingServer,
		};

		console.log('final-result', JSON.stringify(responseObject, null, 2));
		fs.writeFileSync('response.json', JSON.stringify(responseObject, null, 2));

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

