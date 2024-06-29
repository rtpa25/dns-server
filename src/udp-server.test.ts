import * as dgram from 'node:dgram';
import {
	Bool,
	DNSObject,
	OPCODE,
	QRIndicator,
	RCode,
	RECORD_TYPE,
} from './message/types';
import { DNSBuilder } from './message/builder';
import { dnsParser } from './message/parser';

const udpSocket = dgram.createSocket('udp4');
const TEST_PORT = 2053;
const TEST_HOST = '127.0.0.1';

afterAll((done) => {
	udpSocket.close(done);
});

test('valid DNS request with A record and sigle question', async () => {
	const dnsRequestObject: DNSObject = {
		header: {
			ID: 1234,
			QR: QRIndicator.QUERY,
			OPCODE: OPCODE.QUERY,
			AA: Bool.FALSE,
			TC: Bool.FALSE,
			RD: Bool.TRUE,
			RA: Bool.FALSE,
			Z: 0,
			RCODE: RCode.NOERROR,
			QDCOUNT: 1,
			ANCOUNT: 0,
			NSCOUNT: 0,
			ARCOUNT: 0,
		},
		questions: [
			{
				NAME: 'learn.piyushgarg.dev',
				TYPE: RECORD_TYPE.A,
				CLASS: 1,
			},
		],
	};

	const dnsBuilder = new DNSBuilder(dnsRequestObject);
	const requestBuffer = dnsBuilder.toBuffer();

	// Setup a promise to wait for the UDP response
	const responsePromise = new Promise<void>((resolve, reject) => {
		udpSocket.send(requestBuffer, TEST_PORT, TEST_HOST, (err) => {
			if (err) {
				reject(err);
			}
		});

		udpSocket.on('message', (data: Buffer) => {
			try {
				const { answers } = dnsParser.questionAndAnswer(data);

				expect(answers[0]?.NAME).toEqual(dnsRequestObject.questions[0]?.NAME);
				expect(answers[0]?.CLASS).toEqual(1);
				expect(answers[0]?.TYPE).toEqual(RECORD_TYPE.A);
				expect(answers[0]?.RDLENGTH).toEqual(4);
				expect(answers[0]?.RDATA).toBeDefined();

				resolve(); // Resolve the promise when all assertions pass
			} catch (error) {
				reject(error); // Reject with error if assertions fail
			}
		});
	});

	// Wait for the response promise to resolve or timeout after a certain period
	await responsePromise;
});

