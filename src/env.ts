import { z } from 'zod';

const envSchema = z.object({
	REDIS_URL: z.string().url(),
	REDIS_TOKEN: z.string().min(1),
	NODE_ENV: z.enum(['development', 'production', 'staging']).optional(),
});

function createEnv(env: NodeJS.ProcessEnv) {
	const safeParseResult = envSchema.safeParse(env);
	if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
	return safeParseResult.data;
}

export const env = createEnv(process.env);

