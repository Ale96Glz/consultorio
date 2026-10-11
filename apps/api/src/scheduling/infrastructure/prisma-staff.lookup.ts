import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { StaffLookup, type StaffSnapshot } from '../application/staff-lookup';

@Injectable()
export class PrismaStaffLookup extends StaffLookup {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(staffId: string): Promise<StaffSnapshot | null> {
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
