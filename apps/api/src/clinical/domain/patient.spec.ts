import { InvalidDocumentIdError } from './document-id';
import { DuplicateDocumentIdError, Patient } from './patient';

const birthDate = new Date('1990-04-12');

function register(
  id: string,
  documentId = 'CURP900412HDFRRL09',
  existing: readonly Patient[] = [],
): Patient {
  return Patient.register(
    {
      id,
      givenNames: 'Ana',
      familyName: 'Ruiz',
      documentId,
      phone: '5555550100',
      birthDate,
    },
    existing,
  );
}

describe('Patient', () => {
  it('registra una ficha activa', () => {
    const patient = register('patient-1');

    expect(patient.isActive()).toBe(true);
    expect(patient.fullName).toBe('Ana Ruiz');
    expect(patient.documentId.value).toBe('CURP900412HDFRRL09');
  });

  it('rechaza un documento vacío', () => {
    expect(() => register('patient-1', '   ')).toThrow(InvalidDocumentIdError);
  });

  it('rechaza el documento de otra ficha activa', () => {
    const existing = register('patient-1');

    expect(() =>
      register('patient-2', existing.documentId.value, [existing]),
    ).toThrow(DuplicateDocumentIdError);
  });

  it('permite el documento de una ficha dada de baja', () => {
    const existing = register('patient-1');
    existing.deactivate(new Date('2026-10-01T00:00:00.000Z'));

    const patient = register('patient-2', existing.documentId.value, [
      existing,
    ]);

    expect(patient.isActive()).toBe(true);
  });

  it('conserva la fecha de la primera baja', () => {
    const patient = register('patient-1');
    const first = new Date('2026-10-01T00:00:00.000Z');

    patient.deactivate(first);
    patient.deactivate(new Date('2026-10-02T00:00:00.000Z'));

    expect(patient.deletedAt).toEqual(first);
    expect(patient.isActive()).toBe(false);
  });
});
