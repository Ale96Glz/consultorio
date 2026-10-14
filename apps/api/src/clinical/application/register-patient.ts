import { Injectable } from '@nestjs/common';
import { DocumentId } from '../domain/document-id';
import { Patient } from '../domain/patient';
import { PatientRepository } from './patient-repository';

export type RegisterPatientCommand = {
  givenNames: string;
  familyName: string;
  documentId: string;
  phone: string;
  birthDate: Date;
};

@Injectable()
export class RegisterPatient {
  constructor(private readonly patients: PatientRepository) {}

  async execute(command: RegisterPatientCommand): Promise<Patient> {
    const documentId = DocumentId.create(command.documentId);
    const existing = await this.patients.findActiveByDocument(documentId.value);
    const patient = Patient.register(
      {
        id: crypto.randomUUID(),
        givenNames: command.givenNames,
        familyName: command.familyName,
        documentId: documentId.value,
        phone: command.phone,
        birthDate: command.birthDate,
      },
      existing,
    );

    await this.patients.save(patient);
    return patient;
  }
}
