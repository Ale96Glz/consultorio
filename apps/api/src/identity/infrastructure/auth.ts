import { prismaAdapter } from '@better-auth/prisma-adapter';
import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { PrismaClient } from '../../../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

if (!secret) {
  throw new Error('BETTER_AUTH_SECRET is not set');
}

if (!baseURL) {
  throw new Error('BETTER_AUTH_URL is not set');
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

export async function disconnectAuth(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}

export const auth = betterAuth({
  secret,
  baseURL,
  trustedOrigins: [process.env.WEB_ORIGIN ?? 'http://localhost:4200'],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});
