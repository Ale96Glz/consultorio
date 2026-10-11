import { Module } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma.service';
import { CurrentStaff } from './application/current-staff';
import { StaffByUser } from './application/staff-by-user';
import { PrismaStaffByUser } from './infrastructure/prisma-staff-by-user';

@Module({
  providers: [
    PrismaService,
    PrismaStaffByUser,
    { provide: StaffByUser, useExisting: PrismaStaffByUser },
    CurrentStaff,
  ],
  exports: [CurrentStaff],
})
export class StaffAccessModule {}
