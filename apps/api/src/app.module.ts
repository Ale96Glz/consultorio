import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClinicalModule } from './clinical/clinical.module';
import { IdentityModule } from './identity/identity.module';
import { SchedulingModule } from './scheduling/scheduling.module';

@Module({
  imports: [IdentityModule, ClinicalModule, SchedulingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
