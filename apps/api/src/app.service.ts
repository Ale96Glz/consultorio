import { Injectable } from '@nestjs/common';

export type HealthStatus = {
  status: 'ok';
};

@Injectable()
export class AppService {
  check(): HealthStatus {
    return { status: 'ok' };
  }
}
