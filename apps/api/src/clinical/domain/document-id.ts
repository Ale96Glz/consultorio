export class InvalidDocumentIdError extends Error {
  constructor() {
    super('El documento de identidad no puede estar vacío.');
    this.name = 'InvalidDocumentIdError';
  }
}

export class DocumentId {
  private constructor(readonly value: string) {}

  static create(value: string): DocumentId {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new InvalidDocumentIdError();
    }

    return new DocumentId(trimmed);
  }

  equals(other: DocumentId): boolean {
    return this.value === other.value;
  }
}
