import {
  Assignment,
  DuplicateAssignmentError,
  StaffCannotBeAssignedError,
} from '../domain/assignment';
import { Patient } from '../domain/patient';
import { AssignDoctor, PatientNotAssignableError } from './assign-doctor';
import { AssignmentRepository } from './assignment-repository';
import { PatientRepository } from './patient-repository';
import { StaffById, type StaffMember } from './staff-by-id';

const doctorId = 'staff-doctor-1';
const patientId = 'patient-1';

function activePatient(): Patient {
  return Patient.register(
    {
      id: patientId,
      givenNames: 'Ana',
      familyName: 'Ruiz',
      documentId: 'CURP900412HDFRRL09',
      phone: '5555550100',
      birthDate: new Date('1990-04-12'),
    },
    [],
  );
}

class InMemoryStaff extends StaffById {
  constructor(private readonly staff: StaffMember[]) {
    super();
  }

  async findById(id: string): Promise<StaffMember | null> {
    return this.staff.find((member) => member.id === id) ?? null;
  }
}

class InMemoryPatients extends PatientRepository {
  constructor(private readonly patients: Patient[]) {
    super();
  }

  async findById(id: string): Promise<Patient | null> {
    return this.patients.find((patient) => patient.id === id) ?? null;
  }

  async findActiveByDocument(): Promise<Patient[]> {
    return [];
  }

  async save(): Promise<void> {
    return undefined;
  }
}

class InMemoryAssignments extends AssignmentRepository {
  readonly saved: Assignment[] = [];

  constructor(private readonly existing: Assignment | null = null) {
    super();
  }

  async findByPair(): Promise<Assignment | null> {
    return this.existing;
  }

  async save(assignment: Assignment): Promise<void> {
    this.saved.push(assignment);
  }
}

function useCase(
  staff: StaffMember[] = [{ id: doctorId, role: 'doctor' }],
  patients: Patient[] = [activePatient()],
  existing: Assignment | null = null,
): { assign: AssignDoctor; assignments: InMemoryAssignments } {
  const assignments = new InMemoryAssignments(existing);
  const assign = new AssignDoctor(
    new InMemoryStaff(staff),
    new InMemoryPatients(patients),
    assignments,
  );
  return { assign, assignments };
}

const command = { staffId: doctorId, patientId };

describe('AssignDoctor', () => {
  it('guarda la asignación de un doctor con un paciente activo', async () => {
    const { assign, assignments } = useCase();

    const created = await assign.execute(command);

    expect(created.staffId).toBe(doctorId);
    expect(created.patientId).toBe(patientId);
    expect(assignments.saved).toEqual([created]);
  });

  it.each(['receptionist', 'admin'] as const)(
    'no guarda la asignación si el miembro es %s',
    async (role) => {
      const { assign, assignments } = useCase([{ id: doctorId, role }]);

      await expect(assign.execute(command)).rejects.toThrow(
        StaffCannotBeAssignedError,
      );
      expect(assignments.saved).toHaveLength(0);
    },
  );

  it('no guarda la asignación si el miembro no existe', async () => {
    const { assign, assignments } = useCase([]);

    await expect(assign.execute(command)).rejects.toThrow(
      StaffCannotBeAssignedError,
    );
    expect(assignments.saved).toHaveLength(0);
  });

  it('no guarda la asignación si el paciente no existe', async () => {
    const { assign, assignments } = useCase(
      [{ id: doctorId, role: 'doctor' }],
      [],
    );

    await expect(assign.execute(command)).rejects.toThrow(
      PatientNotAssignableError,
    );
    expect(assignments.saved).toHaveLength(0);
  });

  it('no guarda la asignación si el paciente está dado de baja', async () => {
    const patient = activePatient();
    patient.deactivate(new Date('2026-10-01T00:00:00.000Z'));
    const { assign, assignments } = useCase(
      [{ id: doctorId, role: 'doctor' }],
      [patient],
    );

    await expect(assign.execute(command)).rejects.toThrow(
      PatientNotAssignableError,
    );
    expect(assignments.saved).toHaveLength(0);
  });

  it('no guarda la asignación si el par ya existe', async () => {
    const existing = Assignment.assign(
      {
        id: 'assignment-1',
        staffId: doctorId,
        patientId,
        role: 'doctor',
      },
      [],
    );
    const { assign, assignments } = useCase(undefined, undefined, existing);

    await expect(assign.execute(command)).rejects.toThrow(
      DuplicateAssignmentError,
    );
    expect(assignments.saved).toHaveLength(0);
  });
});
