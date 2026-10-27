# Aura Store API — Entrega 3

Backend independiente del frontend existente. Conserva los seis productos originales. Capas: domain (entidades/puertos), application (casos de uso), infrastructure (Prisma, bcrypt, JWT, configuración), interface (HTTP, middlewares, routers, controladores).

Etapas reales: configuración; modelo y seed; casos de uso y HTTP; pruebas; despliegue/documentación. Commits y pushes con fechas reales, sin reescritura. No se declara funcionando ninguna base de datos ni despliegue sin probarlo.

Solicitudes en `orders`: llaves foráneas hacia `users` y `products`; una talla/modelo por solicitud como en Entrega 1. El autor siempre sale del JWT. Solicitar no cobra dinero ni descuenta stock. Borrado de un producto solicitado devuelve 409 para conservar historial.
