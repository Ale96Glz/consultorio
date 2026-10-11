import type { PrismaService } from '../../infrastructure/prisma.service';
import { PrismaPatientLookup } from './prisma-patient.lookup';

describe('PrismaPatientLookup', () => {
  const findUnique = jest.fn();
  const prisma = {
    patient: { findUnique },
  } as unknown as PrismaService;
  const lookup = new PrismaPatientLookup(prisma);

  beforeEach(() => {
    findUnique.mockReset();
  });

  it('devuelve la ficha con su baja lógica', async () => {
    const deletedAt = new Date('2026-10-08T00:00:00.000Z');
    findUnique.mockResolvedValue({ id: 'patient-1', deletedAt });

    await expect(lookup.findById('patient-1')).resolves.toEqual({
      id: 'patient-1',
      deletedAt,
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'patient-1' },
      select: { id: true, deletedAt: true },
    });
  });

  it('devuelve null si la ficha no existe', async () => {
    findUnique.mockResolvedValue(null);

    await expect(lookup.findById('missing')).resolves.toBeNull();
  });
});
