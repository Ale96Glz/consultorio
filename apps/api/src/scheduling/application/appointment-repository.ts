import type { Appointment } from '../domain/appointment';

export abstract class AppointmentRepository {
  abstract findOccupyingByStaff(staffId: string): Promise<Appointment[]>;
  abstract save(appointment: Appointment): Promise<void>;
}
