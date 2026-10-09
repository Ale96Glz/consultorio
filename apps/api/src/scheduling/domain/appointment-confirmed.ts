export class AppointmentConfirmed {
  constructor(
    readonly appointmentId: string,
    readonly patientId: string,
    readonly staffId: string,
  ) {}
}
