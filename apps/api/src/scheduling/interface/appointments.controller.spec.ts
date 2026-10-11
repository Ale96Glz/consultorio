import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureHttp } from '../../configure-http';
import {
  PatientUnavailableError,
  ScheduleAppointment,
  StaffCannotAttendError,
} from '../application/schedule-appointment';
import { Appointment, AppointmentOverlapError } from '../domain/appointment';
import { InvalidDateRangeError } from '../domain/date-range';
import { AppointmentsController } from './appointments.controller';

const patientId = '11111111-1111-4111-8111-111111111111';
const staffId = '22222222-2222-4222-8222-222222222222';
const startsAt = new Date('2026-10-12T15:00:00.000Z');
const endsAt = new Date('2026-10-12T15:30:00.000Z');

const body = {
  patientId,
  staffId,
  startsAt: startsAt.toISOString(),
  endsAt: endsAt.toISOString(),
};

describe('AppointmentsController', () => {
  const execute = jest.fn();
  let app: INestApplication<App>;

  beforeEach(async () => {
    execute.mockReset();

    const module = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [{ provide: ScheduleAppointment, useValue: { execute } }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    configureHttp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('agenda la cita y responde 201', async () => {
    execute.mockResolvedValue(
      Appointment.schedule(
        {
          id: '33333333-3333-4333-8333-333333333333',
          patientId,
          staffId,
          startsAt,
          endsAt,
        },
        [],
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/scheduling/appointments')
      .send(body)
      .expect(201);

    expect(execute).toHaveBeenCalledWith({
      patientId,
      staffId,
      startsAt,
      endsAt,
    });
    expect(response.body).toEqual({
      id: '33333333-3333-4333-8333-333333333333',
      patientId,
      staffId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: 'pendiente',
    });
  });

  it('responde 404 si el paciente no está activo', async () => {
    execute.mockRejectedValue(new PatientUnavailableError());

    const response = await request(app.getHttpServer())
      .post('/scheduling/appointments')
      .send(body)
      .expect(404);

    expect(response.body.message).toBe(
      'No se agenda una cita si el paciente no está activo.',
    );
  });

  it('responde 403 si quien atiende no es doctor', async () => {
    execute.mockRejectedValue(new StaffCannotAttendError());

    const response = await request(app.getHttpServer())
      .post('/scheduling/appointments')
      .send(body)
      .expect(403);

    expect(response.body.message).toBe(
      'Solo un doctor puede atender una cita.',
    );
  });

  it('responde 409 si el horario se solapa', async () => {
    execute.mockRejectedValue(new AppointmentOverlapError());

    const response = await request(app.getHttpServer())
      .post('/scheduling/appointments')
      .send(body)
      .expect(409);

    expect(response.body.message).toBe(
      'Dos citas activas del mismo profesional se solapan.',
    );
  });

  it('responde 400 si el rango de la cita es inválido', async () => {
    execute.mockRejectedValue(new InvalidDateRangeError());

    const response = await request(app.getHttpServer())
      .post('/scheduling/appointments')
      .send(body)
      .expect(400);

    expect(response.body.message).toBe(
      'El fin de la cita tiene que ser posterior al inicio.',
    );
  });

  it('responde 400 si el body no trae un paciente', async () => {
    await request(app.getHttpServer())
      .post('/scheduling/appointments')
      .send({ ...body, patientId: undefined })
      .expect(400);

    expect(execute).not.toHaveBeenCalled();
  });
});
