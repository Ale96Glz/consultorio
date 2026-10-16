import { Injectable } from '@nestjs/common';
import { Appointment } from '../domain/appointment';
import { AppointmentRepository } from './appointment-repository';
import { StaffCannotAttendError } from './schedule-appointment';
import { StaffLookup } from './staff-lookup';

export type ViewAgendaCommand = {
  staffId: string;
};

@Injectable()
export class ViewAgenda {
  constructor(
    private readonly staff: StaffLookup,
    private readonly appointments: AppointmentRepository,
  ) {}

  async execute(command: ViewAgendaCommand): Promise<Appointment[]> {
    const member = await this.staff.findById(command.staffId);
    if (!member || member.role !== 'doctor') {
      throw new StaffCannotAttendError();
    }

    const occupying = await this.appointments.findOccupyingByStaff(
      command.staffId,
    );

    return occupying
      .slice()
      .sort(
        (left, right) =>
          left.dateRange.startsAt.getTime() -
          right.dateRange.startsAt.getTime(),
      );
  }
}
