import { Injectable } from '@nestjs/common';
import { Patient } from '../domain/patient';
import { PatientRepository } from './patient-repository';

export class PatientNotFoundError extends Error {
  constructor() {
    super('La ficha no existe.');
    this.name = 'PatientNotFoundError';
  }
}

export type DeactivatePatientCommand = {
  patientId: string;
};

@Injectable()
export class DeactivatePatient {
  constructor(private readonly patients: PatientRepository) {}

  async execute(command: DeactivatePatientCommand): Promise<Patient> {
    const patient = await this.patients.findById(command.patientId);
    if (!patient) {
      throw new PatientNotFoundError();
    }

    patient.deactivate(new Date());
    await this.patients.save(patient);
    return patient;
  }
}
