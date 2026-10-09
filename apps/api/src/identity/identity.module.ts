import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './infrastructure/auth';

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
    }),
  ],
})
export class IdentityModule {}
