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
import {
  AssignDoctor,
  PatientNotAssignableError,
} from '../application/assign-doctor';
import {
  Assignment,
  DuplicateAssignmentError,
  StaffCannotBeAssignedError,
} from '../domain/assignment';
import { AssignmentsController } from './assignments.controller';

const staffId = '22222222-2222-4222-8222-222222222222';
const patientId = '11111111-1111-4111-8111-111111111111';

const body = { staffId, patientId };

describe('AssignmentsController', () => {
  const assign = jest.fn();
  const currentStaff = jest.fn();
  let app: INestApplication<App>;

  beforeEach(async () => {
    assign.mockReset();
    currentStaff.mockReset();
    currentStaff.mockResolvedValue({ id: 'staff-1', role: 'receptionist' });

    const module = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [
        { provide: AssignDoctor, useValue: { execute: assign } },
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

  it('asigna el doctor y responde 201', async () => {
    assign.mockResolvedValue(
      Assignment.assign(
        {
          id: 'assignment-1',
          staffId,
          patientId,
          role: 'doctor',
        },
        [],
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/clinical/assignments')
      .send(body)
      .expect(201);

    expect(currentStaff).toHaveBeenCalledWith('user-1');
    expect(assign).toHaveBeenCalledWith({ staffId, patientId });
    expect(response.body).toEqual({
      id: 'assignment-1',
      staffId,
      patientId,
    });
  });

  it('responde 403 si el miembro no es doctor', async () => {
    assign.mockRejectedValue(new StaffCannotBeAssignedError());

    const response = await request(app.getHttpServer())
      .post('/clinical/assignments')
      .send(body)
      .expect(403);

    expect(response.body.message).toBe(
      'Solo un doctor puede asignarse a un paciente.',
    );
  });

  it('responde 404 si el paciente no está activo', async () => {
    assign.mockRejectedValue(new PatientNotAssignableError());

    const response = await request(app.getHttpServer())
      .post('/clinical/assignments')
      .send(body)
      .expect(404);

    expect(response.body.message).toBe(
      'No se asigna un doctor si el paciente no está activo.',
    );
  });

  it('responde 409 si el doctor ya está asignado a ese paciente', async () => {
    assign.mockRejectedValue(new DuplicateAssignmentError());

    const response = await request(app.getHttpServer())
      .post('/clinical/assignments')
      .send(body)
      .expect(409);

    expect(response.body.message).toBe(
      'Ese doctor ya está asignado a ese paciente.',
    );
  });

  it('responde 400 si falta el doctor', async () => {
    await request(app.getHttpServer())
      .post('/clinical/assignments')
      .send({ ...body, staffId: undefined })
      .expect(400);

    expect(currentStaff).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it('responde 404 si quien asigna no es miembro de la clínica', async () => {
    currentStaff.mockRejectedValue(new StaffUnassignedError());

    const response = await request(app.getHttpServer())
      .post('/clinical/assignments')
      .send(body)
      .expect(404);

    expect(response.body.message).toBe(
      'Este usuario no es miembro de la clínica.',
    );
    expect(assign).not.toHaveBeenCalled();
  });
});
