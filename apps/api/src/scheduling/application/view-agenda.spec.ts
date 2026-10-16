import { Appointment, type AppointmentStatus } from '../domain/appointment';
import { AppointmentRepository } from './appointment-repository';
import { StaffCannotAttendError } from './schedule-appointment';
import { StaffLookup, type StaffSnapshot } from './staff-lookup';
import { ViewAgenda } from './view-agenda';

const doctorId = 'staff-doctor-1';
const patientId = 'patient-1';

function at(hour: number): Date {
  return new Date(Date.UTC(2026, 9, 8, hour));
}

function appointment(
  id: string,
  startHour: number,
  status: AppointmentStatus,
  staffId = doctorId,
): Appointment {
  return Appointment.rehydrate({
    id,
    patientId,
    staffId,
    startsAt: at(startHour),
    endsAt: at(startHour + 1),
    status,
  });
}

class InMemoryStaff extends StaffLookup {
  constructor(private readonly staff: StaffSnapshot[]) {
    super();
  }

  async findById(id: string): Promise<StaffSnapshot | null> {
    return this.staff.find((member) => member.id === id) ?? null;
  }
}

class InMemoryAppointments extends AppointmentRepository {
  queried = false;

  constructor(private readonly existing: Appointment[] = []) {
    super();
  }

  async findById(): Promise<Appointment | null> {
    return null;
  }

  async findOccupyingByStaff(staffId: string): Promise<Appointment[]> {
    this.queried = true;
    return this.existing.filter(
      (item) => item.staffId === staffId && item.occupiesAgenda(),
    );
  }

  async save(): Promise<void> {
    return undefined;
  }
}

function useCase(
  staff: StaffSnapshot[] = [{ id: doctorId, role: 'doctor' }],
  existing: Appointment[] = [],
): { view: ViewAgenda; appointments: InMemoryAppointments } {
  const appointments = new InMemoryAppointments(existing);
  const view = new ViewAgenda(new InMemoryStaff(staff), appointments);
  return { view, appointments };
}

describe('ViewAgenda', () => {
  it('devuelve las citas que ocupan la agenda, ordenadas por inicio', async () => {
    const { view } = useCase(undefined, [
      appointment('appointment-2', 16, 'confirmada'),
      appointment('appointment-1', 15, 'pendiente'),
      appointment('appointment-3', 17, 'cancelada'),
    ]);

    const agenda = await view.execute({ staffId: doctorId });

    expect(agenda.map((item) => item.id)).toEqual([
      'appointment-1',
      'appointment-2',
    ]);
  });

  it('devuelve una agenda vacía si el doctor no tiene citas activas', async () => {
    const { view } = useCase();

    await expect(view.execute({ staffId: doctorId })).resolves.toEqual([]);
  });

  it.each(['receptionist', 'admin'] as const)(
    'no consulta la agenda si el miembro es %s',
    async (role) => {
      const { view, appointments } = useCase([{ id: doctorId, role }]);

      await expect(view.execute({ staffId: doctorId })).rejects.toThrow(
        StaffCannotAttendError,
      );
      expect(appointments.queried).toBe(false);
    },
  );

  it('no consulta la agenda si el miembro no existe', async () => {
    const { view, appointments } = useCase([]);

    await expect(view.execute({ staffId: doctorId })).rejects.toThrow(
      StaffCannotAttendError,
    );
    expect(appointments.queried).toBe(false);
  });
});
