import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import type { AuthService } from '../application/auth';
import type { CatalogService } from '../application/catalog';
import type { OrderService } from '../application/orders';
import type { TokenService, UserRepository } from '../domain/ports';
import type { CatalogQuery, OrderInput, ProductInput } from '../domain/entities';
import { AppError } from '../domain/errors';
import { authenticate, onlyAdmin, validate, errorHandler } from './middleware';
import { registerSchema, loginSchema, catalogQuerySchema, paginationSchema, idSchema, productSchema, orderSchema } from './validation';

export interface Dependencies { auth: AuthService; catalog: CatalogService; orders: OrderService; tokens: TokenService; users: UserRepository; origins: string[]; rateLimits?: boolean }
export function createApp(deps: Dependencies) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin(origin, callback) { if (!origin || deps.origins.includes(origin)) callback(null, true); else callback(new AppError(403, 'Origen no permitido.')); }, allowedHeaders: ['Content-Type', 'Authorization'], methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
  app.use(express.json({ limit: '100kb' }));
  const auth = authenticate(deps.tokens, deps.users);
  const authRouter = Router();
  if (deps.rateLimits !== false) authRouter.use(['/login', '/register'], rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Demasiados intentos. Inténtalo más tarde.', fields: {} } }));
  authRouter.post('/register', validate({ body: registerSchema }), async (_req, res) => { const input = res.locals.body as { name: string; email: string; password: string }; res.status(201).json(await deps.auth.register(input)); });
  authRouter.post('/login', validate({ body: loginSchema }), async (_req, res) => { const input = res.locals.body as { email: string; password: string }; res.json(await deps.auth.login(input)); });
  authRouter.get('/me', auth, (req, res) => res.json({ user: req.user }));
  app.use('/api/auth', authRouter);

  const catalog = Router();
  catalog.get('/', validate({ query: catalogQuerySchema }), async (_req, res) => res.json(await deps.catalog.list(res.locals.query as CatalogQuery)));
  catalog.get('/:id', validate({ params: idSchema }), async (_req, res) => res.json(await deps.catalog.detail((res.locals.params as { id: string }).id)));
  catalog.post('/', auth, onlyAdmin, validate({ body: productSchema }), async (_req, res) => res.status(201).json(await deps.catalog.create(res.locals.body as ProductInput)));
  catalog.put('/:id', auth, onlyAdmin, validate({ params: idSchema, body: productSchema }), async (_req, res) => res.json(await deps.catalog.update((res.locals.params as { id: string }).id, res.locals.body as ProductInput)));
  catalog.delete('/:id', auth, onlyAdmin, validate({ params: idSchema }), async (_req, res) => { await deps.catalog.delete((res.locals.params as { id: string }).id); res.status(204).end(); });
  app.use('/api/products', catalog);
  app.get('/api/catalog-options', async (_req, res) => res.json(await deps.catalog.options()));

  const orders = Router();
  orders.use(auth);
  orders.post('/', validate({ body: orderSchema }), async (req, res) => { if (!req.user) throw new AppError(401, 'Inicia sesión.'); res.status(201).json(await deps.orders.create(req.user.id, res.locals.body as OrderInput)); });
  orders.get('/mias', validate({ query: paginationSchema }), async (req, res) => { if (!req.user) throw new AppError(401, 'Inicia sesión.'); const query = res.locals.query as { page: number; limit: number }; res.json(await deps.orders.mine(req.user.id, query.page, query.limit)); });
  orders.get('/', onlyAdmin, validate({ query: paginationSchema }), async (_req, res) => { const query = res.locals.query as { page: number; limit: number }; res.json(await deps.orders.all(query.page, query.limit)); });
  app.use('/api/orders', orders);
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'aura-store-api' }));
  app.use((_req, _res, next) => next(new AppError(404, 'Ruta no encontrada.')));
  app.use(errorHandler);
  return app;
}
