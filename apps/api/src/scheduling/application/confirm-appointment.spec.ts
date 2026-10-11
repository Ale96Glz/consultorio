import {
  Appointment,
  AppointmentStatusError,
  type AppointmentStatus,
} from '../domain/appointment';
import { AppointmentRepository } from './appointment-repository';
import {
  AppointmentNotFoundError,
  ConfirmAppointment,
} from './confirm-appointment';

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

describe('ConfirmAppointment', () => {
  it('pasa una cita pendiente a confirmada y la guarda', async () => {
    const appointments = new InMemoryAppointments([appointment('pendiente')]);
    const confirm = new ConfirmAppointment(appointments);

    const confirmed = await confirm.execute({ appointmentId });

    expect(confirmed.currentStatus).toBe('confirmada');
    expect(appointments.saved).toEqual([confirmed]);
  });

  it('no guarda nada si la cita no existe', async () => {
    const appointments = new InMemoryAppointments([]);
    const confirm = new ConfirmAppointment(appointments);

    await expect(confirm.execute({ appointmentId })).rejects.toThrow(
      AppointmentNotFoundError,
    );
    expect(appointments.saved).toHaveLength(0);
  });

  it.each(['confirmada', 'cancelada'] as const)(
    'no guarda nada si la cita ya está %s',
    async (status) => {
      const appointments = new InMemoryAppointments([appointment(status)]);
      const confirm = new ConfirmAppointment(appointments);

      await expect(confirm.execute({ appointmentId })).rejects.toThrow(
        AppointmentStatusError,
      );
      expect(appointments.saved).toHaveLength(0);
    },
  );
});
