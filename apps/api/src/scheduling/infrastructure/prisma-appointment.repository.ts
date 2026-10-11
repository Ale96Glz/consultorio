import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { AppointmentRepository } from '../application/appointment-repository';
import { Appointment } from '../domain/appointment';

@Injectable()
export class PrismaAppointmentRepository extends AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findOccupyingByStaff(staffId: string): Promise<Appointment[]> {
    const rows = await this.prisma.appointment.findMany({
      where: {
        staffId,
        status: { in: ['pendiente', 'confirmada'] },
      },
    });

    return rows.map((row) =>
      Appointment.rehydrate({
        id: row.id,
        patientId: row.patientId,
        staffId: row.staffId,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        status: row.status,
      }),
    );
  }

  async save(appointment: Appointment): Promise<void> {
    await this.prisma.appointment.create({
      data: {
        id: appointment.id,
        patientId: appointment.patientId,
        staffId: appointment.staffId,
        startsAt: appointment.dateRange.startsAt,
        endsAt: appointment.dateRange.endsAt,
        status: appointment.currentStatus,
      },
    });
  }
}
