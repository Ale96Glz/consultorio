export type PatientSnapshot = {
  id: string;
  deletedAt: Date | null;
};

export interface PatientLookup {
  findById(patientId: string): Promise<PatientSnapshot | null>;
}
