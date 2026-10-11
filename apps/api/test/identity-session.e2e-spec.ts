import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import pg from 'pg';
import request from 'supertest';
import { App } from 'supertest/types';
import { disconnectAuth } from './../src/identity/infrastructure/auth';
import { AppModule } from './../src/app.module';
import { configureHttp } from './../src/configure-http';

const email = `sesion-${crypto.randomUUID()}@consultorio.test`;
const password = 'clave-e2e-sesion';

describe('Identity session (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureHttp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await deleteUser(email);
  });

  afterAll(async () => {
    await disconnectAuth();
  });

  it('devuelve el usuario autenticado por la cookie de sesión', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/sign-up/email')
      .set('Origin', process.env.WEB_ORIGIN ?? 'http://localhost:4200')
      .send({ name: 'Sesion E2E', email, password })
      .expect(200);

    const session = await agent.get('/identity/session').expect(200);

    expect(session.body).toEqual({
      userId: expect.any(String),
      email,
    });
  });

  it('devuelve el miembro de la clínica ligado al usuario', async () => {
    const memberEmail = `miembro-${crypto.randomUUID()}@consultorio.test`;
    const staffId = crypto.randomUUID();
    const agent = request.agent(app.getHttpServer());

    try {
      await agent
        .post('/api/auth/sign-up/email')
        .set('Origin', process.env.WEB_ORIGIN ?? 'http://localhost:4200')
        .send({ name: 'Miembro E2E', email: memberEmail, password })
        .expect(200);

      const session = await agent.get('/identity/session').expect(200);
      await agent.get('/identity/staff').expect(404);

      await insertStaff(staffId, session.body.userId);

      const staff = await agent.get('/identity/staff').expect(200);
      expect(staff.body).toEqual({ staffId, role: 'doctor' });
    } finally {
      await deleteUser(memberEmail);
    }
  });
});

async function deleteUser(userEmail: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return;
  }

  const target = new URL(databaseUrl);
  target.search = '';
  const client = new pg.Client({ connectionString: target.toString() });
  await client.connect();
  try {
    await client.query(
      'DELETE FROM "Staff" WHERE "userId" IN (SELECT id FROM "user" WHERE email = $1)',
      [userEmail],
    );
    await client.query('DELETE FROM "user" WHERE email = $1', [userEmail]);
  } finally {
    await client.end();
  }
}

async function insertStaff(staffId: string, userId: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const target = new URL(databaseUrl);
  target.search = '';
  const client = new pg.Client({ connectionString: target.toString() });
  await client.connect();
  try {
    await client.query(
      'INSERT INTO "Staff" ("id", "userId", "role", "updatedAt") VALUES ($1::uuid, $2, \'doctor\'::"StaffRole", NOW())',
      [staffId, userId],
    );
  } finally {
    await client.end();
  }
}
