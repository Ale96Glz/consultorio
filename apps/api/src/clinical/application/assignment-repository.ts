import type { Assignment } from '../domain/assignment';

export abstract class AssignmentRepository {
  abstract findByPair(
    staffId: string,
    patientId: string,
  ): Promise<Assignment | null>;
  abstract save(assignment: Assignment): Promise<void>;
}
