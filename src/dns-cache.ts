import { DNSAnswer, DNSQuestion } from './message/types';
import { Redis } from '@upstash/redis';
import { decodeRDATA } from './utils';

export class DNSCache {
	constructor(private redis: Redis) {}

	async set(question: DNSQuestion, answers: DNSAnswer[]) {
		try {
			if (answers.length === 0) {
				return;
			}

			const baseKey = `${question.NAME}/${question.TYPE}`;
			await this.redis.set(baseKey, { count: answers.length });

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

		const cache = await this.redis.get<{ count: number }>(baseKey);
		if (!cache) {
			return [];
		}

		const keys = await this.redis.keys(`${baseKey}:*`);
		if (keys.length !== cache.count) {
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

		return answers;
	}

	async deleteAll() {
		await this.redis.flushdb();
	}
}

