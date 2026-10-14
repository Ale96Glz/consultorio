import { Appointment, type AppointmentStatus } from '../domain/appointment';
import { AppointmentRepository } from './appointment-repository';
import { CancelAppointment } from './cancel-appointment';
import { AppointmentNotFoundError } from './confirm-appointment';

const appointmentId = 'appointment-1';

function at(hour: number): Date {
  return new Date(Date.UTC(2026, 9, 8, hour));
}

function appointment(status: AppointmentStatus): Appointment {
  return Appointment.rehydrate({
    id: appointmentId,
    patientId: 'patient-1',
    staffId: 'staff-doctor-1',
    startsAt: at(15),
    endsAt: at(16),
    status,
  });
}

class InMemoryAppointments extends AppointmentRepository {
  readonly saved: Appointment[] = [];

  constructor(private readonly existing: Appointment[]) {
    super();
  }

  async findById(id: string): Promise<Appointment | null> {
    return this.existing.find((item) => item.id === id) ?? null;
  }

  async findOccupyingByStaff(): Promise<Appointment[]> {
    return [];
  }

  async save(item: Appointment): Promise<void> {
    this.saved.push(item);
  }
}

describe('CancelAppointment', () => {
  it.each(['pendiente', 'confirmada', 'cancelada'] as const)(
    'deja una cita %s en cancelada y la guarda',
    async (status) => {
      const appointments = new InMemoryAppointments([appointment(status)]);
      const cancel = new CancelAppointment(appointments);

      const cancelled = await cancel.execute({ appointmentId });

      expect(cancelled.currentStatus).toBe('cancelada');
      expect(appointments.saved).toEqual([cancelled]);
    },
  );

  it('no guarda nada si la cita no existe', async () => {
    const appointments = new InMemoryAppointments([]);
    const cancel = new CancelAppointment(appointments);

    await expect(cancel.execute({ appointmentId })).rejects.toThrow(
      AppointmentNotFoundError,
    );
    expect(appointments.saved).toHaveLength(0);
  });
});
