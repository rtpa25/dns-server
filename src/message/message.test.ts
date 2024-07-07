import { DNSBuilder } from './builder';
import { dnsParser } from './parser';
import {
	Bool,
	DNSObject,
	OPCODE,
	QRIndicator,
	RCode,
	RECORD_TYPE,
} from './types';
import {} from 'module';

test('check full builder and parser flow', () => {
	const dnsObject: DNSObject = {
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

	const dnsBuilder = new DNSBuilder(dnsObject);
	const buffer = dnsBuilder.toBuffer();

	const { questions, answers, header } = dnsParser.parse(buffer);

	expect(header.ID).toEqual(dnsObject.header.ID);
	expect(header.QR).toEqual(dnsObject.header.QR);
	expect(header.OPCODE).toEqual(dnsObject.header.OPCODE);
	expect(header.AA).toEqual(dnsObject.header.AA);
	expect(header.TC).toEqual(dnsObject.header.TC);
	expect(header.RD).toEqual(dnsObject.header.RD);
	expect(header.RA).toEqual(dnsObject.header.RA);
	expect(header.Z).toEqual(dnsObject.header.Z);
	expect(header.RCODE).toEqual(dnsObject.header.RCODE);
	expect(header.QDCOUNT).toEqual(dnsObject.header.QDCOUNT);
	expect(header.ANCOUNT).toEqual(dnsObject.header.ANCOUNT);
	expect(header.NSCOUNT).toEqual(dnsObject.header.NSCOUNT);
	expect(header.ARCOUNT).toEqual(dnsObject.header.ARCOUNT);

	expect(questions).toHaveLength(1);
	expect(questions[0]).toBeDefined();
	expect(questions[0]?.NAME).toEqual('example.com');
	expect(questions[0]?.TYPE).toEqual(RECORD_TYPE.A);
	expect(questions[0]?.CLASS).toEqual(1);

	expect(answers).toHaveLength(0);
});

