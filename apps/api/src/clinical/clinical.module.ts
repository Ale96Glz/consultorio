import { Module } from '@nestjs/common';
import { StaffAccessModule } from '../identity/staff-access.module';
import { PrismaService } from '../infrastructure/prisma.service';
import { AssignDoctor } from './application/assign-doctor';
import { AssignmentRepository } from './application/assignment-repository';
import { DeactivatePatient } from './application/deactivate-patient';
import { PatientRepository } from './application/patient-repository';
import { RegisterPatient } from './application/register-patient';
import { StaffById } from './application/staff-by-id';
import { PrismaAssignmentRepository } from './infrastructure/prisma-assignment.repository';
import { PrismaPatientRepository } from './infrastructure/prisma-patient.repository';
import { PrismaStaffById } from './infrastructure/prisma-staff-by-id';
import { AssignmentsController } from './interface/assignments.controller';
import { PatientsController } from './interface/patients.controller';

@Module({
  imports: [StaffAccessModule],
  providers: [
    PrismaService,
    PrismaPatientRepository,
    PrismaAssignmentRepository,
    PrismaStaffById,
    { provide: PatientRepository, useExisting: PrismaPatientRepository },
    { provide: AssignmentRepository, useExisting: PrismaAssignmentRepository },
    { provide: StaffById, useExisting: PrismaStaffById },
    RegisterPatient,
    DeactivatePatient,
    AssignDoctor,
  ],
  controllers: [PatientsController, AssignmentsController],
  exports: [RegisterPatient, DeactivatePatient, AssignDoctor],
})
export class ClinicalModule {}
