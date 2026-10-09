import type { Appointment } from '../domain/appointment';

export interface AppointmentRepository {
  findOccupyingByStaff(staffId: string): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<void>;
}
