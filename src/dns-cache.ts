import { Redis } from '@upstash/redis';
import { DNSAnswer, DNSQuestion } from './message/types';
import { decodeRDATA } from './utils';

export class DNSCache {
	constructor(private redis: Redis) {}

	async set(question: DNSQuestion, answers: DNSAnswer[]) {
		try {
			if (answers.length === 0) {
				return;
			}

			const baseKey = `${question.NAME}/${question.TYPE}`;
			await this.redis.del(baseKey);
			await this.redis.rpush(
				baseKey,
				answers.map((a) => decodeRDATA(a.RDATA)),
			);
			const promises: Promise<DNSAnswer | 'OK' | null>[] = [];
			for (const answer of answers) {
				const key = `${baseKey}:${decodeRDATA(answer.RDATA)}`;
				promises.push(
					this.redis.set(key, answer, {
						ex: answer.TTL,
					}),
				);
			}

			await Promise.all(promises);
		} catch (error) {
			console.error('Error setting cache', error);
			throw error;
		}
	}

	async get(question: DNSQuestion): Promise<DNSAnswer[]> {
		const baseKey = `${question.NAME}/${question.TYPE}`;

		const [_cache] = await this.redis.lrange(baseKey, 0, -1); // get all elements in the list [[RDATA1, RDATA2, ...]]
		if (!_cache) {
			console.log('cache is empty');
			return [];
		}
		const cache = _cache as unknown as string[]; // convert to string array

		if (cache.length === 0) {
			console.log('cache is empty');
			return [];
		}

		const keys = await this.redis.keys(`${baseKey}:*`);
		if (keys.length !== cache.length) {
			console.log('keys length does not match cache length', { keys, cache });
			return [];
		}

		const answers: DNSAnswer[] = [];
		for (const key of keys) {
			const answer = await this.redis.get<DNSAnswer>(key);
			if (answer) {
				answers.push({
					...answer,
					RDATA: Buffer.from(answer.RDATA), // convert back to buffer
				});
			}
		}

		// cache which is a string array contains the RDATA of the answers, I need my answers array with the same order
		// because in a DNS response, the order of the answers matters (first show CNAME then show underlying A for example)
		return sortDNSAnswers(answers, cache);
	}

	async deleteAll() {
		await this.redis.flushdb();
	}
}

function sortDNSAnswers(answers: DNSAnswer[], cache: string[]): DNSAnswer[] {
	return answers.sort((a, b) => {
		const aIndex = cache.indexOf(decodeRDATA(a.RDATA));
		const bIndex = cache.indexOf(decodeRDATA(b.RDATA));

		if (aIndex === -1 || bIndex === -1) {
			console.warn('RDATA not found in cache:', {
				a: aIndex,
				b: bIndex,
			});
		}

		return aIndex - bIndex;
	});
}

