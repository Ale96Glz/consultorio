---
name: testing-conventions
description: Cómo escribir tests unitarios e2e en este proyecto (Nest + Angular).
---

- Nest: Jest, mockear Prisma con un cliente de test, un spec por service
- Angular: Jasmine/Karma o Jest según lo configurado, testear componentes con TestBed
- Todo endpoint de citas necesita test de solapamiento de horario
- Todo endpoint de expedientes necesita test de control de acceso por rol