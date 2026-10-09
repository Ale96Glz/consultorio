import { Appointment, AppointmentOverlapError } from './appointment';
import { InvalidDateRangeError } from './date-range';

const doctorId = 'staff-doctor-1';
const otherDoctorId = 'staff-doctor-2';
const patientId = 'patient-1';

function at(hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 9, 8, hour, minute));
}

function schedule(
  id: string,
  startHour: number,
  endHour: number,
  existing: readonly Appointment[] = [],
  staffId = doctorId,
): Appointment {
  return Appointment.schedule(
    {
      id,
      patientId,
      staffId,
      startsAt: at(startHour),
      endsAt: at(endHour),
    },
    existing,
  );
}

describe('Appointment', () => {
  it('agenda una cita pendiente cuando el horario está libre', () => {
    const appointment = schedule('appointment-1', 15, 16);

    expect(appointment.currentStatus).toBe('pendiente');
  });

  it('rechaza un rango que termina a la misma hora en que empieza', () => {
    expect(() =>
      Appointment.schedule(
        {
          id: 'appointment-1',
          patientId,
          staffId: doctorId,
          startsAt: at(15),
          endsAt: at(15),
        },
        [],
      ),
    ).toThrow(InvalidDateRangeError);
  });

  it('rechaza el solapamiento con una cita pendiente del mismo doctor', () => {
    const existing = schedule('appointment-1', 15, 16);

    expect(() => schedule('appointment-2', 15, 16, [existing])).toThrow(
      AppointmentOverlapError,
    );
  });

  it('rechaza el solapamiento con una cita confirmada del mismo doctor', () => {
    const existing = schedule('appointment-1', 15, 16);
    existing.confirm();

    expect(() => schedule('appointment-2', 15, 17, [existing])).toThrow(
      AppointmentOverlapError,
    );
  });

  it('permite una cita que empieza cuando la anterior termina', () => {
    const existing = schedule('appointment-1', 15, 16);

    const next = schedule('appointment-2', 16, 17, [existing]);

    expect(next.currentStatus).toBe('pendiente');
  });

  it('permite el mismo horario para otro doctor', () => {
    const existing = schedule('appointment-1', 15, 16);

    const next = schedule('appointment-2', 15, 16, [existing], otherDoctorId);

    expect(next.staffId).toBe(otherDoctorId);
  });

  it('permite ocupar el horario de una cita cancelada', () => {
    const existing = schedule('appointment-1', 15, 16);
    existing.cancel();

    const next = schedule('appointment-2', 15, 16, [existing]);

    expect(next.id).toBe('appointment-2');
  });

  it('emite AppointmentConfirmed al confirmar una cita pendiente', () => {
    const appointment = schedule('appointment-1', 15, 16);

    appointment.confirm();

    expect(appointment.currentStatus).toBe('confirmada');
    expect(appointment.pullEvents()).toEqual([
      expect.objectContaining({
        appointmentId: 'appointment-1',
        patientId,
        staffId: doctorId,
      }),
    ]);
  });
});
