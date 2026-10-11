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
    await client.query('DELETE FROM "user" WHERE email = $1', [userEmail]);
  } finally {
    await client.end();
  }
}
