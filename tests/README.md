# Verificación de la API

`npm test` ejecuta cinco pruebas de middlewares y una suite de integración con cinco subpruebas (11 resultados en Node). La integración usa PostgreSQL real, las migraciones del proyecto y las cuentas demo del seed. Se rechaza una DATABASE_URL que no apunte a localhost/127.0.0.1 y NODE_ENV=production.

Preparación: configurar `.env`, ejecutar `npm run db:migrate` y `npm run db:seed` con `SEED_DEMO_USERS=true`. Después ejecutar `npm run typecheck:tests` y `npm test`.

Las pruebas crean un usuario `integration-<UUID>@example.test` y una solicitud de prueba por ejecución. Permanecen en la base local para comprobar la persistencia; no deben ejecutarse contra una base de producción. El producto temporal de CRUD se elimina al terminar su subprueba. El workflow de GitHub usa una base PostgreSQL efímera.

Casos cubiertos: firma y expiración JWT, claims mínimos, usuario inexistente o con rol cambiado, 401/403, bcrypt, registro duplicado 409, login genérico, validaciones 400, 404, SKU duplicado, CRUD admin, paginación y filtros combinados, propietario de solicitud desde token, aislamiento de solicitudes, claves foráneas, CORS y JSON inválido.

Verificación local del 28 de octubre de 2026: 11/11 resultados correctos. Esto no reemplaza las nueve pruebas de navegador en los despliegues requeridos por el docente.
