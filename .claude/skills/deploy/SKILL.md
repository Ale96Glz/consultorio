---
name: deploy
description: Pasos para desplegar backend y frontend.
disable-model-invocation: true
---

1. Backend: build Nest, migrar con `npx prisma migrate deploy`, desplegar a [tu proveedor]
2. Frontend: `ng build --configuration production`, desplegar a [tu hosting]
3. Verificar variables de entorno (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL)