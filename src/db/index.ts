import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || '';

// Create neon SQL client
const client = neon(connectionString);

export const db = drizzle(client, { schema });
export * from './schema';
