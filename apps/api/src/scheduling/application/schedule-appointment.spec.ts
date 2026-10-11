import { Appointment, AppointmentOverlapError } from '../domain/appointment';
import { AppointmentRepository } from './appointment-repository';
import { PatientLookup, type PatientSnapshot } from './patient-lookup';
import {
  PatientUnavailableError,
  ScheduleAppointment,
  StaffCannotAttendError,
} from './schedule-appointment';
import { StaffLookup, type StaffRole, type StaffSnapshot } from './staff-lookup';

const patientId = 'patient-1';
const doctorId = 'staff-doctor-1';

function at(hour: number): Date {
  return new Date(Date.UTC(2026, 9, 8, hour));
}

class InMemoryPatients extends PatientLookup {
  constructor(private readonly patients: PatientSnapshot[]) {
    super();
  }

  async findById(id: string): Promise<PatientSnapshot | null> {
    return this.patients.find((patient) => patient.id === id) ?? null;
  }
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
  readonly saved: Appointment[] = [];

  constructor(private readonly existing: Appointment[] = []) {
    super();
  }

  async findOccupyingByStaff(staffId: string): Promise<Appointment[]> {
    return this.existing.filter(
      (appointment) =>
        appointment.staffId === staffId && appointment.occupiesAgenda(),
    );
  }

  async save(appointment: Appointment): Promise<void> {
    this.saved.push(appointment);
  }
}

function useCase(
  patients: PatientSnapshot[],
  existing: Appointment[] = [],
  staff: StaffSnapshot[] = [{ id: doctorId, role: 'doctor' }],
): { schedule: ScheduleAppointment; appointments: InMemoryAppointments } {
  const appointments = new InMemoryAppointments(existing);
  const schedule = new ScheduleAppointment(
    new InMemoryPatients(patients),
    new InMemoryStaff(staff),
    appointments,
  );

  return { schedule, appointments };
}

const activePatient: PatientSnapshot = { id: patientId, deletedAt: null };

describe('ScheduleAppointment', () => {
  it('guarda una cita pendiente cuando el paciente está activo y el horario está libre', async () => {
    const { schedule, appointments } = useCase([activePatient]);

    const appointment = await schedule.execute({
      patientId,
      staffId: doctorId,
      startsAt: at(15),
      endsAt: at(16),
    });

    expect(appointment.currentStatus).toBe('pendiente');
    expect(appointments.saved).toEqual([appointment]);
  });

  it('no guarda la cita si el paciente está dado de baja', async () => {
    const { schedule, appointments } = useCase([
      { id: patientId, deletedAt: at(8) },
    ]);

    await expect(
      schedule.execute({
        patientId,
        staffId: doctorId,
        startsAt: at(15),
        endsAt: at(16),
      }),
    ).rejects.toThrow(PatientUnavailableError);
    expect(appointments.saved).toHaveLength(0);
  });

  it('no guarda la cita si el paciente no existe', async () => {
    const { schedule, appointments } = useCase([]);

    await expect(
      schedule.execute({
        patientId,
        staffId: doctorId,
        startsAt: at(15),
        endsAt: at(16),
      }),
    ).rejects.toThrow(PatientUnavailableError);
    expect(appointments.saved).toHaveLength(0);
  });

  it.each(['receptionist', 'admin'] as const)(
    'no guarda la cita si quien atiende es %s',
    async (role: StaffRole) => {
      const { schedule, appointments } = useCase(
        [activePatient],
        [],
        [{ id: doctorId, role }],
      );

      await expect(
        schedule.execute({
          patientId,
          staffId: doctorId,
          startsAt: at(15),
          endsAt: at(16),
        }),
      ).rejects.toThrow(StaffCannotAttendError);
      expect(appointments.saved).toHaveLength(0);
    },
  );

  it('no guarda la cita si el profesional no existe', async () => {
    const { schedule, appointments } = useCase([activePatient], [], []);

    await expect(
      schedule.execute({
        patientId,
        staffId: doctorId,
        startsAt: at(15),
        endsAt: at(16),
      }),
    ).rejects.toThrow(StaffCannotAttendError);
    expect(appointments.saved).toHaveLength(0);
  });

  it('no guarda la cita si el horario del doctor ya está ocupado', async () => {
    const existing = Appointment.schedule(
      {
        id: 'appointment-1',
        patientId,
        staffId: doctorId,
        startsAt: at(15),
        endsAt: at(16),
      },
      [],
    );
    const { schedule, appointments } = useCase([activePatient], [existing]);

    await expect(
      schedule.execute({
        patientId,
        staffId: doctorId,
        startsAt: at(15),
        endsAt: at(16),
      }),
    ).rejects.toThrow(AppointmentOverlapError);
    expect(appointments.saved).toHaveLength(0);
  });
});
