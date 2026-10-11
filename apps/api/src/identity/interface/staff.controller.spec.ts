import { type ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureHttp } from '../../configure-http';
import {
  CurrentStaff,
  StaffUnassignedError,
} from '../application/current-staff';
import { StaffController } from './staff.controller';

describe('StaffController', () => {
  const execute = jest.fn();
  let app: INestApplication<App>;

  beforeEach(async () => {
    execute.mockReset();

    const module = await Test.createTestingModule({
      controllers: [StaffController],
      providers: [{ provide: CurrentStaff, useValue: { execute } }],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const http = context
            .switchToHttp()
            .getRequest<{ session?: unknown }>();
          http.session = {
            user: { id: 'user-1', email: 'miembro@consultorio.test' },
          };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    configureHttp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve el miembro de la clínica y responde 200', async () => {
    execute.mockResolvedValue({ id: 'staff-1', role: 'doctor' });

    const response = await request(app.getHttpServer())
      .get('/identity/staff')
      .expect(200);

    expect(execute).toHaveBeenCalledWith('user-1');
    expect(response.body).toEqual({ staffId: 'staff-1', role: 'doctor' });
  });

  it('responde 404 si el usuario no es miembro', async () => {
    execute.mockRejectedValue(new StaffUnassignedError());

    const response = await request(app.getHttpServer())
      .get('/identity/staff')
      .expect(404);

    expect(response.body.message).toBe(
      'Este usuario no es miembro de la clínica.',
    );
  });
});
