# Modelo de dominio

Decisiones de estructura, agregados y relaciones para implementar Identity, Clinical y Scheduling sin reinterpretar el [lenguaje ubicuo](ubiquitous-language.md). Billing no entra. El diagrama está en [docs/diagrams/er-dominio.mmd](../diagrams/er-dominio.mmd).

Hay una sola base Postgres. Los contextos son módulos de Nest, no bases separadas. Prisma tendrá un schema, con los modelos agrupados por contexto. Un contexto puede guardar el id de una entidad de otro; no copia sus datos.

## Estructura de la API

```
apps/api/src/
  identity/        Staff y el enlace con Better Auth
  clinical/        Patient, Assignment, MedicalRecord, Attachment, AuditLog
  scheduling/      Appointment
```

Cada contexto usa `domain`, `application`, `infrastructure` e `interface`. Better Auth vive en `identity/infrastructure`. La sesión no se modela en Clinical ni en Scheduling: la emite Better Auth y el guard la lee.

## Agregados

| Agregado | Contexto | Invariante que protege |
| --- | --- | --- |
| Staff | Identity | Un User tiene un solo Staff y un solo Role |
| Patient | Clinical | DocumentId único entre fichas no dadas de baja |
| Assignment | Clinical | Un doctor y un Patient se vinculan una sola vez, y el Staff tiene Role `doctor` |
| MedicalRecord | Clinical | Pertenece a un Patient; diagnóstico y notas son su contenido |
| Appointment | Scheduling | Dos citas activas del mismo doctor no comparten ningún instante |

Attachment y AuditLog no son agregados raíz. Viven dentro del ciclo de MedicalRecord.

## Entidades y columnas

Todas las tablas usan `id` UUID, `createdAt` y `updatedAt`. La baja lógica (`deletedAt`) existe solo en Patient y MedicalRecord.

### Staff

Miembro de la clínica. Una fila por User de Better Auth (`userId` único).

| Columna | Notas |
| --- | --- |
| userId | Id del User de Better Auth. Identity no duplica la contraseña ni la Session |
| role | `doctor`, `receptionist` o `admin`. Un solo valor |

Scheduling y Clinical referencian `staffId`. No guardan `userId`.

### Patient

Ficha clínica. No tiene User ni Role.

| Columna | Notas |
| --- | --- |
| givenNames | Nombres |
| familyName | Apellidos |
| documentId | CURP u otro documento. Único cuando `deletedAt` es nulo |
| phone | Un teléfono |
| birthDate | Fecha, sin hora |

El nombre visible de la ficha es givenNames más familyName. No hay más columnas de nombre hasta que el lenguaje ubicuo las agregue.

### Assignment

| Columna | Notas |
| --- | --- |
| staffId | Staff con Role `doctor` |
| patientId | Patient |

Único el par (`staffId`, `patientId`). Un Patient puede tener varios doctores. Un doctor accede a los MedicalRecord de los Patient con los que tiene Assignment. El admin accede por la regla del caso de uso, sin Assignment.

### MedicalRecord

| Columna | Notas |
| --- | --- |
| patientId | Dueño del historial |
| diagnosis | Texto. No es una entidad |
| notes | Texto. No es una entidad |
| deletedAt | Baja lógica |

El historial es esta relación de uno a muchos. No hay tabla Historial.

### Attachment

| Columna | Notas |
| --- | --- |
| medicalRecordId | Expediente dueño |
| objectKey | Clave en el almacenamiento privado |
| fileName | Nombre original |
| contentType | Tipo del archivo |

El archivo no se guarda en Postgres. La URL firmada se genera al leer y no se persiste. El proveedor del almacenamiento queda para un ADR.

### AuditLog

| Columna | Notas |
| --- | --- |
| medicalRecordId | Expediente accedido |
| staffId | Quién accedió |
| action | `read`, `create` o `update` |
| at | Momento del acceso |

No guarda diagnóstico, notas ni el archivo. Cada lectura o escritura de un MedicalRecord crea una fila.

### Appointment

| Columna | Notas |
| --- | --- |
| patientId | Patient citado |
| staffId | Staff con Role `doctor` que atiende |
| startsAt | Inicio, inclusive |
| endsAt | Fin, exclusive |
| status | `pendiente`, `confirmada` o `cancelada` |

DateRange son `startsAt` y `endsAt`. `endsAt` es posterior a `startsAt`. El rango es semiabierto: una cita que termina a las 10:00 y otra que empieza a las 10:00 no se solapan.

Solo ocupan agenda las citas `pendiente` y `confirmada` del mismo Staff. Una `cancelada` no participa. No se crea una cita para un Patient con `deletedAt`.

## Relaciones

```
User 1 —— 1 Staff
Staff 1 —— N Assignment N —— 1 Patient
Patient 1 —— N MedicalRecord 1 —— N Attachment
MedicalRecord 1 —— N AuditLog N —— 1 Staff
Patient 1 —— N Appointment N —— 1 Staff
```

Patient no contiene las citas. Appointment guarda `patientId`. MedicalRecord no contiene las citas ni el User.

## Fuera de este modelo

- Billing, portal del paciente y catálogo de diagnósticos.
- Entidad de disponibilidad o de huecos de agenda. La agenda es la consulta de Appointment de un doctor; el solapamiento se protege en el agregado.
- Bytes de Attachment y URL firmada guardada.
- Role repetido en el token y en Staff. El rol se lee de Staff.
