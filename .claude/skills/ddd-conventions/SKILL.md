---
name: ddd-conventions
description: Cómo modelar el dominio con DDD en este proyecto — bounded contexts, agregados, entidades, value objects y eventos de dominio.
user-invocable: false
---

## Bounded contexts de la clínica
- **Scheduling**: citas, disponibilidad de agenda
- **Clinical**: Patient (ficha clínica), expedientes, diagnósticos, notas médicas
- **Identity**: usuarios de staff, roles (doctor, receptionist, admin), sesión con Better Auth embebido en Nest
- **Billing**: facturación (cuando exista)

## Reglas de modelado
- Un agregado por invariante que debe protegerse (ej: Appointment es su propio agregado, protege "no dos citas del mismo profesional se solapan")
- Entidades con identidad (Patient, Appointment) vs Value Objects sin ella (DateRange, DocumentId)
- Lógica de negocio vive en el agregado o en Domain Services, nunca en el controller de Nest
- Cambios de estado importantes emiten Domain Events (ej: AppointmentConfirmed, MedicalRecordUpdated)
- Antes de crear un concepto nuevo, revisa docs/domain/ubiquitous-language.md y usa el mismo término ahí

## Estructura de carpetas por bounded context
Los módulos de Nest coinciden con el contexto: identity, scheduling, clinical.

apps/api/src/<contexto>/
  domain/         # entidades, value objects, eventos
  application/    # casos de uso / commands
  infrastructure/ # repositorios Prisma
  interface/      # controllers Nest