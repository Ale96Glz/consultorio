import { Module } from '@nestjs/common';
import { StaffAccessModule } from '../identity/staff-access.module';
import { PrismaService } from '../infrastructure/prisma.service';
import { AppointmentRepository } from './application/appointment-repository';
import { CancelAppointment } from './application/cancel-appointment';
import { ConfirmAppointment } from './application/confirm-appointment';
import { PatientLookup } from './application/patient-lookup';
import { ScheduleAppointment } from './application/schedule-appointment';
import { StaffLookup } from './application/staff-lookup';
import { ViewAgenda } from './application/view-agenda';
import { PrismaAppointmentRepository } from './infrastructure/prisma-appointment.repository';
import { PrismaPatientLookup } from './infrastructure/prisma-patient.lookup';
import { PrismaStaffLookup } from './infrastructure/prisma-staff.lookup';
import { AppointmentsController } from './interface/appointments.controller';

@Module({
  imports: [StaffAccessModule],
  providers: [
    PrismaService,
    PrismaAppointmentRepository,
    PrismaPatientLookup,
    PrismaStaffLookup,
    {
      provide: AppointmentRepository,
      useExisting: PrismaAppointmentRepository,
    },
    { provide: PatientLookup, useExisting: PrismaPatientLookup },
    { provide: StaffLookup, useExisting: PrismaStaffLookup },
    ScheduleAppointment,
    ConfirmAppointment,
    CancelAppointment,
    ViewAgenda,
  ],
  controllers: [AppointmentsController],
  exports: [
    ScheduleAppointment,
    ConfirmAppointment,
    CancelAppointment,
    ViewAgenda,
  ],
})
export class SchedulingModule {}
