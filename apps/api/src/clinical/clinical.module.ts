import { Module } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma.service';
import { PatientRepository } from './application/patient-repository';
import { RegisterPatient } from './application/register-patient';
import { PrismaPatientRepository } from './infrastructure/prisma-patient.repository';

@Module({
  providers: [
    PrismaService,
    PrismaPatientRepository,
    { provide: PatientRepository, useExisting: PrismaPatientRepository },
    RegisterPatient,
  ],
  exports: [RegisterPatient],
})
export class ClinicalModule {}
