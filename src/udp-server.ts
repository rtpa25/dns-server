import * as dgram from 'node:dgram';
import { dnsParser } from './message/parser';
import { DNSObject, QRIndicator, RECORD_TYPE } from './message/types';
import { DNSBuilder } from './message/builder';

const udpSocket: dgram.Socket = dgram.createSocket('udp4');
udpSocket.bind(2053, '127.0.0.1');

console.log('UDP server is running on port 2053');

udpSocket.on('message', (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
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
				QR: QRIndicator.RESPONSE,
				QDCOUNT: reqHeaderPacket.QDCOUNT,
				ANCOUNT: reqQuestionPacket.length,
			},
			questions: reqQuestionPacket,
			answers: reqQuestionPacket.map((question) => {
				return {
					NAME: question.NAME,
					CLASS: 1,
					TTL: 300,
					TYPE: RECORD_TYPE.A,
					RDLENGTH: 4,
					RDATA: Buffer.from([192, 168, 1, 1]),
				};
			}),
		};

		const dnsBuilder = new DNSBuilder(responseObject);
		const response = dnsBuilder.toBuffer();

		console.log(`Sending response to ${remoteAddr.address}:${remoteAddr.port}`);

		udpSocket.send(response, remoteAddr.port, remoteAddr.address);
	} catch (e) {
		console.error(`Error sending data: ${e}`);
	}
});

udpSocket.on('error', (err) => {
	console.error(`Error: ${err}`);
	udpSocket.close();
});

