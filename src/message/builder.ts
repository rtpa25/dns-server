import { DNSObject } from './types';

export class DNSBuilder {
	constructor(private dnsObject: DNSObject) {}

	public toBuffer(): Buffer {
		const { header, questions, answers } = this.dnsObject;
		try {
			//#region  //*=========== Compute buffer allocation size ===========
			//#region  //*=========== question buffer size ===========
			let qBuffSize = 0;
			for (const question of questions) {
				qBuffSize += 4; // 2 bytes for QTYPE and 2 bytes for QCLASS
				question.NAME.split('.').forEach((label: string) => {
					// [3]www[6]google[3]com + [0] terminator
					qBuffSize += label.length + 1; // 1 byte for the length of the label
				});
				qBuffSize++; // for the terminating 0;
			}
			//#endregion  //*======== question buffer size ===========
			const hBuffSize = 12;
			let allocSize = hBuffSize + qBuffSize;
			//#region  //*=========== answer buffer size ===========
			if (answers) {
				let aBuffSize = 0;
				for (const answer of answers) {
					aBuffSize += 10; // 2 bytes for TYPE, 2 bytes for CLASS, 4 bytes for TTL, 2 bytes for RDLENGTH
					answer.NAME.split('.').forEach((label: string) => {
						aBuffSize += label.length + 1; // same lable logic as question
					});
					aBuffSize++; // for the terminating 0
					aBuffSize += answer.RDLENGTH; // for RDATA as RDLENGTH is the indicator of how long RDATA is
				}
				allocSize += aBuffSize;
			}
			//#endregion  //*======== answer buffer size ===========
			//#endregion  //*======== Compute buffer allocation size ===========

			const response: Buffer = Buffer.alloc(allocSize);

			//#region  //*=========== Populate header ===========
			response.writeUInt16BE(header.ID, 0);
			response.writeUInt16BE(
				(header.QR << 15) |
					(header.OPCODE << 11) |
					(header.AA << 10) |
					(header.TC << 9) |
					(header.RD << 8) |
					(header.RA << 7) |
					(header.Z << 4) |
					header.RCODE,
				2,
			);
			response.writeUInt16BE(header.QDCOUNT, 4);
			response.writeUInt16BE(header.ANCOUNT, 6);
			response.writeUInt16BE(header.NSCOUNT, 8);
			response.writeUInt16BE(header.ARCOUNT, 10);
			//#endregion  //*======== Populate header ===========

			let offset = 12;
			//#region  //*=========== Populate question ===========
			for (const question of questions) {
				question.NAME.split('.').forEach((label: string) => {
					response.writeUInt8(label.length, offset++);
					response.write(label, offset);
					offset += label.length;
				}); // write the domain name
				response.writeUInt8(0, offset++); // write the terminating 0

				response.writeUInt16BE(question.TYPE, offset);
				offset += 2;
				response.writeUInt16BE(question.CLASS, offset);
				offset += 2;
			}
			//#endregion  //*======== Populate question ===========

			//#region  //*=========== Populate answer ===========
			if (answers) {
				for (const answer of answers) {
					answer.NAME.split('.').forEach((label: string) => {
						response.writeUInt8(label.length, offset++);
						response.write(label, offset);
						offset += label.length;
					}); // write the domain name
					response.writeUInt8(0, offset++); // write the terminating 0

					response.writeUInt16BE(answer.TYPE, offset);
					offset += 2;
					response.writeUInt16BE(answer.CLASS, offset);
					offset += 2;
					response.writeUInt32BE(answer.TTL, offset);
					offset += 4;
					response.writeUInt16BE(answer.RDLENGTH, offset);
					offset += 2;
					answer.RDATA.copy(response, offset); // write the RDATA buffer
					offset += answer.RDATA.length; // Move offset by the length of RDATA
				}
			}
			//#endregion  //*======== Populate answer ===========
			return response;
		} catch (error) {
			return Buffer.alloc(0);
		}
	}
}

