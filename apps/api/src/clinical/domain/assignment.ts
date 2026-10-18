export class DuplicateAssignmentError extends Error {
  constructor() {
    super('Ese doctor ya está asignado a ese paciente.');
    this.name = 'DuplicateAssignmentError';
  }
}

export class StaffCannotBeAssignedError extends Error {
  constructor() {
    super('Solo un doctor puede asignarse a un paciente.');
    this.name = 'StaffCannotBeAssignedError';
  }
}

export type AssignmentStaffRole = 'doctor' | 'receptionist' | 'admin';

type AssignDoctor = {
  id: string;
  staffId: string;
  patientId: string;
  role: AssignmentStaffRole;
};

type AssignmentRecord = {
  id: string;
  staffId: string;
  patientId: string;
};

export class Assignment {
  private constructor(
    readonly id: string,
    readonly staffId: string,
    readonly patientId: string,
  ) {}

  static assign(
    input: AssignDoctor,
    existing: readonly Assignment[],
  ): Assignment {
    if (input.role !== 'doctor') {
      throw new StaffCannotBeAssignedError();
    }

    const assignment = new Assignment(input.id, input.staffId, input.patientId);
    const taken = existing.some((other) => assignment.samePair(other));
    if (taken) {
      throw new DuplicateAssignmentError();
    }

    return assignment;
  }

  static rehydrate(input: AssignmentRecord): Assignment {
    return new Assignment(input.id, input.staffId, input.patientId);
  }

  private samePair(other: Assignment): boolean {
    return this.staffId === other.staffId && this.patientId === other.patientId;
  }
}
