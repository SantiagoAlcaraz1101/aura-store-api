import type { RequestHandler, ErrorRequestHandler } from 'express';
import type { TokenService, UserRepository } from '../domain/ports';
import { AppError } from '../domain/errors';
import { ZodError, type ZodType } from 'zod';

export const authenticate = (tokens: TokenService, users: UserRepository): RequestHandler => async (req, _res, next) => {
  try {
    const match = /^Bearer ([^\s]+)$/.exec(req.headers.authorization ?? '');
    if (!match?.[1]) throw new AppError(401, 'Inicia sesión para continuar.');
    const principal = tokens.verify(match[1]);
    const user = await users.byId(principal.id);
    if (!user || user.role !== principal.role) throw new AppError(401, 'Sesión inválida. Inicia sesión de nuevo.');
    req.user = user;
    next();
  } catch (error) { next(error); }
};
export const onlyAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(new AppError(401, 'Inicia sesión para continuar.'));
  if (req.user.role !== 'admin') return next(new AppError(403, 'Esta acción requiere rol administrador.'));
  next();
};
export const validate = (schemas: { body?: ZodType; query?: ZodType; params?: ZodType }): RequestHandler => (req, res, next) => {
  try {
    if (schemas.body) res.locals.body = schemas.body.parse(req.body);
    if (schemas.query) res.locals.query = schemas.query.parse(req.query);
    if (schemas.params) res.locals.params = schemas.params.parse(req.params);
    next();
  } catch (error) { next(error); }
};
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) { const name = String(issue.path[0] ?? 'form'); fields[name] ??= issue.message; }
    res.status(400).json({ message: 'Revisa los campos indicados.', fields }); return;
  }
  if (error instanceof AppError) { res.status(error.status).json({ message: error.message, fields: error.fields }); return; }
  if (error instanceof SyntaxError && 'body' in error) { res.status(400).json({ message: 'El cuerpo debe ser JSON válido.', fields: {} }); return; }
  if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large') { res.status(400).json({ message: 'La solicitud supera el tamaño permitido.', fields: {} }); return; }
  console.error('Error HTTP no controlado; no se exponen detalles al cliente.');
  res.status(500).json({ message: 'No se pudo completar la solicitud.', fields: {} });
};
