import * as dgram from 'node:dgram';
import * as fs from 'node:fs';
import { DNSBuilder } from './message/builder';
import { dnsParser } from './message/parser';
import { recursiveLookup } from './reccursive-resolver';
import { DNSCache } from './dns-cache';
import { redis } from './redis';
import { Bool, DNSObject, QRIndicator } from './message/types';

const udpSocket: dgram.Socket = dgram.createSocket('udp4');
udpSocket.bind(2053, '127.0.0.1');

console.log('UDP server is running on port 2053');

const dnsCache = new DNSCache(redis);

udpSocket.on('message', async (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
	try {
		const reqHeaderPacket = dnsParser.header(data);
		const { questions: reqQuestionPacket } = dnsParser.questionAndAnswer(data);

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

		if (reqQuestionPacket.length !== 1 || reqHeaderPacket.QDCOUNT !== 1) {
			throw new Error('Only one question per request is allowed');
		}

		// we are only interested in the first question in the packet
		const question = reqQuestionPacket[0];

		if (!question) {
			throw new Error('No question found in the packet');
		}

		let responseObject: DNSObject;

		// try to fetch from cache first
		const cachedAnswers = await dnsCache.get(question);
		if (cachedAnswers.length > 0) {
			responseObject = {
				header: {
					...reqHeaderPacket,
					QR: QRIndicator.RESPONSE,
					RA: Bool.TRUE,
					ANCOUNT: cachedAnswers.length,
				},
				questions: [question],
				answers: cachedAnswers,
				additional: [],
				authority: [],
			};
		} else {
			responseObject = await recursiveLookup(question, reqHeaderPacket);
			if (responseObject.answers)
				await dnsCache.set(question, responseObject.answers);
		}

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

