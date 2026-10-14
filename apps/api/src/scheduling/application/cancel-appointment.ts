import { Injectable } from '@nestjs/common';
import { Appointment } from '../domain/appointment';
import { AppointmentRepository } from './appointment-repository';
import { AppointmentNotFoundError } from './confirm-appointment';

export type CancelAppointmentCommand = {
  appointmentId: string;
};

@Injectable()
export class CancelAppointment {
  constructor(private readonly appointments: AppointmentRepository) {}

  async execute(command: CancelAppointmentCommand): Promise<Appointment> {
    const appointment = await this.appointments.findById(command.appointmentId);
    if (!appointment) {
      throw new AppointmentNotFoundError();
    }

    appointment.cancel();
    await this.appointments.save(appointment);
    return appointment;
  }
}
