# Aura Store — API de la Entrega 3

Backend de la tienda académica de sneakers de Santiago Alcaraz, Desarrollo Web 2026-2. Conserva los seis modelos, cinco marcas y tres categorías de la primera entrega y guarda solicitudes reales vinculadas a cuentas. No procesa pagos ni reserva existencias.

## Enlaces y estado

- [Repositorio backend](https://github.com/SantiagoAlcaraz1101/aura-store-api).
- [Repositorio frontend](https://github.com/SantiagoAlcaraz1101/aura-store).
- [Vercel](https://aura-store-azure.vercel.app/): frontend Next actualizado; catálogo conectado a esta API. Comprobación completa de flujos pendiente.
- [API pública](https://aura-store-api.onrender.com/health): salud y catálogo verificados, con seis productos y CORS para Vercel.
- Local: API en `http://localhost:4000`; frontend en `http://127.0.0.1:3000`.

## Ejecución local

Requisitos: Node 24 y PostgreSQL 17 (también deben instalarse las dependencias).

```bash
npm ci
cp .env.example .env
# Editar .env con la conexión real y un JWT_SECRET aleatorio.
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

En PowerShell, usar `Copy-Item .env.example .env`. La base debe existir antes de migrar. `npm run build` genera el cliente Prisma y compila; `npm start` ejecuta la compilación. En Windows detener la API antes de regenerar Prisma para evitar el bloqueo de su DLL.

| Variable | Uso |
|---|---|
| DATABASE_URL | Conexión PostgreSQL, privada |
| JWT_SECRET | Clave aleatoria de al menos 32 caracteres; nunca en Git |
| JWT_EXPIRES_IN | Vigencia, por ejemplo `1h` |
| PORT | Puerto HTTP, local `4000`; Render lo proporciona |
| FRONTEND_URL | Orígenes permitidos separados por coma; incluir Vercel sin `*` |
| NODE_ENV | `development`, `test` o `production` |
| SEED_DEMO_USERS | `true` solo para crear cuentas de la entrega |

El mismo JWT_SECRET privado se configura en el servidor Next para comprobar la cookie. Nunca usar el prefijo NEXT_PUBLIC para esa clave.

## Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| admin | admin@aura.demo | AuraAdmin!2026 |
| user | user@aura.demo | AuraUser!2026 |

Son cuentas académicas públicas, creadas por el seed cuando SEED_DEMO_USERS=true. Sus contraseñas se guardan como hash bcrypt, no como texto. Usar únicamente datos de prueba. El seed repetido conserva ediciones y solicitudes existentes.

## Organización y decisiones

`domain` define entidades y contratos; `application` resuelve los casos de uso; `infrastructure` contiene PostgreSQL/Prisma y seguridad; `interface` expone Express, validaciones y middlewares. Prisma solo se importa en infraestructura.

El navegador envía correo y contraseña al iniciar sesión. La API compara la contraseña con bcrypt y responde con el usuario público y un JWT firmado que contiene id, rol y vencimiento. El frontend conserva ese token en una cookie, y su cliente HTTP añade `Authorization: Bearer` a las peticiones. El middleware verifica firma y expiración, busca al usuario y comprueba el rol actual antes de permitir una operación. Una solicitud usa el dueño del token, nunca un userId proporcionado por el formulario.

La cookie es accesible a JavaScript para enviar ese encabezado y permite al proxy de Next proteger rutas. Tiene SameSite=Lax y Secure cuando se usa HTTPS; no es HttpOnly. Un ataque XSS podría robar el token. La validación del backend sigue siendo necesaria aunque el frontend oculte Administración.

Sin token, con token falso o vencido: **401**. Ejemplo: DELETE /api/products/nike-dunk-low sin sesión. Con token válido de user y la misma operación: **403**. Correo repetido: **409**. Datos inválidos: **400**. Recurso inexistente: **404**. Los errores públicos no incluyen stack traces ni contraseñas.

## Rutas

Auth: POST `/api/auth/register`, POST `/api/auth/login`, GET `/api/auth/me` (sesión). Productos: GET `/api/products` y `/:id` públicos; POST `/api/products`, PUT y DELETE `/api/products/:id` solo admin. Opciones: GET `/api/catalog-options`. Solicitudes: POST `/api/orders` y GET `/api/orders/mias` con sesión; GET `/api/orders` solo admin.

Los listados responden `{ pagination, data }`. Catálogo acepta page, limit, search, categoryId, brandId, minPrice, maxPrice y sort. Una solicitud relaciona usuario y producto; la base impide borrar un producto con solicitudes para conservar ese historial.

## Pruebas, IA y despliegue

`npm run typecheck:tests` y `npm test`: [detalle de los casos](tests/README.md). El [workflow de CI](.github/workflows/verify.yml) usa PostgreSQL efímero. La primera ejecución publicada pasó en [GitHub Actions](https://github.com/SantiagoAlcaraz1101/aura-store-api/actions/runs/40808114436). Estas pruebas no sustituyen las nueve comprobaciones de navegador en producción.

Codex ayudó a implementar la migración, validaciones, pruebas y documentación. Se corrigió el límite de contraseñas para contar bytes como bcrypt y se actualizó deepmerge-ts, validando generación Prisma, migraciones y seed. No se atribuyen al autor experiencias personales que no haya escrito; debe revisar y explicar estas decisiones en la sustentación.

`render.yaml` prepara API y PostgreSQL en Render. Despliegue confirmado en Render. Falta confirmar la conexión GitHub para actualizaciones automáticas. **Evidencia Network pendiente:** obtener una captura auténtica de una petición protegida en el navegador y añadirla aquí; no sustituirla por una captura de terminal ni por una imagen construida.
