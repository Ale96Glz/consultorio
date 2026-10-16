import type { PrismaService } from '../../infrastructure/prisma.service';
import { Patient } from '../domain/patient';
import { PrismaPatientRepository } from './prisma-patient.repository';

const birthDate = new Date('1990-04-12');

describe('PrismaPatientRepository', () => {
  const findUnique = jest.fn();
  const findMany = jest.fn();
  const create = jest.fn();
  const prisma = {
    patient: { findUnique, findMany, create },
  } as unknown as PrismaService;
  const repository = new PrismaPatientRepository(prisma);

  beforeEach(() => {
    findUnique.mockReset();
    findMany.mockReset();
    create.mockReset();
  });

  it('reconstruye la ficha pedida', async () => {
    findUnique.mockResolvedValue({
      id: 'patient-1',
      givenNames: 'Ana',
      familyName: 'Ruiz',
      documentId: 'CURP900412HDFRRL09',
      phone: '5555550100',
      birthDate,
      deletedAt: null,
    });

    const patient = await repository.findById('patient-1');

    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'patient-1' } });
    expect(patient?.isActive()).toBe(true);
    expect(patient?.fullName).toBe('Ana Ruiz');
  });

  it('devuelve null si la ficha no existe', async () => {
    findUnique.mockResolvedValue(null);

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('reconstruye las fichas activas de ese documento', async () => {
    findMany.mockResolvedValue([
      {
        id: 'patient-1',
        givenNames: 'Ana',
        familyName: 'Ruiz',
        documentId: 'CURP900412HDFRRL09',
        phone: '5555550100',
        birthDate,
        deletedAt: null,
      },
    ]);

    const patients =
      await repository.findActiveByDocument('CURP900412HDFRRL09');

    expect(findMany).toHaveBeenCalledWith({
      where: { documentId: 'CURP900412HDFRRL09', deletedAt: null },
    });
    expect(patients).toHaveLength(1);
    expect(patients[0].isActive()).toBe(true);
    expect(patients[0].fullName).toBe('Ana Ruiz');
  });

  it('devuelve una lista vacía si no hay ficha activa', async () => {
    findMany.mockResolvedValue([]);

    await expect(
      repository.findActiveByDocument('CURP900412HDFRRL09'),
    ).resolves.toEqual([]);
  });

  it('inserta la ficha nueva', async () => {
    const patient = Patient.register(
      {
        id: 'patient-2',
        givenNames: 'Ana',
        familyName: 'Ruiz',
        documentId: 'CURP900412HDFRRL09',
        phone: '5555550100',
        birthDate,
      },
      [],
    );
    create.mockResolvedValue({});

    await repository.save(patient);

    expect(create).toHaveBeenCalledWith({
      data: {
        id: 'patient-2',
        givenNames: 'Ana',
        familyName: 'Ruiz',
        documentId: 'CURP900412HDFRRL09',
        phone: '5555550100',
        birthDate,
        deletedAt: null,
      },
    });
  });
});
