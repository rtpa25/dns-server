import * as dgram from 'node:dgram';
import { forwardResolver } from './forward-resolver';
import { DNSBuilder } from './message/builder';
import { dnsParser } from './message/parser';
import {
	Bool,
	DNSAnswer,
	DNSHeader,
	DNSObject,
	QRIndicator,
} from './message/types';

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

		const forwardingAddress = '8.8.8.8';
		const forwardingPort = 53;

		for (const question of reqQuestionPacket) {
			const forwardingRequestObject: DNSObject = {
				header: {
					...header,
					QR: QRIndicator.QUERY,
					QDCOUNT: 1,
					ANCOUNT: 0,
				},
				questions: [question],
			};
			const forwardingRequestBuffer = new DNSBuilder(
				forwardingRequestObject,
			).toBuffer();

			const dnsObject = await forwardResolver(
				forwardingRequestBuffer,
				forwardingAddress,
				+forwardingPort,
			);

			console.log(`Received response: ${JSON.stringify(dnsObject, null, 2)}`);

			if (dnsObject.answers) {
				dnsAnsObjectsFromForwardingServer.push(...dnsObject.answers);
			}
		}

		const responseObject: DNSObject = {
			header: {
				...header,
				ANCOUNT: dnsAnsObjectsFromForwardingServer.length,
			},
			questions: reqQuestionPacket,
			answers: dnsAnsObjectsFromForwardingServer,
		};

		const dnsBuilder = new DNSBuilder(responseObject);
		const response = dnsBuilder.toBuffer();

		console.log(`Sending response: ${JSON.stringify(responseObject, null, 2)}`);

		udpSocket.send(response, remoteAddr.port, remoteAddr.address);
	} catch (e) {
		console.error(`Error sending data: ${e}`);
	}
});

udpSocket.on('error', (err) => {
	console.error(`Error: ${err}`);
	udpSocket.close();
});

