---
name: auth-better-auth
description: Cómo funciona la autenticación y autorización por rol con Better Auth en este proyecto.
---

- Better Auth corre embebido en la API Nest (adapter oficial), sesión vía cookie httpOnly
- Roles de acceso: doctor, receptionist, admin, como plugin de roles/organizaciones de Better Auth o tabla propia enlazada al userId
- Patient es la ficha del contexto Clinical. Un portal para que el paciente inicie sesión queda para un ADR posterior
- Guards de Nest verifican la sesión de Better Auth. El navegador envía la cookie httpOnly
- Un doctor solo accede a expedientes de sus pacientes asignados; esa regla vive en el Application Service de clinical, nunca solo en el guard
