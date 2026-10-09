import { Appointment, AppointmentOverlapError } from '../domain/appointment';
import type { AppointmentRepository } from './appointment-repository';
import type { PatientLookup, PatientSnapshot } from './patient-lookup';
import {
  PatientUnavailableError,
  ScheduleAppointment,
} from './schedule-appointment';

const patientId = 'patient-1';
const doctorId = 'staff-doctor-1';

function at(hour: number): Date {
  return new Date(Date.UTC(2026, 9, 8, hour));
}

class InMemoryPatients implements PatientLookup {
  constructor(private readonly patients: PatientSnapshot[]) {}

  async findById(id: string): Promise<PatientSnapshot | null> {
    return this.patients.find((patient) => patient.id === id) ?? null;
  }
}

class InMemoryAppointments implements AppointmentRepository {
  readonly saved: Appointment[] = [];

  constructor(private readonly existing: Appointment[] = []) {}

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
): { schedule: ScheduleAppointment; appointments: InMemoryAppointments } {
  const appointments = new InMemoryAppointments(existing);
  const schedule = new ScheduleAppointment(
    new InMemoryPatients(patients),
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
