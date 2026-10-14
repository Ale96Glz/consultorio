import { Test } from '@nestjs/testing';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../infrastructure/prisma.service';
import { RegisterPatient } from './application/register-patient';
import { ClinicalModule } from './clinical.module';

describe('ClinicalModule', () => {
  it('resuelve el registro de la ficha con el adaptador de Prisma', async () => {
    const module = await Test.createTestingModule({
      imports: [ClinicalModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    expect(module.get(RegisterPatient)).toBeInstanceOf(RegisterPatient);
  });
});
