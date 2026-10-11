import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import {
  PatientUnavailableError,
  ScheduleAppointment,
  StaffCannotAttendError,
} from '../application/schedule-appointment';
import {
  AppointmentOverlapError,
  type Appointment,
  type AppointmentStatus,
} from '../domain/appointment';
import { InvalidDateRangeError } from '../domain/date-range';
import { ScheduleAppointmentDto } from './schedule-appointment.dto';

type ScheduledAppointmentResponse = {
  id: string;
  patientId: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
};

@Controller('scheduling')
@UseGuards(AuthGuard)
export class AppointmentsController {
  constructor(private readonly scheduleAppointment: ScheduleAppointment) {}

  @Post('appointments')
  async schedule(
    @Body() body: ScheduleAppointmentDto,
  ): Promise<ScheduledAppointmentResponse> {
    try {
      const appointment = await this.scheduleAppointment.execute({
        patientId: body.patientId,
        staffId: body.staffId,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
      });

      return toResponse(appointment);
    } catch (error) {
      throw toHttpError(error);
    }
  }
}

function toResponse(appointment: Appointment): ScheduledAppointmentResponse {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    staffId: appointment.staffId,
    startsAt: appointment.dateRange.startsAt.toISOString(),
    endsAt: appointment.dateRange.endsAt.toISOString(),
    status: appointment.currentStatus,
  };
}

function toHttpError(error: unknown): Error {
  if (error instanceof PatientUnavailableError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof StaffCannotAttendError) {
    return new ForbiddenException(error.message);
  }

  if (error instanceof AppointmentOverlapError) {
    return new ConflictException(error.message);
  }

  if (error instanceof InvalidDateRangeError) {
    return new BadRequestException(error.message);
  }

  return error instanceof Error ? error : new Error('Error inesperado.');
}
