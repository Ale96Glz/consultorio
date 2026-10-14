import { Test } from '@nestjs/testing';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../infrastructure/prisma.service';
import { CancelAppointment } from './application/cancel-appointment';
import { ConfirmAppointment } from './application/confirm-appointment';
import { ScheduleAppointment } from './application/schedule-appointment';
import { SchedulingModule } from './scheduling.module';

describe('SchedulingModule', () => {
  it('resuelve los casos de uso con los adaptadores de Prisma', async () => {
    const module = await Test.createTestingModule({
      imports: [SchedulingModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    expect(module.get(ScheduleAppointment)).toBeInstanceOf(ScheduleAppointment);
    expect(module.get(ConfirmAppointment)).toBeInstanceOf(ConfirmAppointment);
    expect(module.get(CancelAppointment)).toBeInstanceOf(CancelAppointment);
  });
});
