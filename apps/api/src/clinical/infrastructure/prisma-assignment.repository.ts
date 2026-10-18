import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { AssignmentRepository } from '../application/assignment-repository';
import { Assignment } from '../domain/assignment';

@Injectable()
export class PrismaAssignmentRepository extends AssignmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByPair(
    staffId: string,
    patientId: string,
  ): Promise<Assignment | null> {
    const row = await this.prisma.assignment.findUnique({
      where: { staffId_patientId: { staffId, patientId } },
    });
    if (!row) {
      return null;
    }

    return Assignment.rehydrate({
      id: row.id,
      staffId: row.staffId,
      patientId: row.patientId,
    });
  }

  async save(assignment: Assignment): Promise<void> {
    await this.prisma.assignment.create({
      data: {
        id: assignment.id,
        staffId: assignment.staffId,
        patientId: assignment.patientId,
      },
    });
  }
}
