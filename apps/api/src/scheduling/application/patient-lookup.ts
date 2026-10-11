export type PatientSnapshot = {
  id: string;
  deletedAt: Date | null;
};

export abstract class PatientLookup {
  abstract findById(patientId: string): Promise<PatientSnapshot | null>;
}
