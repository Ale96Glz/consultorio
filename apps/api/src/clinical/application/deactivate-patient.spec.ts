import { Patient } from '../domain/patient';
import { PatientRepository } from './patient-repository';
import { DeactivatePatient, PatientNotFoundError } from './deactivate-patient';

const birthDate = new Date('1990-04-12');
const patientId = 'patient-1';

function patient(active = true): Patient {
  const registered = Patient.register(
    {
      id: patientId,
      givenNames: 'Ana',
      familyName: 'Ruiz',
      documentId: 'CURP900412HDFRRL09',
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

  async findActiveByDocument(): Promise<Patient[]> {
    return [];
  }

  async save(item: Patient): Promise<void> {
    this.saved.push(item);
  }
}

describe('DeactivatePatient', () => {
  it('da de baja la ficha activa y la guarda', async () => {
    const patients = new InMemoryPatients([patient()]);
    const deactivate = new DeactivatePatient(patients);

    const removed = await deactivate.execute({ patientId });

    expect(removed.isActive()).toBe(false);
    expect(removed.deletedAt).toBeInstanceOf(Date);
    expect(patients.saved).toEqual([removed]);
  });

  it('conserva la fecha si la ficha ya estaba dada de baja', async () => {
    const existing = patient(false);
    const patients = new InMemoryPatients([existing]);
    const deactivate = new DeactivatePatient(patients);

    const removed = await deactivate.execute({ patientId });

    expect(removed.deletedAt).toEqual(existing.deletedAt);
    expect(patients.saved).toEqual([removed]);
  });

  it('no guarda nada si la ficha no existe', async () => {
    const patients = new InMemoryPatients();
    const deactivate = new DeactivatePatient(patients);

    await expect(deactivate.execute({ patientId })).rejects.toThrow(
      PatientNotFoundError,
    );
    expect(patients.saved).toHaveLength(0);
  });
});
