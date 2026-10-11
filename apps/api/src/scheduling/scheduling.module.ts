import { Module } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma.service';
import { PrismaAppointmentRepository } from './infrastructure/prisma-appointment.repository';

@Module({
  providers: [PrismaService, PrismaAppointmentRepository],
  exports: [PrismaAppointmentRepository],
})
export class SchedulingModule {}
