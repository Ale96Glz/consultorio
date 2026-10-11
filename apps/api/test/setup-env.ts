import 'dotenv/config';

process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5432/consultorio?schema=public';
process.env.BETTER_AUTH_SECRET ??= 'test-secret-test-secret-test-secret';
process.env.BETTER_AUTH_URL ??= 'http://localhost:3000';
process.env.WEB_ORIGIN ??= 'http://localhost:4200';
