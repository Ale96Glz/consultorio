import { Test } from '@nestjs/testing';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
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
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    expect(module.get(ScheduleAppointment)).toBeInstanceOf(ScheduleAppointment);
  });
});
