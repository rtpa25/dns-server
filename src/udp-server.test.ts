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
import { decodeRDATA } from './utils';

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
				NAME: 'google.com',
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
				const { answers } = dnsParser.parse(data);

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
test('valid DNS request with CNAME record and sigle question should resolve underlying A record if asked', async () => {
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
				NAME: 'www.ronit.dev',
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
				const { answers } = dnsParser.parse(data);

				expect(answers).toBeDefined();
				expect(answers.length).toEqual(2);

				expect(answers[0]?.NAME).toEqual(dnsRequestObject.questions[0]?.NAME);
				expect(answers[0]?.CLASS).toEqual(1);
				expect(answers[0]?.TYPE).toEqual(RECORD_TYPE.CNAME);
				expect(answers[0]?.RDLENGTH).toEqual(18);

				expect(answers[1]?.NAME).toEqual('hashnode.network');
				expect(answers[1]?.CLASS).toEqual(1);
				expect(answers[1]?.TYPE).toEqual(RECORD_TYPE.A);
				expect(answers[1]?.RDLENGTH).toEqual(4);

				resolve(); // Resolve the promise when all assertions pass
			} catch (error) {
				reject(error); // Reject with error if assertions fail
			}
		});
	});

	// Wait for the response promise to resolve or timeout after a certain period
	await responsePromise;
});
test('valid DNS request with CNAME record explicit asking of CNAME record should resolve only that', async () => {
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
				NAME: 'www.ronit.dev',
				TYPE: RECORD_TYPE.CNAME,
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
				const { answers } = dnsParser.parse(data);

				expect(answers).toBeDefined();
				expect(answers.length).toEqual(1);

				expect(answers[0]?.NAME).toEqual(dnsRequestObject.questions[0]?.NAME);
				expect(answers[0]?.CLASS).toEqual(1);
				expect(answers[0]?.TYPE).toEqual(RECORD_TYPE.CNAME);
				expect(answers[0]?.RDLENGTH).toEqual(18);

				resolve(); // Resolve the promise when all assertions pass
			} catch (error) {
				reject(error); // Reject with error if assertions fail
			}
		});
	});

	// Wait for the response promise to resolve or timeout after a certain period
	await responsePromise;
});
test('invalid domain should give an NXDOMAIN rcode in header', async () => {
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
				NAME: 'lambda.ronit.dev',
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
				const {
					header: { RCODE, ANCOUNT, NSCOUNT },
				} = dnsParser.parse(data);
				expect(RCODE).toEqual(RCode.NXDOMAIN);
				expect(ANCOUNT).toEqual(0);
				expect(NSCOUNT).toEqual(1);

				const { authority, answers } = dnsParser.parse(data);

				expect(authority).toBeDefined();
				expect(authority.length).toEqual(1);
				expect(authority[0]?.NAME).toEqual('ronit.dev');
				expect(authority[0]?.CLASS).toEqual(1);
				expect(authority[0]?.TYPE).toEqual(RECORD_TYPE.SOA);

				expect(answers).toBeDefined();
				expect(answers.length).toEqual(0);

				resolve(); // Resolve the promise when all assertions pass
			} catch (error) {
				reject(error); // Reject with error if assertions fail
			}
		});
	});

	// Wait for the response promise to resolve or timeout after a certain period
	await responsePromise;
});
test('valid DNS request with NS record', async () => {
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
				NAME: 'ronit.dev',
				TYPE: RECORD_TYPE.NS,
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
				const { answers } = dnsParser.parse(data);

				expect(answers).toBeDefined();
				expect(answers.length).toEqual(2);

				expect(answers[0]?.NAME).toEqual(dnsRequestObject.questions[0]?.NAME);
				expect(answers[0]?.CLASS).toEqual(1);
				expect(answers[0]?.TYPE).toEqual(RECORD_TYPE.NS);
				expect(answers[0]?.RDLENGTH).toEqual(24);
				expect(answers[0]?.RDATA).toBeDefined();
				expect(decodeRDATA(answers[0]?.RDATA as Buffer)).toEqual(
					'greg.ns.cloudflare.com',
				);

				expect(answers[1]?.NAME).toEqual(dnsRequestObject.questions[0]?.NAME);
				expect(answers[1]?.CLASS).toEqual(1);
				expect(answers[1]?.TYPE).toEqual(RECORD_TYPE.NS);
				expect(answers[1]?.RDLENGTH).toEqual(8);
				expect(answers[1]?.RDATA).toBeDefined();
				expect(decodeRDATA(answers[1]?.RDATA as Buffer)).toEqual('khloe'); // this is due to compression in the response

				resolve(); // Resolve the promise when all assertions pass
			} catch (error) {
				reject(error); // Reject with error if assertions fail
			}
		});
	});

	// Wait for the response promise to resolve or timeout after a certain period
	await responsePromise;
});

