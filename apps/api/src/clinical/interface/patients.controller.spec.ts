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
import { RegisterPatient } from '../application/register-patient';
import { InvalidDocumentIdError } from '../domain/document-id';
import { DuplicateDocumentIdError, Patient } from '../domain/patient';
import { PatientsController } from './patients.controller';

const birthDate = new Date('1990-04-12');

const body = {
  givenNames: 'Ana',
  familyName: 'Ruiz',
  documentId: 'CURP900412HDFRRL09',
  phone: '5555550100',
  birthDate: '1990-04-12',
};

describe('PatientsController', () => {
  const register = jest.fn();
  const currentStaff = jest.fn();
  let app: INestApplication<App>;

  beforeEach(async () => {
    register.mockReset();
    currentStaff.mockReset();
    currentStaff.mockResolvedValue({ id: 'staff-1', role: 'receptionist' });

    const module = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        { provide: RegisterPatient, useValue: { execute: register } },
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

  it('registra la ficha y responde 201', async () => {
    register.mockResolvedValue(
      Patient.register(
        {
          id: 'patient-1',
          givenNames: body.givenNames,
          familyName: body.familyName,
          documentId: body.documentId,
          phone: body.phone,
          birthDate,
        },
        [],
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/clinical/patients')
      .send(body)
      .expect(201);

    expect(currentStaff).toHaveBeenCalledWith('user-1');
    expect(register).toHaveBeenCalledWith({
      givenNames: body.givenNames,
      familyName: body.familyName,
      documentId: body.documentId,
      phone: body.phone,
      birthDate,
    });
    expect(response.body).toEqual({
      id: 'patient-1',
      givenNames: 'Ana',
      familyName: 'Ruiz',
      documentId: 'CURP900412HDFRRL09',
      phone: '5555550100',
      birthDate: '1990-04-12',
    });
  });

  it('responde 409 si el documento ya está en una ficha activa', async () => {
    register.mockRejectedValue(new DuplicateDocumentIdError());

    const response = await request(app.getHttpServer())
      .post('/clinical/patients')
      .send(body)
      .expect(409);

    expect(response.body.message).toBe(
      'Ya existe una ficha activa con ese documento.',
    );
  });

  it('responde 400 si el documento está vacío', async () => {
    register.mockRejectedValue(new InvalidDocumentIdError());

    const response = await request(app.getHttpServer())
      .post('/clinical/patients')
      .send({ ...body, documentId: '   ' })
      .expect(400);

    expect(response.body.message).toBe(
      'El documento de identidad no puede estar vacío.',
    );
  });

  it('responde 400 si faltan los nombres', async () => {
    await request(app.getHttpServer())
      .post('/clinical/patients')
      .send({ ...body, givenNames: undefined })
      .expect(400);

    expect(currentStaff).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });

  it('responde 404 si quien registra no es miembro de la clínica', async () => {
    currentStaff.mockRejectedValue(new StaffUnassignedError());

    const response = await request(app.getHttpServer())
      .post('/clinical/patients')
      .send(body)
      .expect(404);

    expect(response.body.message).toBe(
      'Este usuario no es miembro de la clínica.',
    );
    expect(register).not.toHaveBeenCalled();
  });
});
