import type { PrismaService } from '../../infrastructure/prisma.service';
import { Assignment } from '../domain/assignment';
import { PrismaAssignmentRepository } from './prisma-assignment.repository';

const doctorId = 'staff-doctor-1';
const patientId = 'patient-1';

describe('PrismaAssignmentRepository', () => {
  const findUnique = jest.fn();
  const create = jest.fn();
  const prisma = {
    assignment: { findUnique, create },
  } as unknown as PrismaService;
  const repository = new PrismaAssignmentRepository(prisma);

  beforeEach(() => {
    findUnique.mockReset();
    create.mockReset();
  });

  it('reconstruye la asignación del par', async () => {
    findUnique.mockResolvedValue({
      id: 'assignment-1',
      staffId: doctorId,
      patientId,
    });

    const assignment = await repository.findByPair(doctorId, patientId);

    expect(findUnique).toHaveBeenCalledWith({
      where: { staffId_patientId: { staffId: doctorId, patientId } },
    });
    expect(assignment?.staffId).toBe(doctorId);
    expect(assignment?.patientId).toBe(patientId);
  });

  it('devuelve null si el par no existe', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      repository.findByPair(doctorId, patientId),
    ).resolves.toBeNull();
  });

  it('inserta la asignación nueva', async () => {
    const assignment = Assignment.assign(
      {
        id: 'assignment-2',
        staffId: doctorId,
        patientId,
        role: 'doctor',
      },
      [],
    );
    create.mockResolvedValue({});

    await repository.save(assignment);

    expect(create).toHaveBeenCalledWith({
      data: {
        id: 'assignment-2',
        staffId: doctorId,
        patientId,
      },
    });
  });
});
