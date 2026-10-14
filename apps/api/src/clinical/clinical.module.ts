import { Module } from '@nestjs/common';
import { StaffAccessModule } from '../identity/staff-access.module';
import { PrismaService } from '../infrastructure/prisma.service';
import { PatientRepository } from './application/patient-repository';
import { RegisterPatient } from './application/register-patient';
import { PrismaPatientRepository } from './infrastructure/prisma-patient.repository';
import { PatientsController } from './interface/patients.controller';

@Module({
  imports: [StaffAccessModule],
  providers: [
    PrismaService,
    PrismaPatientRepository,
    { provide: PatientRepository, useExisting: PrismaPatientRepository },
    RegisterPatient,
  ],
  controllers: [PatientsController],
  exports: [RegisterPatient],
})
export class ClinicalModule {}
