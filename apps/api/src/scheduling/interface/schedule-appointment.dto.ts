import { IsISO8601, IsUUID } from 'class-validator';

export class ScheduleAppointmentDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  staffId: string;

  @IsISO8601()
  startsAt: string;

  @IsISO8601()
  endsAt: string;
}
