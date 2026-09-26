# 0001. Elección de stack tecnológico

## Estado

Aceptada

## Contexto

El proyecto es un sistema de gestión clínica (pacientes, citas, expedientes médicos) que debe:

- Soportar reglas de negocio no triviales (solapamiento de citas, control de acceso a expedientes por rol y relación médico-paciente, trazabilidad/auditoría de accesos a datos clínicos).
- Manejar datos sensibles de salud, lo que exige control fino de autorización y auditoría, no solo autenticación básica.
- Crecer en el tiempo con nuevos bounded contexts (facturación, notificaciones, integraciones con laboratorios) sin que el modelo de datos se vuelva difícil de mantener.
- Ser desarrollado y mantenido por un equipo que puede no tener experiencia profunda en políticas de seguridad a nivel de base de datos (RLS de Postgres).

Se evaluó apoyarse completamente en Supabase (base de datos + Auth + Storage + RLS como única capa de autorización) frente a introducir una capa de aplicación propia con un framework backend estructurado.

## Decisión

El stack del proyecto es:

- **Backend**: NestJS, organizado por bounded contexts siguiendo Domain-Driven Design (capas domain / application / infrastructure / interface por contexto).
- **Acceso a datos**: Prisma como ORM, con Postgres como motor de base de datos.
- **Autenticación**: Better Auth, integrado en la capa de infraestructura de la API Nest, con sesión vía cookie httpOnly.
- **Frontend**: Angular, con componentes standalone y formularios reactivos.
- **Documentación de arquitectura**: Architecture Decision Records (este documento y los que le sigan) y modelado de dominio explícito (glosario ubicuo, bounded contexts, diagramas C4 y de secuencia).

La lógica de negocio y las reglas de autorización viven en la capa de aplicación/dominio de Nest, no en la base de datos ni en el frontend. Postgres se usa como motor de persistencia relacional estándar, sin depender de políticas RLS como mecanismo principal de control de acceso.

## Consecuencias

**Se gana:**

- Control total y testeable de la lógica de negocio y de las reglas de autorización, escrito en TypeScript en un solo lugar (la API), en vez de repartido entre políticas SQL, checks de frontend y triggers.
- Tipado end-to-end entre el modelo de dominio y la base de datos gracias a Prisma, y migraciones versionadas y revisables en pull requests.
- Una estructura de código alineada con DDD que escala mejor a medida que se agregan bounded contexts nuevos (facturación, notificaciones, etc.).
- Independencia de proveedor: no queda un acoplamiento fuerte a las particularidades de Supabase (RLS, Edge Functions) que dificulte migrar de proveedor de hosting de base de datos en el futuro.

**Se sacrifica / queda pendiente:**

- Más código propio que mantener comparado con delegar autenticación y autorización a Supabase Auth + RLS; el equipo asume la responsabilidad de escribir y testear guards y validaciones de acceso.
- Se requiere disciplina para no dejar que la lógica de negocio se filtre a los controladores de Nest o a componentes de Angular; esto se refuerza con el skill `nest-api-conventions` y `ddd-conventions`.
- Un proveedor de hosting de Postgres (pueda o no ser Supabase) sigue siendo necesario; esta decisión no cubre todavía dónde se aloja la base de datos ni el almacenamiento de archivos (se documentará en un ADR posterior si se usa Supabase Storage u otra alternativa).

## Alternativas consideradas

**Supabase como plataforma completa (DB + Auth + Storage + RLS), sin backend propio.**
Descartada como enfoque principal porque la autorización basada en RLS es más difícil de testear y auditar para las reglas de negocio de este dominio (relación médico-paciente, solapamiento de citas, trazabilidad de accesos a expedientes), y porque el equipo no tiene experiencia profunda escribiendo políticas de Postgres, lo que aumenta el riesgo de errores de seguridad en datos de salud.

**Firebase (Firestore + Auth) como backend gestionado.**
Descartada por preferir un modelo de datos relacional, que se ajusta mejor a las relaciones del dominio clínico (pacientes, citas, expedientes, profesionales) que un modelo de documentos NoSQL.

**Supabase Auth en lugar de Better Auth.**
Descartada para mantener la autenticación dentro de la propia capa de infraestructura de Nest en vez de depender de un servicio externo, y por la flexibilidad de Better Auth para modelar roles y organizaciones directamente en TypeScript, en línea con el resto de la arquitectura basada en Nest.