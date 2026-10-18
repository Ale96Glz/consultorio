import { IsUUID } from 'class-validator';

export class AssignDoctorDto {
  @IsUUID()
  staffId: string;

  @IsUUID()
  patientId: string;
}
