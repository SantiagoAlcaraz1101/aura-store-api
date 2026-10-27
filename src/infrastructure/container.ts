import { config, allowedOrigins } from './config';
import { PrismaUsers, PrismaCatalog, PrismaOrders } from './prisma/repositories';
import { BcryptPasswords, JwtTokens } from './security';
import { AuthService } from '../application/auth';
import { CatalogService } from '../application/catalog';
import { OrderService } from '../application/orders';
import { randomBytes } from 'node:crypto';
export async function dependencies() {
  const users = new PrismaUsers(); const catalog = new PrismaCatalog(); const orders = new PrismaOrders();
  const passwords = new BcryptPasswords(); const tokens = new JwtTokens(config.JWT_SECRET, config.JWT_EXPIRES_IN);
  return { users, tokens, auth: new AuthService(users, passwords, tokens, await passwords.hash(randomBytes(24).toString('hex'))), catalog: new CatalogService(catalog), orders: new OrderService(orders, catalog), origins: allowedOrigins };
}
