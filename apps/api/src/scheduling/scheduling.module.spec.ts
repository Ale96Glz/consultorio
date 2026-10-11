import { Test } from '@nestjs/testing';
import { PrismaService } from '../infrastructure/prisma.service';
import { ScheduleAppointment } from './application/schedule-appointment';
import { SchedulingModule } from './scheduling.module';

describe('SchedulingModule', () => {
  it('resuelve el caso de uso con los adaptadores de Prisma', async () => {
    const module = await Test.createTestingModule({
      imports: [SchedulingModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(module.get(ScheduleAppointment)).toBeInstanceOf(ScheduleAppointment);
  });
});
