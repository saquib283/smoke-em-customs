import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

/**
 * Singleton Prisma 8 database client for Smoke M Customs.
 * 
 * Uses the Prisma 8 ORM runtime with the emitted contract.
 * In development, the global singleton pattern prevents
 * connection pool exhaustion from HMR.
 */

const globalForDb = globalThis as unknown as {
  __db: ReturnType<typeof postgres<Contract>> | undefined;
};

export const db =
  globalForDb.__db ??
  postgres<Contract>({
    contractJson,
    url: process.env['DATABASE_URL']!,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__db = db;
}
