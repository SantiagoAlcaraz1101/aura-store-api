import { AppError } from '../domain/errors';
import type { PasswordHasher, TokenService, UserRepository } from '../domain/ports';
import type { PublicUser } from '../domain/entities';
export class AuthService {
  constructor(private users: UserRepository, private passwords: PasswordHasher, private tokens: TokenService, private dummyHash: string) {}
  async register(input: { name: string; email: string; password: string }) {
    const email = input.email.toLowerCase().trim();
    if (await this.users.byEmail(email)) throw new AppError(409, 'Este correo ya está registrado.', { email: 'Este correo ya está registrado.' });
    const user = await this.users.create({ name: input.name.trim(), email, passwordHash: await this.passwords.hash(input.password) });
    return { user, token: this.tokens.sign(user) };
  }
  async login(input: { email: string; password: string }) {
    const user = await this.users.byEmail(input.email.toLowerCase().trim());
    // Comparar también cuando el correo no existe reduce diferencias de tiempo evidentes.
    const matches = await this.passwords.compare(input.password, user?.passwordHash ?? this.dummyHash);
    if (!user || !matches) throw new AppError(401, 'Correo o contraseña incorrectos.', { password: 'Correo o contraseña incorrectos.' });
    const safe: PublicUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return { user: safe, token: this.tokens.sign(safe) };
  }
}
