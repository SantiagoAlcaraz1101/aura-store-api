import type { PublicUser } from '../domain/entities';
declare global { namespace Express { interface Request { user?: PublicUser } } }
export {};
