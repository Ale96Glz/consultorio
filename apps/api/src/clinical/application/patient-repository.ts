import type { Patient } from '../domain/patient';

export abstract class PatientRepository {
  abstract findById(id: string): Promise<Patient | null>;
  abstract findActiveByDocument(documentId: string): Promise<Patient[]>;
  abstract save(patient: Patient): Promise<void>;
}
