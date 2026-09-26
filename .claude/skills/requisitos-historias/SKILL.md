---
name: requisitos-historias
description: Formato para requisitos funcionales, no funcionales e historias de usuario de este proyecto. Úsalo al documentar nuevas features.
---

## Requisito funcional (docs/requirements/funcionales.md)
RF-XXX: [nombre]
Como [rol], el sistema debe [comportamiento], para que [razón].
Criterios de aceptación: lista en Gherkin (Given/When/Then)

## Requisito no funcional (docs/requirements/no-funcionales.md)
RNF-XXX: [categoría: performance, seguridad, disponibilidad, cumplimiento]
Descripción medible (ej: "el 95% de las consultas de agenda responden en <300ms")

## Historia de usuario (docs/user-stories/<contexto>.md)
Formato INVEST: Como [rol] quiero [acción] para [beneficio]
Incluye: criterios de aceptación, RF/RNF relacionados, notas de UX si aplica