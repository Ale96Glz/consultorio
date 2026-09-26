---
name: angular-conventions
description: Convenciones de estructura, componentes standalone, signals y servicios para el frontend Angular de este proyecto.
---

- Standalone components, sin NgModules nuevos
- Signals para estado local, servicios inyectables para estado compartido
- Un servicio por agregado (PatientService, AppointmentService) que llama a la API Nest. Patient pertenece a clinical y Appointment a scheduling
- Formularios reactivos (ReactiveFormsModule), nunca template-driven
- Interceptor HTTP centralizado que envía la cookie de sesión (`withCredentials`) y maneja el 401. La cookie es httpOnly; el cliente no adjunta un token