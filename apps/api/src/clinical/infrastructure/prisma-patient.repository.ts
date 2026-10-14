import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { PatientRepository } from '../application/patient-repository';
import { Patient } from '../domain/patient';

@Injectable()
export class PrismaPatientRepository extends PatientRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findActiveByDocument(documentId: string): Promise<Patient[]> {
    const rows = await this.prisma.patient.findMany({
      where: { documentId, deletedAt: null },
    });

    return rows.map((row) =>
      Patient.rehydrate({
        id: row.id,
        givenNames: row.givenNames,
        familyName: row.familyName,
        documentId: row.documentId,
        phone: row.phone,
        birthDate: row.birthDate,
        deletedAt: row.deletedAt,
      }),
    );
  }

  async save(patient: Patient): Promise<void> {
    await this.prisma.patient.create({
      data: {
        id: patient.id,
        givenNames: patient.givenNames,
        familyName: patient.familyName,
        documentId: patient.documentId.value,
        phone: patient.phone,
        birthDate: patient.birthDate,
        deletedAt: patient.deletedAt,
      },
    });
  }
}
