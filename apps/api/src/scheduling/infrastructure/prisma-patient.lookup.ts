import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import {
  PatientLookup,
  type PatientSnapshot,
} from '../application/patient-lookup';

@Injectable()
export class PrismaPatientLookup extends PatientLookup {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(patientId: string): Promise<PatientSnapshot | null> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, deletedAt: true },
    });

    if (!patient) {
      return null;
    }

    return { id: patient.id, deletedAt: patient.deletedAt };
  }
}
