---
name: angular-forms-clinica
description: Patrones para formularios de pacientes y citas — validaciones, campos sensibles y manejo de errores de la API.
---

- Validadores custom para: CURP/documento de identidad, teléfono, fechas de nacimiento razonables
- Mostrar errores de backend (409 solapamiento de cita, 403 sin permiso) con mensajes claros, no el error crudo
- Campos de datos sensibles (diagnóstico, notas) con confirmación antes de guardar cambios