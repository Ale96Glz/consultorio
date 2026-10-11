import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { StaffByUser, type StaffMember } from '../application/staff-by-user';

@Injectable()
export class PrismaStaffByUser extends StaffByUser {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByUserId(userId: string): Promise<StaffMember | null> {
    const staff = await this.prisma.staff.findUnique({
      where: { userId },
      select: { id: true, role: true },
    });

    if (!staff) {
      return null;
    }

    return { id: staff.id, role: staff.role };
  }
}
