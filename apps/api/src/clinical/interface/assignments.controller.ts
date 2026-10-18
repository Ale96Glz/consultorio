import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  NotFoundException,
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
  AssignDoctor,
  PatientNotAssignableError,
} from '../application/assign-doctor';
import {
  DuplicateAssignmentError,
  StaffCannotBeAssignedError,
  type Assignment,
} from '../domain/assignment';
import { AssignDoctorDto } from './assign-doctor.dto';

type AssignedDoctorResponse = {
  id: string;
  staffId: string;
  patientId: string;
};

@Controller('clinical')
@UseGuards(AuthGuard)
export class AssignmentsController {
  constructor(
    private readonly currentStaff: CurrentStaff,
    private readonly assignDoctor: AssignDoctor,
  ) {}

  @Post('assignments')
  async assign(
    @Session() session: UserSession,
    @Body() body: AssignDoctorDto,
  ): Promise<AssignedDoctorResponse> {
    try {
      await this.currentStaff.execute(session.user.id);
      const assignment = await this.assignDoctor.execute({
        staffId: body.staffId,
        patientId: body.patientId,
      });

      return toResponse(assignment);
    } catch (error) {
      throw toHttpError(error);
    }
  }
}

function toResponse(assignment: Assignment): AssignedDoctorResponse {
  return {
    id: assignment.id,
    staffId: assignment.staffId,
    patientId: assignment.patientId,
  };
}

function toHttpError(error: unknown): Error {
  if (error instanceof StaffCannotBeAssignedError) {
    return new ForbiddenException(error.message);
  }

  if (error instanceof PatientNotAssignableError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof DuplicateAssignmentError) {
    return new ConflictException(error.message);
  }

  if (error instanceof StaffUnassignedError) {
    return new NotFoundException(error.message);
  }

  return error instanceof Error ? error : new Error('Error inesperado.');
}
