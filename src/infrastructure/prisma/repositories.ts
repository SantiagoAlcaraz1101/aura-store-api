import { Prisma } from '@prisma/client';
import { prisma } from './client';
import { AppError } from '../../domain/errors';
import type { CatalogRepository, OrderRepository, UserRepository } from '../../domain/ports';
import type { CatalogQuery, OrderInput, ProductInput } from '../../domain/entities';

const publicUser = { id: true, name: true, email: true, role: true } as const;
const productInclude = { brand: true, category: true, sizes: { select: { size: true, stock: true }, orderBy: { size: 'asc' as const } } };
const orderInclude = { product: { select: { id: true, name: true, image: true, color: true } }, user: { select: { id: true, name: true, email: true } } };

// La traducción de errores ORM queda en infraestructura, sin filtrar Prisma a otras capas.
export function databaseError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = String(error.meta?.target ?? '');
      const field = target.includes('email') ? 'email' : 'sku';
      throw new AppError(409, 'Ya existe un registro con ese valor.', { [field]: field === 'email' ? 'Este correo ya está registrado.' : 'Esta referencia ya existe.' });
    }
    if (error.code === 'P2025') throw new AppError(404, 'El registro no existe.');
    if (error.code === 'P2003') throw new AppError(409, 'No se puede completar la operación por sus relaciones con otros registros.');
  }
  if (error instanceof AppError) throw error;
  throw new AppError(503, 'La base de datos no está disponible. Inténtalo de nuevo más tarde.');
}

export class PrismaUsers implements UserRepository {
  async byEmail(email: string) { try { return await prisma.user.findUnique({ where: { email } }); } catch (error) { return databaseError(error); } }
  async byId(id: string) { try { return await prisma.user.findUnique({ where: { id }, select: publicUser }); } catch (error) { return databaseError(error); } }
  async create(data: { name: string; email: string; passwordHash: string }) { try { return await prisma.user.create({ data: { ...data, role: 'user' }, select: publicUser }); } catch (error) { return databaseError(error); } }
}
export class PrismaCatalog implements CatalogRepository {
  async list(query: CatalogQuery) {
    const where: Prisma.ProductWhereInput = {
      brandId: query.brandId, categoryId: query.categoryId,
      price: { gte: query.minPrice, lte: query.maxPrice },
      ...(query.search ? { OR: [ { name: { contains: query.search, mode: 'insensitive' } }, { color: { contains: query.search, mode: 'insensitive' } }, { brand: { name: { contains: query.search, mode: 'insensitive' } } } ] } : {}),
    };
    const orderBy: Prisma.ProductOrderByWithRelationInput[] = query.sort === 'price-asc' ? [{ price: 'asc' }, { id: 'asc' }] : query.sort === 'price-desc' ? [{ price: 'desc' }, { id: 'asc' }] : query.sort === 'name' ? [{ name: 'asc' }, { id: 'asc' }] : [{ createdAt: 'asc' }, { id: 'asc' }];
    try {
      const [total, data] = await prisma.$transaction([prisma.product.count({ where }), prisma.product.findMany({ where, include: productInclude, skip: (query.page - 1) * query.limit, take: query.limit, orderBy })]);
      return { pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) }, data };
    } catch (error) { return databaseError(error); }
  }
  async byId(id: string) { try { return await prisma.product.findUnique({ where: { id }, include: productInclude }); } catch (error) { return databaseError(error); } }
  async options() { try { const [brands, categories] = await prisma.$transaction([prisma.brand.findMany({ orderBy: { name: 'asc' } }), prisma.category.findMany({ orderBy: { name: 'asc' } })]); return { brands, categories }; } catch (error) { return databaseError(error); } }
  async create(input: ProductInput) { const { sizes, ...data } = input; try { return await prisma.product.create({ data: { ...data, sizes: { create: sizes } }, include: productInclude }); } catch (error) { return databaseError(error); } }
  async update(id: string, input: ProductInput) { const { sizes, ...data } = input; try { return await prisma.product.update({ where: { id }, data: { ...data, sizes: { deleteMany: {}, create: sizes } }, include: productInclude }); } catch (error) { return databaseError(error); } }
  async delete(id: string) { try { await prisma.product.delete({ where: { id } }); } catch (error) { databaseError(error); } }
}
export class PrismaOrders implements OrderRepository {
  async create(userId: string, input: OrderInput, unitPrice: number) {
    const { consent: _consent, ...data } = input;
    try { return await prisma.order.create({ data: { ...data, userId, unitPrice }, include: orderInclude }); } catch (error) { return databaseError(error); }
  }
  async list(userId: string | undefined, page: number, limit: number) {
    try {
      const where = userId ? { userId } : {};
      const [total, data] = await prisma.$transaction([prisma.order.count({ where }), prisma.order.findMany({ where, include: orderInclude, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit })]);
      return { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, data };
    } catch (error) { return databaseError(error); }
  }
}
