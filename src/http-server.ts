import express from 'express';
import { RECORD_TYPE } from './message/types';
import { isValidDomain } from './utils';
import dns from 'node:dns';
import { z } from 'zod';

const app = express();
const resolver = new dns.Resolver();

resolver.setServers(['127.0.0.1:2053']);

app.get('/', (_req, res) => {
	res.send('Hello World');
});

const resolveSchema = z.object({
	domain: z.string().refine(isValidDomain, {
		message: 'Invalid domain',
	}),
	type: z.string().refine((val) => parseInt(val) in RECORD_TYPE, {
		message: 'Invalid record type',
	}),
});

app.get('/resolve', (req, res) => {
	try {
		const parsed = resolveSchema.safeParse(req.query);
		if (parsed.error && !parsed.data) {
			res.status(400).send(parsed.error.errors);
		}

		const { domain, type } = parsed.data!;

		resolveDNS(parseInt(type), domain, (err, records) => {
			if (err) {
				res.status(500).send(err.message);
				return;
			}

			res.status(200).json(records);
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
	recordType: RECORD_TYPE,
	domain: string,
	callback: (err: NodeJS.ErrnoException | null, addresses: any) => void,
) {
	console.log('recordType', recordType);
	switch (recordType) {
		case 1:
			resolver.resolve4(domain, callback);
			break;
		case RECORD_TYPE.CNAME:
			resolver.resolveCname(domain, callback);
			break;
		case RECORD_TYPE.MX:
			resolver.resolveMx(domain, callback);
			break;
		case RECORD_TYPE.TXT:
			resolver.resolveTxt(domain, callback);
			break;
			break;
		case RECORD_TYPE.PTR:
			resolver.resolvePtr(domain, callback);
			break;
		case RECORD_TYPE.NS:
			resolver.resolveNs(domain, callback);
			break;
		case RECORD_TYPE.SOA:
			resolver.resolveSoa(domain, callback);
			break;
		default:
			callback(new Error('Unsupported record type'), null);
	}
}

