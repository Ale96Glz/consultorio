---
name: db-schema-clinica
description: Modelo de datos de la clínica — pacientes, citas, expedientes, profesionales y roles. Úsalo al crear o modificar modelos Prisma, migraciones o queries.
user-invocable: false
---

El detalle de agregados, columnas y relaciones está en docs/domain/model.md. Este skill no lo reemplaza.

## Entidades principales
- Patient: datos personales + historial (relación 1-N con MedicalRecord)
- Appointment: paciente, profesional, fecha/hora, estado (pendiente/confirmada/cancelada)
- MedicalRecord: notas clínicas, diagnóstico, adjuntos en almacenamiento de objetos privado (proveedor pendiente de ADR)
- Staff: doctor, recepcionista, admin. El rol pertenece a Identity y va ligado al userId; Patient no es un rol

## Convenciones
- IDs: UUID siempre
- Timestamps: createdAt/updatedAt en cada tabla
- Soft delete en Patient y MedicalRecord (deletedAt), nunca borrado físico
- Toda tabla con datos clínicos lleva auditoría (ver skill privacidad-datos-salud)