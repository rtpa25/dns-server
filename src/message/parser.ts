import { DNSAnswer, DNSHeader, DNSQuestion } from './types';

export class DNSParser {
	public header(buffer: Buffer): DNSHeader {
		const headerObject: DNSHeader = {
			ID: buffer.readUInt16BE(0),
			QR: (buffer.readUInt16BE(2) >> 15) & 0b1,
			OPCODE: (buffer.readUInt16BE(2) >> 11) & 0b1111,
			AA: (buffer.readUInt16BE(2) >> 10) & 0b1,
			TC: (buffer.readUInt16BE(2) >> 9) & 0b1,
			RD: (buffer.readUInt16BE(2) >> 8) & 0b1,
			RA: (buffer.readUInt16BE(2) >> 7) & 0b1,
			Z: 0,
			RCODE: buffer.readUInt16BE(2) & 0b1111,
			QDCOUNT: buffer.readUInt16BE(4),
			ANCOUNT: buffer.readUInt16BE(6),
			NSCOUNT: buffer.readUInt16BE(8),
			ARCOUNT: buffer.readUInt16BE(10),
		};

		return headerObject;
	}

	public questionAndAnswer(buffer: Buffer): {
		questions: DNSQuestion[];
		answers: DNSAnswer[];
	} {
		let offset = 12;
		const questions: DNSQuestion[] = [];
		const answers: DNSAnswer[] = [];
		const questionsCount = buffer.readUInt16BE(4);
		const answersCount = buffer.readUInt16BE(6);

		for (let i = 0; i < questionsCount; i++) {
			let domainName = '';
			let jumped = false;
			let jumpOffset = -1;

			while (true) {
				const labelLength = buffer.readUInt8(offset);

				// Check if the labelLength indicates a pointer
				// If the first two bits of labelLength are 11 (0xc0)[11000000 in binary], it indicates a pointer.
				if ((labelLength & 0xc0) === 0xc0) {
					if (!jumped) {
						jumpOffset = offset + 2;
					}
					offset = ((labelLength & 0x3f) << 8) | buffer.readUInt8(offset + 1);
					jumped = true;
				} else {
					if (labelLength === 0) {
						offset++;
						break;
					}

					offset++;
					domainName +=
						buffer.toString('utf8', offset, offset + labelLength) + '.';
					offset += labelLength;
				}
			}

			if (jumped) {
				offset = jumpOffset;
			}

			domainName = domainName.slice(0, -1);
			const question: DNSQuestion = {
				NAME: domainName,
				TYPE: buffer.readUInt16BE(offset),
				CLASS: buffer.readUInt16BE(offset + 2) as 1,
			};
			offset += 4;
			questions.push(question);
		}

		for (let i = 0; i < answersCount; i++) {
			let domainName = '';
			let jumped = false;
			let jumpOffset = -1;

			while (true) {
				const labelLength = buffer.readUInt8(offset);

				// Check if the labelLength indicates a pointer
				// If the first two bits of labelLength are 11 (0xc0), it indicates a pointer.
				if ((labelLength & 0xc0) === 0xc0) {
					if (!jumped) {
						jumpOffset = offset + 2;
					}
					offset = ((labelLength & 0x3f) << 8) | buffer.readUInt8(offset + 1);
					jumped = true;
				} else {
					if (labelLength === 0) {
						offset++;
						break;
					}

					offset++;
					domainName +=
						buffer.toString('utf8', offset, offset + labelLength) + '.';
					offset += labelLength;
				}
			}

			if (jumped) {
				offset = jumpOffset;
			}

			domainName = domainName.slice(0, -1);
			const answer: DNSAnswer = {
				NAME: domainName,
				TYPE: buffer.readUInt16BE(offset),
				CLASS: buffer.readUInt16BE(offset + 2) as 1,
				TTL: buffer.readUInt32BE(offset + 4),
				RDLENGTH: buffer.readUInt16BE(offset + 8),
				RDATA: buffer.subarray(
					offset + 10,
					offset + 10 + buffer.readUInt16BE(offset + 8),
				),
			};
			offset += 10 + buffer.readUInt16BE(offset + 8);
			answers.push(answer);
		}

		return { questions, answers };
	}
}

export const dnsParser = new DNSParser();

