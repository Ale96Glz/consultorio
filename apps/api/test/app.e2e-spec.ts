import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureHttp } from './../src/configure-http';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureHttp(app);
    await app.init();
  });

  it('GET /health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /api/auth/ok', () => {
    return request(app.getHttpServer()).get('/api/auth/ok').expect(200);
  });

  it('GET /identity/session sin cookie', () => {
    return request(app.getHttpServer()).get('/identity/session').expect(401);
  });

  it('POST /scheduling/appointments sin cookie', () => {
    return request(app.getHttpServer())
      .post('/scheduling/appointments')
      .send({
        patientId: '11111111-1111-4111-8111-111111111111',
        staffId: '22222222-2222-4222-8222-222222222222',
        startsAt: '2026-10-12T15:00:00.000Z',
        endsAt: '2026-10-12T15:30:00.000Z',
      })
      .expect(401);
  });

  it('POST /scheduling/appointments/:id/confirm sin cookie', () => {
    return request(app.getHttpServer())
      .post(
        '/scheduling/appointments/33333333-3333-4333-8333-333333333333/confirm',
      )
      .expect(401);
  });

  it('POST /clinical/patients sin cookie', () => {
    return request(app.getHttpServer())
      .post('/clinical/patients')
      .send({
        givenNames: 'Ana',
        familyName: 'Ruiz',
        documentId: 'CURP900412HDFRRL09',
        phone: '5555550100',
        birthDate: '1990-04-12',
      })
      .expect(401);
  });

  it('POST /clinical/patients/:id/deactivate sin cookie', () => {
    return request(app.getHttpServer())
      .post(
        '/clinical/patients/44444444-4444-4444-8444-444444444444/deactivate',
      )
      .expect(401);
  });

  it('POST /scheduling/appointments/:id/cancel sin cookie', () => {
    return request(app.getHttpServer())
      .post(
        '/scheduling/appointments/33333333-3333-4333-8333-333333333333/cancel',
      )
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
