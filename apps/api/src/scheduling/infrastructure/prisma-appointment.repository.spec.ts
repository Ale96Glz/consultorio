import { Appointment } from '../domain/appointment';
import { PrismaAppointmentRepository } from './prisma-appointment.repository';
import type { PrismaService } from '../../infrastructure/prisma.service';

function at(hour: number): Date {
  return new Date(Date.UTC(2026, 9, 8, hour));
}

describe('PrismaAppointmentRepository', () => {
  const findUnique = jest.fn();
  const findMany = jest.fn();
  const upsert = jest.fn();
  const prisma = {
    appointment: { findUnique, findMany, upsert },
  } as unknown as PrismaService;
  const repository = new PrismaAppointmentRepository(prisma);

  beforeEach(() => {
    findUnique.mockReset();
    findMany.mockReset();
    upsert.mockReset();
  });

  it('reconstruye la cita pedida', async () => {
    findUnique.mockResolvedValue({
      id: 'appointment-1',
      patientId: 'patient-1',
      staffId: 'staff-doctor-1',
      startsAt: at(15),
      endsAt: at(16),
      status: 'pendiente',
    });

    const appointment = await repository.findById('appointment-1');

    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'appointment-1' } });
    expect(appointment?.currentStatus).toBe('pendiente');
  });

  it('devuelve null si la cita no existe', async () => {
    findUnique.mockResolvedValue(null);

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('reconstruye solo las citas que ocupan la agenda del doctor', async () => {
    findMany.mockResolvedValue([
      {
        id: 'appointment-1',
        patientId: 'patient-1',
        staffId: 'staff-doctor-1',
        startsAt: at(15),
        endsAt: at(16),
        status: 'confirmada',
      },
    ]);

    const appointments =
      await repository.findOccupyingByStaff('staff-doctor-1');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        staffId: 'staff-doctor-1',
        status: { in: ['pendiente', 'confirmada'] },
      },
    });
    expect(appointments).toHaveLength(1);
    expect(appointments[0].currentStatus).toBe('confirmada');
    expect(appointments[0].occupiesAgenda()).toBe(true);
  });

  it('guarda la cita con su rango y su estado', async () => {
    const appointment = Appointment.schedule(
      {
        id: 'appointment-2',
        patientId: 'patient-1',
        staffId: 'staff-doctor-1',
        startsAt: at(16),
        endsAt: at(17),
      },
      [],
    );
    upsert.mockResolvedValue({});

    await repository.save(appointment);

    expect(upsert).toHaveBeenCalledWith({
      where: { id: 'appointment-2' },
      create: {
        id: 'appointment-2',
        patientId: 'patient-1',
        staffId: 'staff-doctor-1',
        startsAt: at(16),
        endsAt: at(17),
        status: 'pendiente',
      },
      update: {
        patientId: 'patient-1',
        staffId: 'staff-doctor-1',
        startsAt: at(16),
        endsAt: at(17),
        status: 'pendiente',
      },
    });
  });
});
