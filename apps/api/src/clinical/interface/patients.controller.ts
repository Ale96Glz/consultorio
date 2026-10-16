import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import {
  CurrentStaff,
  StaffUnassignedError,
} from '../../identity/application/current-staff';
import {
  DeactivatePatient,
  PatientNotFoundError,
} from '../application/deactivate-patient';
import { RegisterPatient } from '../application/register-patient';
import { InvalidDocumentIdError } from '../domain/document-id';
import { DuplicateDocumentIdError, type Patient } from '../domain/patient';
import { RegisterPatientDto } from './register-patient.dto';

type RegisteredPatientResponse = {
  id: string;
  givenNames: string;
  familyName: string;
  documentId: string;
  phone: string;
  birthDate: string;
};

type DeactivatedPatientResponse = RegisteredPatientResponse & {
  deletedAt: string;
};

@Controller('clinical')
@UseGuards(AuthGuard)
export class PatientsController {
  constructor(
    private readonly currentStaff: CurrentStaff,
    private readonly registerPatient: RegisterPatient,
    private readonly deactivatePatient: DeactivatePatient,
  ) {}

  @Post('patients')
  async register(
    @Session() session: UserSession,
    @Body() body: RegisterPatientDto,
  ): Promise<RegisteredPatientResponse> {
    try {
      await this.currentStaff.execute(session.user.id);
      const patient = await this.registerPatient.execute({
        givenNames: body.givenNames,
        familyName: body.familyName,
        documentId: body.documentId,
        phone: body.phone,
        birthDate: new Date(body.birthDate),
      });

      return toResponse(patient);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post('patients/:id/deactivate')
  @HttpCode(200)
  async deactivate(
    @Session() session: UserSession,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeactivatedPatientResponse> {
    try {
      await this.currentStaff.execute(session.user.id);
      const patient = await this.deactivatePatient.execute({ patientId: id });
      return toDeactivatedResponse(patient);
    } catch (error) {
      throw toHttpError(error);
    }
  }
}

function toResponse(patient: Patient): RegisteredPatientResponse {
  return {
    id: patient.id,
    givenNames: patient.givenNames,
    familyName: patient.familyName,
    documentId: patient.documentId.value,
    phone: patient.phone,
    birthDate: patient.birthDate.toISOString().slice(0, 10),
  };
}

function toDeactivatedResponse(patient: Patient): DeactivatedPatientResponse {
  if (!patient.deletedAt) {
    throw new Error('La ficha no quedó dada de baja.');
  }

  return {
    ...toResponse(patient),
    deletedAt: patient.deletedAt.toISOString(),
  };
}

function toHttpError(error: unknown): Error {
  if (error instanceof DuplicateDocumentIdError) {
    return new ConflictException(error.message);
  }

  if (error instanceof InvalidDocumentIdError) {
    return new BadRequestException(error.message);
  }

  if (error instanceof PatientNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof StaffUnassignedError) {
    return new NotFoundException(error.message);
  }

  return error instanceof Error ? error : new Error('Error inesperado.');
}
