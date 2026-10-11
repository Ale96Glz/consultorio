import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './infrastructure/auth';
import { SessionController } from './interface/session.controller';

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
      isGlobal: true,
    }),
  ],
  controllers: [SessionController],
})
export class IdentityModule {}
