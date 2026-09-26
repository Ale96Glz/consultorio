---
name: nest-api-conventions
description: Convenciones de arquitectura para módulos, controladores, DTOs y servicios en NestJS de este proyecto.
---

- Un módulo Nest por bounded context: identity, scheduling, clinical (billing cuando exista). Patient y MedicalRecord viven en clinical; Appointment en scheduling
- DTOs con class-validator en cada endpoint, nunca aceptar el body crudo
- Guards de rol (RolesGuard) en cada controlador que toque datos clínicos: comprueban la sesión de Better Auth y el rol. La relación médico-paciente se valida en el Application Service
- Errores de negocio como excepciones tipadas (NotFoundException, ForbiddenException), nunca strings genéricos
- Todo endpoint que lee/escribe MedicalRecord registra auditoría (ver skill privacidad-datos-salud)