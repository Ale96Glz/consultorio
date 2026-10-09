import { AppointmentConfirmed } from './appointment-confirmed';
import { DateRange } from './date-range';

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'cancelada';

export class AppointmentOverlapError extends Error {
  constructor() {
    super('Dos citas activas del mismo profesional se solapan.');
    this.name = 'AppointmentOverlapError';
  }
}

export class AppointmentStatusError extends Error {
  constructor() {
    super('Solo una cita pendiente puede confirmarse.');
    this.name = 'AppointmentStatusError';
  }
}

type ScheduleAppointment = {
  id: string;
  patientId: string;
  staffId: string;
  startsAt: Date;
  endsAt: Date;
};

export class Appointment {
  private status: AppointmentStatus;
  private readonly events: AppointmentConfirmed[] = [];

  private constructor(
    readonly id: string,
    readonly patientId: string,
    readonly staffId: string,
    readonly dateRange: DateRange,
    status: AppointmentStatus,
  ) {
    this.status = status;
  }

  static schedule(
    input: ScheduleAppointment,
    existing: readonly Appointment[],
  ): Appointment {
    const dateRange = DateRange.create(input.startsAt, input.endsAt);
    const appointment = new Appointment(
      input.id,
      input.patientId,
      input.staffId,
      dateRange,
      'pendiente',
    );

    const conflict = existing.some((other) => appointment.conflictsWith(other));
    if (conflict) {
      throw new AppointmentOverlapError();
    }

    return appointment;
  }

  get currentStatus(): AppointmentStatus {
    return this.status;
  }

  occupiesAgenda(): boolean {
    return this.status === 'pendiente' || this.status === 'confirmada';
  }

  conflictsWith(other: Appointment): boolean {
    if (this.id === other.id || this.staffId !== other.staffId) {
      return false;
    }

    if (!this.occupiesAgenda() || !other.occupiesAgenda()) {
      return false;
    }

    return this.dateRange.overlaps(other.dateRange);
  }

  confirm(): void {
    if (this.status !== 'pendiente') {
      throw new AppointmentStatusError();
    }

    this.status = 'confirmada';
    this.events.push(
      new AppointmentConfirmed(this.id, this.patientId, this.staffId),
    );
  }

  cancel(): void {
    this.status = 'cancelada';
  }

  pullEvents(): AppointmentConfirmed[] {
    return this.events.splice(0);
  }
}
