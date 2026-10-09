export class InvalidDateRangeError extends Error {
  constructor() {
    super('El fin de la cita tiene que ser posterior al inicio.');
    this.name = 'InvalidDateRangeError';
  }
}

export class DateRange {
  private constructor(
    readonly startsAt: Date,
    readonly endsAt: Date,
  ) {}

  static create(startsAt: Date, endsAt: Date): DateRange {
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new InvalidDateRangeError();
    }

    return new DateRange(startsAt, endsAt);
  }

  overlaps(other: DateRange): boolean {
    return this.startsAt < other.endsAt && other.startsAt < this.endsAt;
  }
}
