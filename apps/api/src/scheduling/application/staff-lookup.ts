export type StaffRole = 'doctor' | 'receptionist' | 'admin';

export type StaffSnapshot = {
  id: string;
  role: StaffRole;
};

export abstract class StaffLookup {
  abstract findById(staffId: string): Promise<StaffSnapshot | null>;
}
