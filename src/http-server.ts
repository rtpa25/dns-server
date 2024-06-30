import express from 'express';
import dns from 'node:dns';
import { z } from 'zod';
import { isValidDomain } from './utils';

const app = express();
const resolver = new dns.Resolver();

enum REQUEST_RECORD_TYPES {
	A = 'A',
	NS = 'NS',
	CNAME = 'CNAME',
	SOA = 'SOA',
	PTR = 'PTR',
	MX = 'MX',
	TXT = 'TXT',
}

resolver.setServers(['127.0.0.1:2053']);

app.get('/', (_req, res) => {
	res.send('Hello World');
});

const resolveSchema = z.object({
	domain: z.string().refine(isValidDomain, {
		message: 'Invalid domain',
	}),
	type: z.nativeEnum(REQUEST_RECORD_TYPES),
});

app.get('/resolve', (req, res) => {
	try {
		const parsed = resolveSchema.safeParse(req.query);
		if (!parsed.success) {
			console.error(parsed.error);
			return res.status(400).send(parsed.error.message);
		}

		const { domain, type } = parsed.data;

		resolveDNS(type, domain, (err, records) => {
			if (err) {
				console.error(err);
				return res.status(500).json(err.message);
			}

			return res.status(200).json(records);
		});
	} catch (error) {
		console.error(error);
		res.status(500).send('Internal server error');
	}
});

app.listen(8080, () => {
	console.log('Server is running on port 8080');
});

function resolveDNS(
	recordType: REQUEST_RECORD_TYPES,
	domain: string,
	callback: (err: NodeJS.ErrnoException | null, addresses: any) => void,
) {
	switch (recordType) {
		case REQUEST_RECORD_TYPES.A:
			resolver.resolve4(domain, callback);
			break;
		case REQUEST_RECORD_TYPES.CNAME:
			resolver.resolveCname(domain, callback);
			break;
		case REQUEST_RECORD_TYPES.MX:
			resolver.resolveMx(domain, callback);
			break;
		case REQUEST_RECORD_TYPES.TXT:
			resolver.resolveTxt(domain, callback);
			break;
		case REQUEST_RECORD_TYPES.PTR:
			resolver.resolvePtr(domain, callback);
			break;
		case REQUEST_RECORD_TYPES.NS:
			resolver.resolveNs(domain, callback);
			break;
		case REQUEST_RECORD_TYPES.SOA:
			resolver.resolveSoa(domain, callback);
			break;
		default:
			callback(new Error('Unsupported record type'), null);
	}
}

