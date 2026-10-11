import { StaffByUser, type StaffMember } from './staff-by-user';
import { CurrentStaff, StaffUnassignedError } from './current-staff';

class InMemoryStaff extends StaffByUser {
  constructor(
    private readonly members: Array<StaffMember & { userId: string }>,
  ) {
    super();
  }

  async findByUserId(userId: string): Promise<StaffMember | null> {
    const member = this.members.find((item) => item.userId === userId);
    if (!member) {
      return null;
    }

    return { id: member.id, role: member.role };
  }
}

describe('CurrentStaff', () => {
  it('devuelve el miembro ligado al usuario', async () => {
    const current = new CurrentStaff(
      new InMemoryStaff([{ id: 'staff-1', userId: 'user-1', role: 'doctor' }]),
    );

    await expect(current.execute('user-1')).resolves.toEqual({
      id: 'staff-1',
      role: 'doctor',
    });
  });

  it('falla si el usuario no es miembro de la clínica', async () => {
    const current = new CurrentStaff(new InMemoryStaff([]));

    await expect(current.execute('user-1')).rejects.toThrow(
      StaffUnassignedError,
    );
  });
});
