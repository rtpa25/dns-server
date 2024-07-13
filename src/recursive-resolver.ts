import { forwardResolver } from './forward-resolver';
import { DNSBuilder } from './message/builder';
import {
	DNSAnswer,
	DNSHeader,
	DNSObject,
	DNSQuestion,
	QRIndicator,
	RCode,
	RECORD_TYPE,
} from './message/types';
import { rootNameServers } from './root-name-server';
import { decodeRDATA, getRandomEntry, isValidDomain } from './utils';

export async function recursiveLookup(
	question: DNSQuestion,
	header: DNSHeader,
) {
	try {
		let rootNameServerIP = getRandomEntry(rootNameServers).ipv4;
		const resolverPort = 53;

		while (true) {
			let rootnameServerIPCopy = rootNameServerIP;

			const requestObject: DNSObject = {
				header,
				questions: [question],
			};
			const requestBuffer = new DNSBuilder(requestObject).toBuffer();
			let dnsResponse = await forwardResolver(
				requestBuffer,
				rootnameServerIPCopy,
				resolverPort,
			);

			// throw error if response is not received
			if (!dnsResponse) {
				throw new Error('No response received');
			}

			// id response is giving an error of NXDOMAIN then return the response
			if (dnsResponse.header.RCODE === RCode.NXDOMAIN) {
				return dnsResponse;
			}

			// if find answer return and end loop
			if (dnsResponse.answers && dnsResponse.answers.length > 0) {
				const answers = dnsResponse.answers;
				const cnameAnswers = answers.filter(
					(answer) => answer.TYPE === RECORD_TYPE.CNAME,
				);
				// if cname record is present then we have to resolve the cname record to get the ip
				// unless user has asked for cname record explicitly
				if (cnameAnswers.length > 0 && question.TYPE !== RECORD_TYPE.CNAME) {
					for (const cnameAnswer of cnameAnswers) {
						const cnameQuestion: DNSQuestion = {
							NAME: decodeRDATA(cnameAnswer.RDATA),
							TYPE: RECORD_TYPE.A,
							CLASS: 1,
						};
						const res = await recursiveLookup(cnameQuestion, header);
						if (res.answers) answers.push(...res.answers);
					}
				}
				const finalResponse: DNSObject = {
					header: {
						...dnsResponse.header,
						ANCOUNT: answers.length,
					},
					answers,
					questions: [question],
				};

				return finalResponse;
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

				// if validAuthorityRecord is a SOA record then return the response with SOA record
				if (validAuthorityRecord.TYPE === RECORD_TYPE.SOA) {
					return {
						header: {
							...header,
							QR: QRIndicator.RESPONSE,
							RCODE: RCode.NXDOMAIN,
							NSCOUNT: dnsResponse.authority ? dnsResponse.authority.length : 0,
						},
						questions: [question],
						authority: dnsResponse.authority || [],
						answers: [],
					} as DNSObject;
				}
			}

			if (validAuthorityRecord) {
				const res = await recursiveLookup(
					{
						NAME: validAuthorityRecord.NAME,
						TYPE: RECORD_TYPE.A,
						CLASS: validAuthorityRecord.CLASS,
					},
					header,
				);

				if (res.answers) {
					const randomResponse = getRandomEntry(res.answers);
					rootNameServerIP = randomResponse.RDATA.join('.');
					continue;
				}
			}

			// If no valid authority record or additional records found, return NXDOMAIN with SOA if possible
			return {
				header: {
					...header,
					QR: QRIndicator.RESPONSE,
					RCODE: RCode.NXDOMAIN,
					NSCOUNT: dnsResponse.authority ? dnsResponse.authority.length : 0,
				},
				questions: [question],
				authority: dnsResponse.authority || [],
				answers: [],
			} as DNSObject;
		}
	} catch (error) {
		console.error('Error in recursiveLookup:', error);
		return {
			header: {
				...header,
				QR: QRIndicator.RESPONSE,
				RCODE: RCode.NXDOMAIN,
			},
			questions: [question],
			authority: [],
			answers: [],
		} as DNSObject;
	}
}

