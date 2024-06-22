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
			RA: Bool.TRUE,
			Z: 0,
			RCODE: RCode.NOERROR,
			QDCOUNT: 1,
			ANCOUNT: 0,
			NSCOUNT: 0,
			ARCOUNT: 0,
		},
		questions: [
			{
				NAME: 'example.com',
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
				const responseHeaderObj = dnsParser.header(data);
				const { questions, answers } = dnsParser.questionAndAnswer(data);

				expect(responseHeaderObj.ID).toEqual(dnsRequestObject.header.ID);
				expect(responseHeaderObj.QR).toEqual(QRIndicator.RESPONSE);
				expect(responseHeaderObj.OPCODE).toEqual(
					dnsRequestObject.header.OPCODE,
				);
				expect(responseHeaderObj.AA).toEqual(dnsRequestObject.header.AA);
				expect(responseHeaderObj.TC).toEqual(dnsRequestObject.header.TC);
				expect(responseHeaderObj.RD).toEqual(dnsRequestObject.header.RD);
				expect(responseHeaderObj.RA).toEqual(dnsRequestObject.header.RA);
				expect(responseHeaderObj.Z).toEqual(dnsRequestObject.header.Z);
				expect(responseHeaderObj.RCODE).toEqual(dnsRequestObject.header.RCODE);
				expect(responseHeaderObj.QDCOUNT).toEqual(
					dnsRequestObject.header.QDCOUNT,
				);
				expect(responseHeaderObj.ANCOUNT).toEqual(
					dnsRequestObject.header.QDCOUNT,
				); // ANCOUNT should be equal to QDCOUNT
				expect(responseHeaderObj.NSCOUNT).toEqual(
					dnsRequestObject.header.NSCOUNT,
				);
				expect(responseHeaderObj.ARCOUNT).toEqual(
					dnsRequestObject.header.ARCOUNT,
				);

				expect(questions).toHaveLength(1);
				expect(answers).toHaveLength(1);

				expect(questions[0]?.NAME).toEqual(dnsRequestObject.questions[0]?.NAME);
				expect(questions[0]?.TYPE).toEqual(dnsRequestObject.questions[0]?.TYPE);
				expect(questions[0]?.CLASS).toEqual(
					dnsRequestObject.questions[0]?.CLASS,
				);

				expect(answers[0]?.NAME).toEqual(dnsRequestObject.questions[0]?.NAME);
				expect(answers[0]?.CLASS).toEqual(1);
				expect(answers[0]?.TYPE).toEqual(RECORD_TYPE.A);
				expect(answers[0]?.RDLENGTH).toEqual(4);
				expect(answers[0]?.RDATA).toEqual(Buffer.from([93, 184, 215, 14]));

				resolve(); // Resolve the promise when all assertions pass
			} catch (error) {
				reject(error); // Reject with error if assertions fail
			}
		});
	});

	// Wait for the response promise to resolve or timeout after a certain period
	await responsePromise;
});

test('valid DNS request with A record and multiple questions', async () => {
	const dnsRequestObject: DNSObject = {
		header: {
			ID: 1234,
			QR: QRIndicator.QUERY,
			OPCODE: OPCODE.QUERY,
			AA: Bool.FALSE,
			TC: Bool.FALSE,
			RD: Bool.TRUE,
			RA: Bool.TRUE,
			Z: 0,
			RCODE: RCode.NOERROR,
			QDCOUNT: 2,
			ANCOUNT: 0,
			NSCOUNT: 0,
			ARCOUNT: 0,
		},
		questions: [
			{
				NAME: 'example.com',
				TYPE: RECORD_TYPE.A,
				CLASS: 1,
			},
			{
				NAME: 'ronit.dev',
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
				const responseHeaderObj = dnsParser.header(data);
				const { questions, answers } = dnsParser.questionAndAnswer(data);

				expect(responseHeaderObj.ID).toEqual(dnsRequestObject.header.ID);
				expect(responseHeaderObj.QR).toEqual(QRIndicator.RESPONSE);
				expect(responseHeaderObj.OPCODE).toEqual(
					dnsRequestObject.header.OPCODE,
				);
				expect(responseHeaderObj.AA).toEqual(dnsRequestObject.header.AA);
				expect(responseHeaderObj.TC).toEqual(dnsRequestObject.header.TC);
				expect(responseHeaderObj.RD).toEqual(dnsRequestObject.header.RD);
				expect(responseHeaderObj.RA).toEqual(dnsRequestObject.header.RA);
				expect(responseHeaderObj.Z).toEqual(dnsRequestObject.header.Z);
				expect(responseHeaderObj.RCODE).toEqual(dnsRequestObject.header.RCODE);
				expect(responseHeaderObj.QDCOUNT).toEqual(
					dnsRequestObject.header.QDCOUNT,
				);
				expect(responseHeaderObj.ANCOUNT).toEqual(
					dnsRequestObject.header.QDCOUNT,
				); // ANCOUNT should be equal to QDCOUNT
				expect(responseHeaderObj.NSCOUNT).toEqual(
					dnsRequestObject.header.NSCOUNT,
				);
				expect(responseHeaderObj.ARCOUNT).toEqual(
					dnsRequestObject.header.ARCOUNT,
				);

				expect(questions).toHaveLength(2);
				expect(answers).toHaveLength(2);

				expect(questions[0]?.NAME).toEqual(dnsRequestObject.questions[0]?.NAME);
				expect(questions[0]?.TYPE).toEqual(dnsRequestObject.questions[0]?.TYPE);
				expect(questions[0]?.CLASS).toEqual(
					dnsRequestObject.questions[0]?.CLASS,
				);

				expect(questions[1]?.NAME).toEqual(dnsRequestObject.questions[1]?.NAME);
				expect(questions[1]?.TYPE).toEqual(dnsRequestObject.questions[1]?.TYPE);
				expect(questions[1]?.CLASS).toEqual(
					dnsRequestObject.questions[1]?.CLASS,
				);

				expect(answers[0]?.NAME).toEqual(dnsRequestObject.questions[0]?.NAME);
				expect(answers[0]?.CLASS).toEqual(1);
				expect(answers[0]?.TYPE).toEqual(RECORD_TYPE.A);
				expect(answers[0]?.RDLENGTH).toEqual(4);
				expect(answers[0]?.RDATA).toEqual(Buffer.from([93, 184, 215, 14]));

				expect(answers[1]?.NAME).toEqual(dnsRequestObject.questions[1]?.NAME);
				expect(answers[1]?.CLASS).toEqual(1);
				expect(answers[1]?.TYPE).toEqual(RECORD_TYPE.A);
				expect(answers[1]?.RDLENGTH).toEqual(4);
				expect(answers[1]?.RDATA).toEqual(Buffer.from([76, 76, 21, 21]));

				resolve(); // Resolve the promise when all assertions pass
			} catch (error) {
				reject(error); // Reject with error if assertions fail
			}
		});
	});

	// Wait for the response promise to resolve or timeout after a certain period
	await responsePromise;
});

test('valid DNS request MX record', async () => {
	const dnsRequestObject: DNSObject = {
		header: {
			ID: 1234,
			QR: QRIndicator.QUERY,
			OPCODE: OPCODE.QUERY,
			AA: Bool.FALSE,
			TC: Bool.FALSE,
			RD: Bool.TRUE,
			RA: Bool.TRUE,
			Z: 0,
			RCODE: RCode.NOERROR,
			QDCOUNT: 1,
			ANCOUNT: 0,
			NSCOUNT: 0,
			ARCOUNT: 0,
		},
		questions: [
			{
				NAME: 'dimension.dev',
				TYPE: RECORD_TYPE.MX,
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
				const responseHeaderObj = dnsParser.header(data);
				const { questions, answers } = dnsParser.questionAndAnswer(data);

				expect(responseHeaderObj.ID).toEqual(dnsRequestObject.header.ID);
				expect(responseHeaderObj.QR).toEqual(QRIndicator.RESPONSE);
				expect(responseHeaderObj.OPCODE).toEqual(
					dnsRequestObject.header.OPCODE,
				);
				expect(responseHeaderObj.AA).toEqual(dnsRequestObject.header.AA);
				expect(responseHeaderObj.TC).toEqual(dnsRequestObject.header.TC);
				expect(responseHeaderObj.RD).toEqual(dnsRequestObject.header.RD);
				expect(responseHeaderObj.RA).toEqual(dnsRequestObject.header.RA);
				expect(responseHeaderObj.Z).toEqual(dnsRequestObject.header.Z);
				expect(responseHeaderObj.RCODE).toEqual(dnsRequestObject.header.RCODE);
				expect(responseHeaderObj.QDCOUNT).toEqual(
					dnsRequestObject.header.QDCOUNT,
				);
				expect(responseHeaderObj.ANCOUNT).toEqual(5);
				expect(responseHeaderObj.NSCOUNT).toEqual(0);
				expect(responseHeaderObj.ARCOUNT).toEqual(
					dnsRequestObject.header.ARCOUNT,
				);

				expect(questions).toHaveLength(1);
				expect(answers).toHaveLength(5);

				expect(questions[0]?.NAME).toEqual(dnsRequestObject.questions[0]?.NAME);
				expect(questions[0]?.TYPE).toEqual(dnsRequestObject.questions[0]?.TYPE);
				expect(questions[0]?.CLASS).toEqual(
					dnsRequestObject.questions[0]?.CLASS,
				);

				answers.map((answer) => {
					expect(answer?.CLASS).toEqual(1);
					expect(answer?.RDLENGTH).toBeGreaterThanOrEqual(0);
					expect(answer?.RDATA).toBeDefined();
					expect(answer?.TYPE).toEqual(RECORD_TYPE.MX);
				});
				resolve(); // Resolve the promise when all assertions pass
			} catch (error) {
				reject(error); // Reject with error if assertions fail
			}
		});
	});

	// Wait for the response promise to resolve or timeout after a certain period
	await responsePromise;
});

