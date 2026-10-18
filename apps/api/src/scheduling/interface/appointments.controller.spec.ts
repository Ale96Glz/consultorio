import { type ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureHttp } from '../../configure-http';
import {
  CurrentStaff,
  StaffUnassignedError,
} from '../../identity/application/current-staff';
import { CancelAppointment } from '../application/cancel-appointment';
import {
  AppointmentNotFoundError,
  ConfirmAppointment,
} from '../application/confirm-appointment';
import {
  PatientUnavailableError,
  ScheduleAppointment,
  StaffCannotAttendError,
} from '../application/schedule-appointment';
import {
  Appointment,
  AppointmentOverlapError,
  AppointmentStatusError,
} from '../domain/appointment';
import { ViewAgenda } from '../application/view-agenda';
import { InvalidDateRangeError } from '../domain/date-range';
import { AppointmentsController } from './appointments.controller';

const patientId = '11111111-1111-4111-8111-111111111111';
const staffId = '22222222-2222-4222-8222-222222222222';
const appointmentId = '33333333-3333-4333-8333-333333333333';
const startsAt = new Date('2026-10-12T15:00:00.000Z');
const endsAt = new Date('2026-10-12T15:30:00.000Z');

const body = {
  patientId,
  staffId,
  startsAt: startsAt.toISOString(),
  endsAt: endsAt.toISOString(),
};

describe('AppointmentsController', () => {
  const schedule = jest.fn();
  const confirm = jest.fn();
  const cancel = jest.fn();
  const agenda = jest.fn();
  const currentStaff = jest.fn();
  let app: INestApplication<App>;

  beforeEach(async () => {
    schedule.mockReset();
    confirm.mockReset();
    cancel.mockReset();
    agenda.mockReset();
    currentStaff.mockReset();
    currentStaff.mockResolvedValue({ id: 'staff-1', role: 'receptionist' });

    const module = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        { provide: ScheduleAppointment, useValue: { execute: schedule } },
        { provide: ConfirmAppointment, useValue: { execute: confirm } },
        { provide: CancelAppointment, useValue: { execute: cancel } },
        { provide: ViewAgenda, useValue: { execute: agenda } },
        { provide: CurrentStaff, useValue: { execute: currentStaff } },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const http = context
            .switchToHttp()
            .getRequest<{ session?: unknown }>();
          http.session = {
            user: { id: 'user-1', email: 'recepcion@consultorio.test' },
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

  it('agenda la cita y responde 201', async () => {
    schedule.mockResolvedValue(
      Appointment.schedule(
        {
          id: appointmentId,
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

    expect(currentStaff).toHaveBeenCalledWith('user-1');
    expect(schedule).toHaveBeenCalledWith({
      patientId,
      staffId,
      startsAt,
      endsAt,
    });
    expect(response.body).toEqual({
      id: appointmentId,
      patientId,
      staffId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: 'pendiente',
    });
  });

  it('responde 404 si el paciente no está activo', async () => {
    schedule.mockRejectedValue(new PatientUnavailableError());

    const response = await request(app.getHttpServer())
      .post('/scheduling/appointments')
      .send(body)
      .expect(404);

    expect(response.body.message).toBe(
      'No se agenda una cita si el paciente no está activo.',
    );
  });

  it('responde 403 si quien atiende no es doctor', async () => {
    schedule.mockRejectedValue(new StaffCannotAttendError());

    const response = await request(app.getHttpServer())
      .post('/scheduling/appointments')
      .send(body)
      .expect(403);

    expect(response.body.message).toBe(
      'Solo un doctor puede atender una cita.',
    );
  });

  it('responde 409 si el horario se solapa', async () => {
    schedule.mockRejectedValue(new AppointmentOverlapError());

    const response = await request(app.getHttpServer())
      .post('/scheduling/appointments')
      .send(body)
      .expect(409);

    expect(response.body.message).toBe(
      'Dos citas activas del mismo profesional se solapan.',
    );
  });

  it('responde 400 si el rango de la cita es inválido', async () => {
    schedule.mockRejectedValue(new InvalidDateRangeError());

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

    expect(currentStaff).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });

  it('responde 404 si quien agenda no es miembro de la clínica', async () => {
    currentStaff.mockRejectedValue(new StaffUnassignedError());

    const response = await request(app.getHttpServer())
      .post('/scheduling/appointments')
      .send(body)
      .expect(404);

    expect(response.body.message).toBe(
      'Este usuario no es miembro de la clínica.',
    );
    expect(schedule).not.toHaveBeenCalled();
  });

  it('confirma la cita y responde 200', async () => {
    confirm.mockResolvedValue(
      Appointment.rehydrate({
        id: appointmentId,
        patientId,
        staffId,
        startsAt,
        endsAt,
        status: 'confirmada',
      }),
    );

    const response = await request(app.getHttpServer())
      .post(`/scheduling/appointments/${appointmentId}/confirm`)
      .expect(200);

    expect(currentStaff).toHaveBeenCalledWith('user-1');
    expect(confirm).toHaveBeenCalledWith({ appointmentId });
    expect(response.body).toEqual({
      id: appointmentId,
      patientId,
      staffId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: 'confirmada',
    });
  });

  it('responde 404 si la cita no existe', async () => {
    confirm.mockRejectedValue(new AppointmentNotFoundError());

    const response = await request(app.getHttpServer())
      .post(`/scheduling/appointments/${appointmentId}/confirm`)
      .expect(404);

    expect(response.body.message).toBe('La cita no existe.');
  });

  it('responde 409 si la cita no está pendiente', async () => {
    confirm.mockRejectedValue(new AppointmentStatusError());

    const response = await request(app.getHttpServer())
      .post(`/scheduling/appointments/${appointmentId}/confirm`)
      .expect(409);

    expect(response.body.message).toBe(
      'Solo una cita pendiente puede confirmarse.',
    );
  });

  it('responde 400 si el id no es un UUID', async () => {
    await request(app.getHttpServer())
      .post('/scheduling/appointments/no-es-uuid/confirm')
      .expect(400);

    expect(currentStaff).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('responde 404 si quien confirma no es miembro de la clínica', async () => {
    currentStaff.mockRejectedValue(new StaffUnassignedError());

    const response = await request(app.getHttpServer())
      .post(`/scheduling/appointments/${appointmentId}/confirm`)
      .expect(404);

    expect(response.body.message).toBe(
      'Este usuario no es miembro de la clínica.',
    );
    expect(confirm).not.toHaveBeenCalled();
  });

  it('cancela la cita y responde 200', async () => {
    cancel.mockResolvedValue(
      Appointment.rehydrate({
        id: appointmentId,
        patientId,
        staffId,
        startsAt,
        endsAt,
        status: 'cancelada',
      }),
    );

    const response = await request(app.getHttpServer())
      .post(`/scheduling/appointments/${appointmentId}/cancel`)
      .expect(200);

    expect(currentStaff).toHaveBeenCalledWith('user-1');
    expect(cancel).toHaveBeenCalledWith({ appointmentId });
    expect(response.body).toEqual({
      id: appointmentId,
      patientId,
      staffId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: 'cancelada',
    });
  });

  it('responde 404 si la cita a cancelar no existe', async () => {
    cancel.mockRejectedValue(new AppointmentNotFoundError());

    const response = await request(app.getHttpServer())
      .post(`/scheduling/appointments/${appointmentId}/cancel`)
      .expect(404);

    expect(response.body.message).toBe('La cita no existe.');
  });

  it('responde 400 si el id a cancelar no es un UUID', async () => {
    await request(app.getHttpServer())
      .post('/scheduling/appointments/no-es-uuid/cancel')
      .expect(400);

    expect(currentStaff).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it('responde 404 si quien cancela no es miembro de la clínica', async () => {
    currentStaff.mockRejectedValue(new StaffUnassignedError());

    const response = await request(app.getHttpServer())
      .post(`/scheduling/appointments/${appointmentId}/cancel`)
      .expect(404);

    expect(response.body.message).toBe(
      'Este usuario no es miembro de la clínica.',
    );
    expect(cancel).not.toHaveBeenCalled();
  });

  it('devuelve la agenda del doctor y responde 200', async () => {
    agenda.mockResolvedValue([
      Appointment.rehydrate({
        id: appointmentId,
        patientId,
        staffId,
        startsAt,
        endsAt,
        status: 'pendiente',
      }),
    ]);

    const response = await request(app.getHttpServer())
      .get(`/scheduling/agenda/${staffId}`)
      .expect(200);

    expect(currentStaff).toHaveBeenCalledWith('user-1');
    expect(agenda).toHaveBeenCalledWith({ staffId });
    expect(response.body).toEqual([
      {
        id: appointmentId,
        patientId,
        staffId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: 'pendiente',
      },
    ]);
  });

  it('responde 403 si la agenda no es de un doctor', async () => {
    agenda.mockRejectedValue(new StaffCannotAttendError());

    const response = await request(app.getHttpServer())
      .get(`/scheduling/agenda/${staffId}`)
      .expect(403);

    expect(response.body.message).toBe(
      'Solo un doctor puede atender una cita.',
    );
  });

  it('responde 400 si el id del doctor no es un UUID', async () => {
    await request(app.getHttpServer())
      .get('/scheduling/agenda/no-es-uuid')
      .expect(400);

    expect(currentStaff).not.toHaveBeenCalled();
    expect(agenda).not.toHaveBeenCalled();
  });

  it('responde 404 si quien consulta la agenda no es miembro de la clínica', async () => {
    currentStaff.mockRejectedValue(new StaffUnassignedError());

    const response = await request(app.getHttpServer())
      .get(`/scheduling/agenda/${staffId}`)
      .expect(404);

    expect(response.body.message).toBe(
      'Este usuario no es miembro de la clínica.',
    );
    expect(agenda).not.toHaveBeenCalled();
  });
});
