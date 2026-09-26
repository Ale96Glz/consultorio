# Lenguaje ubicuo

Fuente de los nombres del dominio. El código, Prisma, los requisitos y las historias usan estos términos. Si aparece un sinónimo, se reemplaza por el término de aquí.

El **nombre en código** va en módulos, tablas y eventos. El **nombre en el negocio** va en la interfaz y en las historias.

## Contextos

| Contexto | Qué nombra |
| --- | --- |
| Identity | User, Role, Session |
| Clinical | Patient, Assignment, MedicalRecord, AuditLog |
| Scheduling | Appointment, DateRange |
| Billing | Sin términos todavía. Se agregan cuando exista el contexto |

## Identity

### User

Persona del staff que inicia sesión. Better Auth la autentica dentro de la API y la sesión viaja en una cookie httpOnly.

### Role

Permiso de acceso de un User. Los valores son `doctor`, `receptionist` y `admin`. El rol pertenece a Identity y queda ligado al `userId`.

### Session

Sesión activa de un User. La emite Better Auth. Los guards de Nest la leen para saber quién llama.

### Staff

Miembro de la clínica ligado a un User. El rol dice qué puede hacer: doctor, receptionist o admin. Quien atiende una Appointment es un Staff con rol `doctor`.

## Clinical

### Patient

Ficha clínica de una persona atendida en la clínica. Guarda datos de identificación (nombre, DocumentId, teléfono, fecha de nacimiento) y su historial. Se identifica con un UUID. La baja es lógica (`deletedAt`): la ficha no se borra en físico.

Patient no es un Role y no inicia sesión. Un portal para el paciente queda fuera de este vocabulario hasta un ADR.

### DocumentId

Documento de identidad de un Patient, por ejemplo la CURP. No es el id de la ficha.

### Historial

Conjunto de MedicalRecord de un Patient. Es la relación de uno a muchos. No es una tabla ni un agregado propio.

### Assignment

Vínculo entre un Staff con rol `doctor` y un Patient. Un Patient puede tener varios doctores asignados. Ese doctor accede a los MedicalRecord de los Patient con los que tiene Assignment. El admin accede según la regla del caso de uso, sin necesitar Assignment. La comprobación vive en el caso de uso de Clinical.

### MedicalRecord

Expediente de un Patient: diagnóstico, notas clínicas y adjuntos. Un Patient tiene muchos. Se identifica con un UUID. La baja es lógica (`deletedAt`).

El diagnóstico y las notas son contenido del expediente, no agregados aparte. Cada lectura o escritura se registra en AuditLog. Ese contenido no se escribe en los logs de la aplicación ni se incluye en listados generales; solo aparece en el detalle, con permiso verificado.

### Attachment

Archivo asociado a un MedicalRecord. Vive en almacenamiento de objetos privado y se entrega con una URL firmada de corta duración. El proveedor de ese almacenamiento se decide en un ADR posterior.

### AuditLog

Registro de un acceso a un MedicalRecord: quién, cuándo y qué acción. No guarda el texto clínico.

## Scheduling

### Appointment

Cita de un Patient con un Staff de rol `doctor`, en un DateRange. Es un agregado: protege que dos citas del mismo profesional no se solapen.

Estados: `pendiente`, `confirmada`, `cancelada`.

### DateRange

Inicio y fin de una Appointment. No tiene identidad propia. Dos DateRange del mismo doctor se solapan cuando comparten algún instante.

## Eventos de dominio

| Evento | Cuándo se emite |
| --- | --- |
| AppointmentConfirmed | Una Appointment pasa a `confirmada` |
| MedicalRecordUpdated | Cambia el contenido de un MedicalRecord |

## Términos que no se usan

| En vez de | Se dice |
| --- | --- |
| Paciente como rol o como usuario que entra al sistema | Patient, la ficha de Clinical |
| Usuario para hablar de la ficha clínica | User solo en Identity; en Clinical, Patient |
| Expediente, nota y diagnóstico como tres registros raíz | MedicalRecord; diagnóstico y notas son su contenido |
| Historial como tabla | Historial, la relación Patient → MedicalRecord |
| Agenda como sinónimo de una cita concreta | Appointment. Agenda es la vista de las citas de un doctor |
