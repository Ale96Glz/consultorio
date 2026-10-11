import type { PrismaService } from '../../infrastructure/prisma.service';
import { PrismaStaffByUser } from './prisma-staff-by-user';

describe('PrismaStaffByUser', () => {
  const findUnique = jest.fn();
  const prisma = {
    staff: { findUnique },
  } as unknown as PrismaService;
  const directory = new PrismaStaffByUser(prisma);

  beforeEach(() => {
    findUnique.mockReset();
  });

  it('devuelve el rol del miembro ligado al usuario', async () => {
    findUnique.mockResolvedValue({ id: 'staff-1', role: 'receptionist' });

    await expect(directory.findByUserId('user-1')).resolves.toEqual({
      id: 'staff-1',
      role: 'receptionist',
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { id: true, role: true },
    });
  });

  it('devuelve null si el usuario no tiene miembro', async () => {
    findUnique.mockResolvedValue(null);

    await expect(directory.findByUserId('missing')).resolves.toBeNull();
  });
});
