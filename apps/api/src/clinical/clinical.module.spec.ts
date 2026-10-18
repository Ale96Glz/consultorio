import { Test } from '@nestjs/testing';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../infrastructure/prisma.service';
import { AssignDoctor } from './application/assign-doctor';
import { DeactivatePatient } from './application/deactivate-patient';
import { RegisterPatient } from './application/register-patient';
import { ClinicalModule } from './clinical.module';

describe('ClinicalModule', () => {
  it('resuelve los casos de uso con los adaptadores de Prisma', async () => {
    const module = await Test.createTestingModule({
      imports: [ClinicalModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    expect(module.get(RegisterPatient)).toBeInstanceOf(RegisterPatient);
    expect(module.get(DeactivatePatient)).toBeInstanceOf(DeactivatePatient);
    expect(module.get(AssignDoctor)).toBeInstanceOf(AssignDoctor);
  });
});
