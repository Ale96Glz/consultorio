import { Injectable } from '@nestjs/common';
import { Appointment } from '../domain/appointment';
import type { AppointmentRepository } from './appointment-repository';
import type { PatientLookup } from './patient-lookup';

export class PatientUnavailableError extends Error {
  constructor() {
    super('No se agenda una cita si el paciente no está activo.');
    this.name = 'PatientUnavailableError';
  }
}

export type ScheduleAppointmentCommand = {
  patientId: string;
  staffId: string;
  startsAt: Date;
  endsAt: Date;
};

@Injectable()
export class ScheduleAppointment {
  constructor(
    private readonly patients: PatientLookup,
    private readonly appointments: AppointmentRepository,
  ) {}

  async execute(command: ScheduleAppointmentCommand): Promise<Appointment> {
    const patient = await this.patients.findById(command.patientId);
    if (!patient || patient.deletedAt) {
      throw new PatientUnavailableError();
    }

    const existing = await this.appointments.findOccupyingByStaff(
      command.staffId,
    );
    const appointment = Appointment.schedule(
      {
        id: crypto.randomUUID(),
        patientId: command.patientId,
        staffId: command.staffId,
        startsAt: command.startsAt,
        endsAt: command.endsAt,
      },
      existing,
    );

    await this.appointments.save(appointment);
    return appointment;
  }
}
