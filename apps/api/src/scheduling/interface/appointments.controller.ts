import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
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
  AppointmentOverlapError,
  AppointmentStatusError,
  type Appointment,
  type AppointmentStatus,
} from '../domain/appointment';
import { ViewAgenda } from '../application/view-agenda';
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
  constructor(
    private readonly currentStaff: CurrentStaff,
    private readonly scheduleAppointment: ScheduleAppointment,
    private readonly confirmAppointment: ConfirmAppointment,
    private readonly cancelAppointment: CancelAppointment,
    private readonly viewAgenda: ViewAgenda,
  ) {}

  @Post('appointments')
  async schedule(
    @Session() session: UserSession,
    @Body() body: ScheduleAppointmentDto,
  ): Promise<ScheduledAppointmentResponse> {
    try {
      await this.currentStaff.execute(session.user.id);
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

  @Post('appointments/:id/confirm')
  @HttpCode(200)
  async confirm(
    @Session() session: UserSession,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScheduledAppointmentResponse> {
    try {
      await this.currentStaff.execute(session.user.id);
      const appointment = await this.confirmAppointment.execute({
        appointmentId: id,
      });

      return toResponse(appointment);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Post('appointments/:id/cancel')
  @HttpCode(200)
  async cancel(
    @Session() session: UserSession,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScheduledAppointmentResponse> {
    try {
      await this.currentStaff.execute(session.user.id);
      const appointment = await this.cancelAppointment.execute({
        appointmentId: id,
      });

      return toResponse(appointment);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Get('agenda/:staffId')
  async agenda(
    @Session() session: UserSession,
    @Param('staffId', ParseUUIDPipe) staffId: string,
  ): Promise<ScheduledAppointmentResponse[]> {
    try {
      await this.currentStaff.execute(session.user.id);
      const appointments = await this.viewAgenda.execute({ staffId });
      return appointments.map((appointment) => toResponse(appointment));
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

  if (error instanceof AppointmentNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof AppointmentStatusError) {
    return new ConflictException(error.message);
  }

  if (error instanceof StaffUnassignedError) {
    return new NotFoundException(error.message);
  }

  return error instanceof Error ? error : new Error('Error inesperado.');
}
