import { z } from 'zod';
const requiredText = (min: number, max: number) => z.string({ error: 'Este campo es obligatorio.' }).trim().min(min, `Escribe al menos ${min} caracteres.`).max(max, `Máximo ${max} caracteres.`);
const email = z.email('Escribe un correo válido.').max(120).transform((value) => value.trim().toLowerCase());
const password = z.string().min(8, 'Usa al menos 8 caracteres.').refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'La contraseña no puede superar 72 bytes.');
export const registerSchema = z.object({ name: requiredText(3, 80), email, password }).strict();
export const loginSchema = z.object({ email, password: z.string().min(1, 'Escribe tu contraseña.').refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'La contraseña no puede superar 72 bytes.') }).strict();
export const paginationSchema = z.object({ page: z.coerce.number().int().min(1).max(100000).default(1), limit: z.coerce.number().int().min(1).max(50).default(6) }).strict();
export const catalogQuerySchema = paginationSchema.extend({ search: z.string().trim().max(80).optional(), categoryId: z.string().min(1).max(80).optional(), brandId: z.string().min(1).max(80).optional(), minPrice: z.coerce.number().int().min(0).max(100000000).optional(), maxPrice: z.coerce.number().int().min(0).max(100000000).optional(), sort: z.enum(['featured', 'price-asc', 'price-desc', 'name']).default('featured') }).refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, { path: ['maxPrice'], message: 'El precio máximo debe ser mayor o igual al mínimo.' });
export const idSchema = z.object({ id: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/, 'Identificador inválido.') }).strict();
const image = z.string().max(1000).refine((value) => /^\/assets\/images\/[a-zA-Z0-9._-]+\.(webp|png|jpe?g)$/.test(value) || (() => { try { return new URL(value).protocol === 'https:'; } catch { return false; } })(), 'Usa una URL HTTPS o una imagen local de /assets/images/.');
export const productSchema = z.object({
  name: requiredText(2, 100), brandId: requiredText(1, 80), categoryId: requiredText(1, 80), description: requiredText(20, 1200), color: requiredText(2, 100), price: z.number().int().positive().max(100000000), sku: requiredText(2, 80), image, alt: requiredText(10, 200), tag: requiredText(2, 40),
  sizes: z.array(z.object({ size: z.number().min(20).max(55).multipleOf(0.5), stock: z.number().int().min(0).max(10000) }).strict()).min(1, 'Añade al menos una talla.').max(40).refine((sizes) => new Set(sizes.map((item) => item.size)).size === sizes.length, 'Las tallas no se pueden repetir.'),
}).strict();
export const orderSchema = z.object({ productId: z.string().min(1).max(80), size: z.number().min(20).max(55), city: requiredText(3, 80), message: requiredText(20, 600), consent: z.literal(true, { error: 'Confirma que deseas guardar esta solicitud.' }) }).strict();
