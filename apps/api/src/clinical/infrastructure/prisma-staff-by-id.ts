import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { StaffById, type StaffMember } from '../application/staff-by-id';

@Injectable()
export class PrismaStaffById extends StaffById {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(staffId: string): Promise<StaffMember | null> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      select: { id: true, role: true },
    });

    if (!staff) {
      return null;
    }

    return { id: staff.id, role: staff.role };
  }
}
