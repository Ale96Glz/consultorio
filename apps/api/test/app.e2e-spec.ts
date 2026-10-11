import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

  afterEach(async () => {
    await app.close();
  });
});
