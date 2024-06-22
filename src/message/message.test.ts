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

	const reqHeaderPacket = dnsParser.header(buffer);
	const { questions, answers } = dnsParser.questionAndAnswer(buffer);

	expect(reqHeaderPacket.ID).toEqual(dnsObject.header.ID);
	expect(reqHeaderPacket.QR).toEqual(dnsObject.header.QR);
	expect(reqHeaderPacket.OPCODE).toEqual(dnsObject.header.OPCODE);
	expect(reqHeaderPacket.AA).toEqual(dnsObject.header.AA);
	expect(reqHeaderPacket.TC).toEqual(dnsObject.header.TC);
	expect(reqHeaderPacket.RD).toEqual(dnsObject.header.RD);
	expect(reqHeaderPacket.RA).toEqual(dnsObject.header.RA);
	expect(reqHeaderPacket.Z).toEqual(dnsObject.header.Z);
	expect(reqHeaderPacket.RCODE).toEqual(dnsObject.header.RCODE);
	expect(reqHeaderPacket.QDCOUNT).toEqual(dnsObject.header.QDCOUNT);
	expect(reqHeaderPacket.ANCOUNT).toEqual(dnsObject.header.ANCOUNT);
	expect(reqHeaderPacket.NSCOUNT).toEqual(dnsObject.header.NSCOUNT);
	expect(reqHeaderPacket.ARCOUNT).toEqual(dnsObject.header.ARCOUNT);

	expect(questions).toHaveLength(1);
	expect(questions[0]).toBeDefined();
	expect(questions[0]?.NAME).toEqual('example.com');
	expect(questions[0]?.TYPE).toEqual(RECORD_TYPE.A);
	expect(questions[0]?.CLASS).toEqual(1);

	expect(answers).toHaveLength(0);
});

