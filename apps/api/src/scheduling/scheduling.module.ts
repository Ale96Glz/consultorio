import { Module } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma.service';
import { AppointmentRepository } from './application/appointment-repository';
import { PatientLookup } from './application/patient-lookup';
import { ScheduleAppointment } from './application/schedule-appointment';
import { StaffLookup } from './application/staff-lookup';
import { PrismaAppointmentRepository } from './infrastructure/prisma-appointment.repository';
import { PrismaPatientLookup } from './infrastructure/prisma-patient.lookup';
import { PrismaStaffLookup } from './infrastructure/prisma-staff.lookup';
import { AppointmentsController } from './interface/appointments.controller';

@Module({
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
  ],
  controllers: [AppointmentsController],
  exports: [ScheduleAppointment],
})
export class SchedulingModule {}
