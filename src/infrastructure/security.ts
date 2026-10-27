import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { PasswordHasher, TokenService } from '../domain/ports';
import type { Principal } from '../domain/entities';
import { AppError } from '../domain/errors';
export class BcryptPasswords implements PasswordHasher {
  hash(value: string) { return bcrypt.hash(value, 12); }
  compare(value: string, hash: string) { return bcrypt.compare(value, hash); }
}
export class JwtTokens implements TokenService {
  constructor(private secret: string, private expiration: string) {}
  sign(user: Principal) { return jwt.sign({ id: user.id, role: user.role }, this.secret, { algorithm: 'HS256', expiresIn: this.expiration as SignOptions['expiresIn'] }); }
  verify(token: string): Principal {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || typeof payload.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(payload.id) || !['admin', 'user'].includes(payload.role) || typeof payload.exp !== 'number') throw new Error('Invalid claims');
      return { id: payload.id, role: payload.role as Principal['role'] };
    } catch { throw new AppError(401, 'Sesión inválida o expirada. Inicia sesión de nuevo.'); }
  }
}
