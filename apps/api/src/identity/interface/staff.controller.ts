import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import {
  CurrentStaff,
  StaffUnassignedError,
} from '../application/current-staff';
import type { StaffRole } from '../application/staff-by-user';

type CurrentStaffResponse = {
  staffId: string;
  role: StaffRole;
};

@Controller('identity')
@UseGuards(AuthGuard)
export class StaffController {
  constructor(private readonly currentStaff: CurrentStaff) {}

  @Get('staff')
  async current(
    @Session() session: UserSession,
  ): Promise<CurrentStaffResponse> {
    try {
      const member = await this.currentStaff.execute(session.user.id);
      return { staffId: member.id, role: member.role };
    } catch (error) {
      if (error instanceof StaffUnassignedError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
