export type StaffRole = 'doctor' | 'receptionist' | 'admin';

export type StaffSnapshot = {
  id: string;
  role: StaffRole;
};

export interface StaffLookup {
  findById(staffId: string): Promise<StaffSnapshot | null>;
}
