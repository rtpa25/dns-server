import { DNSAnswer, DNSObject } from './types';

export class DNSBuilder {
	constructor(private dnsObject: DNSObject) {}

	private calculateSectionBufferSize(section: DNSAnswer[]): number {
		let sectionBufferSize = 0;
		for (const entry of section) {
			sectionBufferSize += 10; // 2 bytes for TYPE, 2 bytes for CLASS, 4 bytes for TTL, 2 bytes for RDLENGTH
			entry.NAME.split('.').forEach((label: string) => {
				sectionBufferSize += label.length + 1; // 1 byte for the length of the label
			});
			sectionBufferSize++; // for the terminating 0
			sectionBufferSize += entry.RDLENGTH; // for RDATA
		}
		return sectionBufferSize;
	}

	private writeSectionToBuffer(
		section: DNSAnswer[],
		buffer: Buffer,
		offset: number,
	): number {
		for (const entry of section) {
			entry.NAME.split('.').forEach((label: string) => {
				buffer.writeUInt8(label.length, offset++);
				buffer.write(label, offset);
				offset += label.length;
			});
			buffer.writeUInt8(0, offset++); // write the terminating 0

			buffer.writeUInt16BE(entry.TYPE, offset);
			offset += 2;
			buffer.writeUInt16BE(entry.CLASS, offset);
			offset += 2;
			buffer.writeUInt32BE(entry.TTL, offset);
			offset += 4;
			buffer.writeUInt16BE(entry.RDLENGTH, offset);
			offset += 2;
			entry.RDATA.copy(buffer, offset); // write the RDATA buffer
			offset += entry.RDLENGTH; // Move offset by the length of RDATA
		}
		return offset;
	}

	public toBuffer(): Buffer {
		const {
			header,
			questions,
			answers = [],
			authority = [],
			additional = [],
		} = this.dnsObject;
		try {
			//#region  //*=========== Allocate buffer of required size in bytes ===========
			const hBuffSize = 12;

			//#region  //*=========== question buffer size ===========
			let qBuffSize = 0;
			for (const question of questions) {
				qBuffSize += 4; // 2 bytes for QTYPE and 2 bytes for QCLASS
				question.NAME.split('.').forEach((label: string) => {
					qBuffSize += label.length + 1; // 1 byte for the length of the label
				});
				qBuffSize++; // for the terminating 0
			}
			//#endregion  //*======== question buffer size ===========

			//#region  //*=========== answer, authority, additional buffer sizes ===========
			const aBuffSize = this.calculateSectionBufferSize(answers);
			const nsBuffSize = this.calculateSectionBufferSize(authority);
			const arBuffSize = this.calculateSectionBufferSize(additional);
			//#endregion  //*======== answer, authority, additional buffer sizes ===========

			const allocSize =
				hBuffSize + qBuffSize + aBuffSize + nsBuffSize + arBuffSize;
			const response: Buffer = Buffer.alloc(allocSize);
			//#endregion  //*======== Allocate buffer of required size in bytes ===========

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
				});
				response.writeUInt8(0, offset++); // write the terminating 0

				response.writeUInt16BE(question.TYPE, offset);
				offset += 2;
				response.writeUInt16BE(question.CLASS, offset);
				offset += 2;
			}
			//#endregion  //*======== Populate question ===========

			//#region  //*=========== Populate answer, authority, additional ===========
			offset = this.writeSectionToBuffer(answers, response, offset);
			offset = this.writeSectionToBuffer(authority, response, offset);
			offset = this.writeSectionToBuffer(additional, response, offset);
			//#endregion  //*======== Populate answer, authority, additional ===========

			return response;
		} catch (error) {
			return Buffer.alloc(0);
		}
	}
}

