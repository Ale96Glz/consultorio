import { Injectable } from '@nestjs/common';
import { Appointment } from '../domain/appointment';
import { AppointmentRepository } from './appointment-repository';

export class AppointmentNotFoundError extends Error {
  constructor() {
    super('La cita no existe.');
    this.name = 'AppointmentNotFoundError';
  }
}

export type ConfirmAppointmentCommand = {
  appointmentId: string;
};

@Injectable()
export class ConfirmAppointment {
  constructor(private readonly appointments: AppointmentRepository) {}

  async execute(command: ConfirmAppointmentCommand): Promise<Appointment> {
    const appointment = await this.appointments.findById(command.appointmentId);
    if (!appointment) {
      throw new AppointmentNotFoundError();
    }

    appointment.confirm();
    await this.appointments.save(appointment);
    return appointment;
  }
}
