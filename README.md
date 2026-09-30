# Consultorio

Sistema de gestión para una clínica: pacientes, agenda y expedientes médicos. La lógica de negocio y la autorización viven en la API.

## Stack

- **API:** NestJS, organizada por bounded contexts (domain, application, infrastructure, interface)
- **Datos:** Prisma y Postgres
- **Sesión:** Better Auth, embebido en Nest, con cookie httpOnly
- **Frontend:** Angular, componentes standalone y formularios reactivos

La decisión y las alternativas descartadas están en [docs/adr/001-eleccion-stack.md](docs/adr/001-eleccion-stack.md).

## Contextos

| Contexto | Responsabilidad |
| --- | --- |
| Identity | Usuarios de staff, roles (doctor, receptionist, admin) y sesión |
| Scheduling | Citas y disponibilidad. Una cita no puede solaparse con otra del mismo profesional |
| Clinical | Ficha del paciente, expediente, diagnóstico y notas |
| Billing | Facturación, cuando exista |

Patient es la ficha clínica, no un rol de acceso. Un doctor solo ve expedientes de sus pacientes asignados; esa regla se comprueba en el caso de uso, además del guard de rol.

El vocabulario del dominio está en [docs/domain/ubiquitous-language.md](docs/domain/ubiquitous-language.md).

## Estructura

```
apps/api          API Nest
apps/web          Aplicación Angular
docs/adr          Decisiones de arquitectura
docs/diagrams     Diagramas C4, ER y de secuencia
docs/domain       Glosario del dominio
docs/requirements Requisitos funcionales y no funcionales
docs/user-stories Historias de usuario
.claude/skills    Convenciones que sigue el desarrollo
```

## Estado

La API Nest está en `apps/api` y la aplicación Angular en `apps/web`. Las dos arrancan con el proyecto inicial de cada CLI. Los contextos, la sesión y las pantallas de la clínica se agregan en pasos siguientes.

```powershell
cd apps/web
npm start
```

## Privacidad

Los expedientes son datos de salud. Cada lectura o escritura de un expediente queda en un registro de auditoría. El contenido clínico no se escribe en los logs de la aplicación. Los adjuntos van a un almacenamiento privado con URL firmada; el proveedor de ese almacenamiento se decide en un ADR aparte.
