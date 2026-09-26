---
name: privacidad-datos-salud
description: Reglas de privacidad y auditoría para datos clínicos sensibles. Aplica a cualquier endpoint, query o componente que toque MedicalRecord o datos de Patient.
user-invocable: false
---

- Nunca loguear contenido de MedicalRecord en logs de aplicación
- Todo acceso de lectura/escritura a MedicalRecord se registra en tabla AuditLog (quién, cuándo, qué acción)
- No exponer campos médicos en respuestas de listados generales (solo en detalle, con permiso verificado)
- Adjuntos médicos van a almacenamiento de objetos privado, con URL firmada de corta duración, nunca público. El proveedor queda para un ADR posterior (el ADR 001 lo dejó pendiente)