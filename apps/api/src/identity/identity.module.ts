import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './infrastructure/auth';
import { SessionController } from './interface/session.controller';
import { StaffController } from './interface/staff.controller';
import { StaffAccessModule } from './staff-access.module';

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
      isGlobal: true,
    }),
    StaffAccessModule,
  ],
  controllers: [SessionController, StaffController],
})
export class IdentityModule {}
