import { InvalidDocumentIdError } from '../domain/document-id';
import { DuplicateDocumentIdError, Patient } from '../domain/patient';
import { PatientRepository } from './patient-repository';
import { RegisterPatient } from './register-patient';

const birthDate = new Date('1990-04-12');
const documentId = 'CURP900412HDFRRL09';

function patient(id: string, active = true): Patient {
  const registered = Patient.register(
    {
      id,
      givenNames: 'Ana',
      familyName: 'Ruiz',
      documentId,
      phone: '5555550100',
      birthDate,
    },
    [],
  );
  if (!active) {
    registered.deactivate(new Date('2026-10-01T00:00:00.000Z'));
  }
  return registered;
}

class InMemoryPatients extends PatientRepository {
  readonly saved: Patient[] = [];

  constructor(private readonly existing: Patient[] = []) {
    super();
  }

  async findById(id: string): Promise<Patient | null> {
    return this.existing.find((item) => item.id === id) ?? null;
  }

  async findActiveByDocument(value: string): Promise<Patient[]> {
    return this.existing.filter(
      (item) => item.isActive() && item.documentId.value === value,
    );
  }

  async save(item: Patient): Promise<void> {
    this.saved.push(item);
  }
}

const command = {
  givenNames: 'Ana',
  familyName: 'Ruiz',
  documentId,
  phone: '5555550100',
  birthDate,
};

describe('RegisterPatient', () => {
  it('guarda una ficha activa', async () => {
    const patients = new InMemoryPatients();
    const register = new RegisterPatient(patients);

    const created = await register.execute(command);

    expect(created.isActive()).toBe(true);
    expect(created.fullName).toBe('Ana Ruiz');
    expect(created.documentId.value).toBe(documentId);
    expect(patients.saved).toEqual([created]);
  });

  it('no guarda la ficha si el documento ya está en una ficha activa', async () => {
    const patients = new InMemoryPatients([patient('patient-1')]);
    const register = new RegisterPatient(patients);

    await expect(register.execute(command)).rejects.toThrow(
      DuplicateDocumentIdError,
    );
    expect(patients.saved).toHaveLength(0);
  });

  it('guarda la ficha si el documento solo está en una ficha dada de baja', async () => {
    const patients = new InMemoryPatients([patient('patient-1', false)]);
    const register = new RegisterPatient(patients);

    const created = await register.execute(command);

    expect(created.isActive()).toBe(true);
    expect(patients.saved).toEqual([created]);
  });

  it('no guarda la ficha si el documento está vacío', async () => {
    const patients = new InMemoryPatients();
    const register = new RegisterPatient(patients);

    await expect(
      register.execute({ ...command, documentId: '   ' }),
    ).rejects.toThrow(InvalidDocumentIdError);
    expect(patients.saved).toHaveLength(0);
  });
});
