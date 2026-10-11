import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../infrastructure/prisma.service';
import { CurrentStaff } from './application/current-staff';
import { StaffByUser } from './application/staff-by-user';
import { auth } from './infrastructure/auth';
import { PrismaStaffByUser } from './infrastructure/prisma-staff-by-user';
import { SessionController } from './interface/session.controller';
import { StaffController } from './interface/staff.controller';

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
      isGlobal: true,
    }),
  ],
  providers: [
    PrismaService,
    PrismaStaffByUser,
    { provide: StaffByUser, useExisting: PrismaStaffByUser },
    CurrentStaff,
  ],
  controllers: [SessionController, StaffController],
})
export class IdentityModule {}
