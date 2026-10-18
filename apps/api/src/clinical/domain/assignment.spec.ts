import {
  Assignment,
  DuplicateAssignmentError,
  StaffCannotBeAssignedError,
} from './assignment';

const doctorId = 'staff-doctor-1';
const otherDoctorId = 'staff-doctor-2';
const patientId = 'patient-1';
const otherPatientId = 'patient-2';

function assign(
  id: string,
  staffId = doctorId,
  assignedPatientId = patientId,
  existing: readonly Assignment[] = [],
  role: 'doctor' | 'receptionist' | 'admin' = 'doctor',
): Assignment {
  return Assignment.assign(
    { id, staffId, patientId: assignedPatientId, role },
    existing,
  );
}

describe('Assignment', () => {
  it('vincula un doctor con un paciente', () => {
    const assignment = assign('assignment-1');

    expect(assignment.staffId).toBe(doctorId);
    expect(assignment.patientId).toBe(patientId);
  });

  it.each(['receptionist', 'admin'] as const)(
    'rechaza a un miembro con rol %s',
    (role) => {
      expect(() =>
        assign('assignment-1', doctorId, patientId, [], role),
      ).toThrow(StaffCannotBeAssignedError);
    },
  );

  it('rechaza el mismo doctor con el mismo paciente', () => {
    const existing = assign('assignment-1');

    expect(() =>
      assign('assignment-2', doctorId, patientId, [existing]),
    ).toThrow(DuplicateAssignmentError);
  });

  it('permite al mismo doctor con otro paciente', () => {
    const existing = assign('assignment-1');

    const assignment = assign('assignment-2', doctorId, otherPatientId, [
      existing,
    ]);

    expect(assignment.patientId).toBe(otherPatientId);
  });

  it('permite a otro doctor con el mismo paciente', () => {
    const existing = assign('assignment-1');

    const assignment = assign('assignment-2', otherDoctorId, patientId, [
      existing,
    ]);

    expect(assignment.staffId).toBe(otherDoctorId);
  });
});
