---
name: diagramas
description: Cómo y dónde generar diagramas del proyecto (C4, entidad-relación, secuencia) usando Mermaid.
---

- Todos los diagramas van en docs/diagrams/*.mmd, en formato Mermaid
- Nivel 1 (Contexto C4): sistemas externos, actores (paciente, staff)
- Nivel 2 (Contenedores C4): app Angular, API Nest (Better Auth embebido), Postgres
- Diagrama ER: se regenera cuando cambia el schema de Prisma (ver skill prisma-migrations)
- Diagramas de secuencia: para flujos críticos (agendar cita, crear expediente, login)
- Referencia el diagrama correspondiente desde el ADR o historia de usuario relacionada