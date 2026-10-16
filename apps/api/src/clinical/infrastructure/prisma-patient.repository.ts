import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { PatientRepository } from '../application/patient-repository';
import { Patient } from '../domain/patient';

@Injectable()
export class PrismaPatientRepository extends PatientRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Patient | null> {
    const row = await this.prisma.patient.findUnique({ where: { id } });
    if (!row) {
      return null;
    }

    return toPatient(row);
  }

  async findActiveByDocument(documentId: string): Promise<Patient[]> {
    const rows = await this.prisma.patient.findMany({
      where: { documentId, deletedAt: null },
    });

    return rows.map((row) => toPatient(row));
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

function toPatient(row: {
  id: string;
  givenNames: string;
  familyName: string;
  documentId: string;
  phone: string;
  birthDate: Date;
  deletedAt: Date | null;
}): Patient {
  return Patient.rehydrate({
    id: row.id,
    givenNames: row.givenNames,
    familyName: row.familyName,
    documentId: row.documentId,
    phone: row.phone,
    birthDate: row.birthDate,
    deletedAt: row.deletedAt,
  });
}
