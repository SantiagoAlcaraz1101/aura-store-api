import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from './client';
import { brands, categories, products } from './seed-data';

async function seed() {
  for (const brand of brands) await prisma.brand.upsert({ where: { id: brand.id }, create: brand, update: {} });
  for (const category of categories) await prisma.category.upsert({ where: { id: category.id }, create: category, update: {} });
  for (const item of products) {
    const { sizes, ...product } = item;
    // Un seed repetido no destruye ediciones del administrador ni solicitudes existentes.
    await prisma.product.upsert({ where: { id: product.id }, create: { ...product, sizes: { create: sizes } }, update: {} });
  }
  if (process.env.SEED_DEMO_USERS === 'true') {
    const accounts = [
      { name: 'Administrador Demo', email: 'admin@aura.demo', password: 'AuraAdmin!2026', role: 'admin' as const },
      { name: 'Cliente Demo', email: 'user@aura.demo', password: 'AuraUser!2026', role: 'user' as const },
    ];
    for (const { password, ...user } of accounts) {
      await prisma.user.upsert({ where: { email: user.email }, create: { ...user, passwordHash: await bcrypt.hash(password, 12) }, update: {} });
    }
  }
  console.log('Seed terminado: catálogo de Entrega 1 y cuentas demo si se habilitaron.');
}
seed().catch(() => { console.error('No se pudo ejecutar el seed. Revisa conexión, migraciones y variables.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
