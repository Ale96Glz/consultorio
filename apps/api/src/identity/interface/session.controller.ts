import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Controller('identity')
@UseGuards(AuthGuard)
export class SessionController {
  @Get('session')
  current(@Session() session: UserSession): { userId: string; email: string } {
    return {
      userId: session.user.id,
      email: session.user.email,
    };
  }
}
