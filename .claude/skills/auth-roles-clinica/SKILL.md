---
name: auth-roles-clinica
description: Autorización por rol (doctor, recepción, admin) sobre datos clínicos. La sesión la define el skill auth-better-auth.
---

- La sesión es la de Better Auth (cookie httpOnly). Este skill no define otro mecanismo de login
- Roles: doctor, receptionist, admin, ligados al usuario de Identity. Patient es la ficha del contexto Clinical
- Un doctor solo puede ver expedientes de sus pacientes asignados, salvo admin
- Esa relación médico-paciente se comprueba en el Application Service de clinical. El guard acredita sesión y rol
