export type StaffRole = 'doctor' | 'receptionist' | 'admin';

export type StaffMember = {
  id: string;
  role: StaffRole;
};

export abstract class StaffByUser {
  abstract findByUserId(userId: string): Promise<StaffMember | null>;
}
