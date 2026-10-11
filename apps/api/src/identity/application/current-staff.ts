import { Injectable } from '@nestjs/common';
import { StaffByUser, type StaffMember } from './staff-by-user';

export class StaffUnassignedError extends Error {
  constructor() {
    super('Este usuario no es miembro de la clínica.');
    this.name = 'StaffUnassignedError';
  }
}

@Injectable()
export class CurrentStaff {
  constructor(private readonly staff: StaffByUser) {}

  async execute(userId: string): Promise<StaffMember> {
    const member = await this.staff.findByUserId(userId);
    if (!member) {
      throw new StaffUnassignedError();
    }

    return member;
  }
}
