import { IsISO8601, IsNotEmpty, IsString } from 'class-validator';

export class RegisterPatientDto {
  @IsString()
  @IsNotEmpty()
  givenNames: string;

  @IsString()
  @IsNotEmpty()
  familyName: string;

  @IsString()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsISO8601()
  birthDate: string;
}
