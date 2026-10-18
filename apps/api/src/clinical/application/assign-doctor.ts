import { Injectable } from '@nestjs/common';
import { Assignment, StaffCannotBeAssignedError } from '../domain/assignment';
import { AssignmentRepository } from './assignment-repository';
import { PatientRepository } from './patient-repository';
import { StaffById } from './staff-by-id';

export class PatientNotAssignableError extends Error {
  constructor() {
    super('No se asigna un doctor si el paciente no está activo.');
    this.name = 'PatientNotAssignableError';
  }
}

export type AssignDoctorCommand = {
  staffId: string;
  patientId: string;
};

@Injectable()
export class AssignDoctor {
  constructor(
    private readonly staff: StaffById,
    private readonly patients: PatientRepository,
    private readonly assignments: AssignmentRepository,
  ) {}

  async execute(command: AssignDoctorCommand): Promise<Assignment> {
    const member = await this.staff.findById(command.staffId);
    if (!member || member.role !== 'doctor') {
      throw new StaffCannotBeAssignedError();
    }

    const patient = await this.patients.findById(command.patientId);
    if (!patient || !patient.isActive()) {
      throw new PatientNotAssignableError();
    }

    const existing = await this.assignments.findByPair(
      command.staffId,
      command.patientId,
    );
    const assignment = Assignment.assign(
      {
        id: crypto.randomUUID(),
        staffId: command.staffId,
        patientId: command.patientId,
        role: member.role,
      },
      existing ? [existing] : [],
    );

    await this.assignments.save(assignment);
    return assignment;
  }
}
