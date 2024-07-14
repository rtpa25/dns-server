import express, { Request, Response } from 'express';
import { z } from 'zod';
import { forwardResolver } from './forward-resolver';
import { DNSBuilder } from './message/builder';
import {
	Bool,
	DNSObject,
	OPCODE,
	QRIndicator,
	RCode,
	RECORD_TYPE,
	RECORD_TYPE_STRING,
} from './message/types';
import { isValidDomain } from './utils';

const app = express();

const DNS_SERVER_HOST = '127.0.0.1';
const DNS_SERVER_PORT = 2053;

app.get('/', (_req, res) => {
	res.send('Hello World');
});

const resolveSchema = z.object({
	domain: z.string().refine(isValidDomain, {
		message: 'Invalid domain',
	}),
	type: z.nativeEnum(RECORD_TYPE_STRING),
});
type ResolveSchema = z.infer<typeof resolveSchema>;

app.get(
	'/resolve',
	async (req: Request<{}, {}, {}, ResolveSchema>, res: Response) => {
		try {
			const parsed = resolveSchema.safeParse(req.query);
			if (!parsed.success) {
				console.error(parsed.error);
				return res.status(400).send(parsed.error.message);
			}

			const { domain, type } = req.query;

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
						NAME: domain,
						TYPE: RECORD_TYPE[type],
						CLASS: 1,
					},
				],
			};
			const dnsBuilder = new DNSBuilder(dnsRequestObject);
			const requestBuffer = dnsBuilder.toBuffer();

			const response = await forwardResolver(
				requestBuffer,
				DNS_SERVER_HOST,
				DNS_SERVER_PORT,
			);

			res.json(response);
		} catch (error) {
			console.error(error);
			res.status(500).send('Internal server error');
		}
	},
);

app.listen(8080, () => {
	console.log('Server is running on port 8080');
});
