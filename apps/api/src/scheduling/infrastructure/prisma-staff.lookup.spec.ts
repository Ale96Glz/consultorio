import type { PrismaService } from '../../infrastructure/prisma.service';
import { PrismaStaffLookup } from './prisma-staff.lookup';

describe('PrismaStaffLookup', () => {
  const findUnique = jest.fn();
  const prisma = {
    staff: { findUnique },
  } as unknown as PrismaService;
  const lookup = new PrismaStaffLookup(prisma);

  beforeEach(() => {
    findUnique.mockReset();
  });

  it('devuelve el rol del miembro de la clínica', async () => {
    findUnique.mockResolvedValue({ id: 'staff-1', role: 'doctor' });

    await expect(lookup.findById('staff-1')).resolves.toEqual({
      id: 'staff-1',
      role: 'doctor',
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'staff-1' },
      select: { id: true, role: true },
    });
  });

  it('devuelve null si el miembro no existe', async () => {
    findUnique.mockResolvedValue(null);

    await expect(lookup.findById('missing')).resolves.toBeNull();
  });
});
