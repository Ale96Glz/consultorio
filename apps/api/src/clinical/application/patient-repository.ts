import type { Patient } from '../domain/patient';

export abstract class PatientRepository {
  abstract findActiveByDocument(documentId: string): Promise<Patient[]>;
  abstract save(patient: Patient): Promise<void>;
}
