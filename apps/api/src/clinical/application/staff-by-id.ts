import type { AssignmentStaffRole } from '../domain/assignment';

export type StaffMember = {
  id: string;
  role: AssignmentStaffRole;
};

export abstract class StaffById {
  abstract findById(staffId: string): Promise<StaffMember | null>;
}
