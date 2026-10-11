import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { AppointmentRepository } from '../application/appointment-repository';
import { Appointment } from '../domain/appointment';

@Injectable()
export class PrismaAppointmentRepository extends AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Appointment | null> {
    const row = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!row) {
      return null;
    }

    return Appointment.rehydrate({
      id: row.id,
      patientId: row.patientId,
      staffId: row.staffId,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      status: row.status,
    });
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
    const data = {
      patientId: appointment.patientId,
      staffId: appointment.staffId,
      startsAt: appointment.dateRange.startsAt,
      endsAt: appointment.dateRange.endsAt,
      status: appointment.currentStatus,
    };

    await this.prisma.appointment.upsert({
      where: { id: appointment.id },
      create: { id: appointment.id, ...data },
      update: data,
    });
  }
}
