import { DocumentId } from './document-id';

export class DuplicateDocumentIdError extends Error {
  constructor() {
    super('Ya existe una ficha activa con ese documento.');
    this.name = 'DuplicateDocumentIdError';
  }
}

type RegisterPatient = {
  id: string;
  givenNames: string;
  familyName: string;
  documentId: string;
  phone: string;
  birthDate: Date;
};

export class Patient {
  private deletedAtValue: Date | null;

  private constructor(
    readonly id: string,
    readonly givenNames: string,
    readonly familyName: string,
    readonly documentId: DocumentId,
    readonly phone: string,
    readonly birthDate: Date,
    deletedAt: Date | null,
  ) {
    this.deletedAtValue = deletedAt;
  }

  static register(
    input: RegisterPatient,
    existing: readonly Patient[],
  ): Patient {
    const documentId = DocumentId.create(input.documentId);
    const patient = new Patient(
      input.id,
      input.givenNames,
      input.familyName,
      documentId,
      input.phone,
      input.birthDate,
      null,
    );

    const taken = existing.some(
      (other) => other.isActive() && other.documentId.equals(documentId),
    );
    if (taken) {
      throw new DuplicateDocumentIdError();
    }

    return patient;
  }

  static rehydrate(
    input: RegisterPatient & { deletedAt: Date | null },
  ): Patient {
    return new Patient(
      input.id,
      input.givenNames,
      input.familyName,
      DocumentId.create(input.documentId),
      input.phone,
      input.birthDate,
      input.deletedAt,
    );
  }

  get fullName(): string {
    return `${this.givenNames} ${this.familyName}`;
  }

  get deletedAt(): Date | null {
    return this.deletedAtValue;
  }

  isActive(): boolean {
    return this.deletedAtValue === null;
  }

  deactivate(at: Date): void {
    if (this.deletedAtValue) {
      return;
    }

    this.deletedAtValue = at;
  }
}
