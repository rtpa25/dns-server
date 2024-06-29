import { forwardResolver } from './forward-resolver';
import { DNSBuilder } from './message/builder';
import {
	Bool,
	DNSAnswer,
	DNSObject,
	DNSQuestion,
	QRIndicator,
	RCode,
	RECORD_TYPE,
} from './message/types';
import { rootNameServers } from './root-name-server';
import { decodeRDATA, getRandomEntry, isValidDomain } from './utils';

export async function recursiveLookup(question: DNSQuestion) {
	let rootNameServerIP = getRandomEntry(rootNameServers).ipv4;
	const resolverPort = 53;

	while (true) {
		let rootnameServerIPCopy = rootNameServerIP;

		const requestObject: DNSObject = {
			header: {
				ID: 1234,
				QR: QRIndicator.QUERY,
				OPCODE: 0,
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
			questions: [question],
		};
		const requestBuffer = new DNSBuilder(requestObject).toBuffer();
		let dnsResponse = await forwardResolver(
			requestBuffer,
			rootnameServerIPCopy,
			resolverPort,
		);

		//TODO: Handle error

		// if find answer return and end loop
		if (dnsResponse.answers && dnsResponse.answers.length > 0) {
			const answers = dnsResponse.answers;
			const cnameAnswers = answers.filter(
				(answer) => answer.TYPE === RECORD_TYPE.CNAME,
			);
			if (cnameAnswers.length > 0 && question.TYPE !== RECORD_TYPE.CNAME) {
				for (const cnameAnswer of cnameAnswers) {
					const cnameQuestion: DNSQuestion = {
						NAME: decodeRDATA(cnameAnswer.RDATA),
						TYPE: RECORD_TYPE.A,
						CLASS: 1,
					};
					const cnameAnswers = await recursiveLookup(cnameQuestion);
					answers.push(...cnameAnswers);
				}
			}
			return answers;
		}

		// if find additional use those ip and continue the loop in hope that you will get the answer
		if (dnsResponse.additional && dnsResponse.additional.length > 0) {
			const additionalWithIPv4 = dnsResponse.additional.filter((record) => {
				if (record.RDLENGTH === 4) {
					return record;
				}
			});
			const randomAdditional = getRandomEntry(additionalWithIPv4);
			rootNameServerIP = randomAdditional.RDATA.join('.');
			continue;
		}

		// if authority is present while additional is not present simply means, now we have to perform another lookup to get the additional records or basically ip of these authority servers to proceed with the original query
		let validAuthorityRecord: DNSAnswer | undefined;
		if (
			dnsResponse.authority &&
			dnsResponse.authority.length > 0 &&
			(!dnsResponse.additional || dnsResponse.additional.length === 0)
		) {
			// generally all records are valid but other than one all are compressed so rather than de compressing one and choosing 1, am choosing to just pick the one that is not compressed
			const validAuthorityRecords = dnsResponse.authority
				.map((authorityRecord) => {
					return {
						...authorityRecord,
						NAME: decodeRDATA(authorityRecord.RDATA),
					};
				})
				.filter((authorityRecord) => {
					if (isValidDomain(authorityRecord.NAME)) {
						return authorityRecord;
					}
				});
			validAuthorityRecord = getRandomEntry(validAuthorityRecords);
		}

		if (validAuthorityRecord) {
			const res = await recursiveLookup({
				NAME: validAuthorityRecord.NAME,
				TYPE: RECORD_TYPE.A,
				CLASS: validAuthorityRecord.CLASS,
			});

			if (res.length > 0) {
				const randomResponse = getRandomEntry(res);
				// assuming we get valid answers here and we can use any of the ip to continue the loop
				rootNameServerIP = randomResponse.RDATA.join('.');
				continue;
			}
		}
	}
}

