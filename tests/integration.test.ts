import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { dependencies } from '../src/infrastructure/container';
import { config } from '../src/infrastructure/config';
import { createApp } from '../src/interface/app';
import { BcryptPasswords } from '../src/infrastructure/security';
import type { Product, Order, ProductInput } from '../src/domain/entities';

test('API completa contra PostgreSQL local: catálogo, usuarios, roles, CRUD y solicitudes', async (t) => {
  const database = new URL(config.DATABASE_URL);
  assert.ok(['localhost', '127.0.0.1'].includes(database.hostname), 'Estas pruebas solo pueden escribir en PostgreSQL local.');
  assert.notEqual(config.NODE_ENV, 'production');
  const deps = await dependencies();
  const app = createApp({ ...deps, rateLimits: false });
  const suffix = randomUUID();
  let product: Product;
  let userToken = ''; let userId = ''; let adminToken = ''; let orderId = '';
  const email = `integration-${suffix}@example.test`;
  const password = 'Integration!2026';
  await t.test('catálogo público paginado, filtros combinados y validaciones', async () => {
    const first = await request(app).get('/api/products?page=1&limit=3').expect(200);
    const second = await request(app).get('/api/products?page=2&limit=3').expect(200);
    assert.equal(first.body.data.length, 3);
    assert.ok(first.body.pagination.total >= 6);
    assert.notEqual(first.body.data[0].id, second.body.data[0].id);
    product = first.body.data[0] as Product;
    const filtered = await request(app).get('/api/products').query({ search: product.name, categoryId: product.categoryId, brandId: product.brandId, minPrice: product.price, maxPrice: product.price }).expect(200);
    assert.ok(filtered.body.data.some((item: Product) => item.id === product.id));
    for (const query of ['page=0', 'limit=51', 'page=abc', 'minPrice=100&maxPrice=1', 'unexpected=yes']) await request(app).get(`/api/products?${query}`).expect(400);
    await request(app).get('/api/products/does-not-exist').expect(404);
    await request(app).get('/api/products/bad%20id').expect(400);
  });
  await t.test('registro, bcrypt, duplicado 409 y login genérico', async () => {
    // 37 caracteres caben en un límite por caracteres, pero exceden los 72 bytes de bcrypt.
    const oversizedPassword = 'ñ'.repeat(37);
    for (const endpoint of ['register', 'login']) {
      const body = endpoint === 'register' ? { name: 'Prueba bytes', email, password: oversizedPassword } : { email, password: oversizedPassword };
      const invalid = await request(app).post(`/api/auth/${endpoint}`).send(body).expect(400);
      assert.ok(invalid.body.fields.password);
    }
    const registered = await request(app).post('/api/auth/register').send({ name: 'Prueba integración', email, password }).expect(201);
    userToken = registered.body.token; userId = registered.body.user.id;
    assert.equal(registered.body.user.role, 'user');
    assert.equal('passwordHash' in registered.body.user, false);
    const stored = await deps.users.byEmail(email);
    assert.ok(stored && stored.passwordHash.startsWith('$2'));
    assert.equal(await new BcryptPasswords().compare(password, stored.passwordHash), true);
    const duplicate = await request(app).post('/api/auth/register').send({ name: 'Duplicado', email: email.toUpperCase(), password }).expect(409);
    assert.ok(duplicate.body.fields.email);
    await request(app).post('/api/auth/register').send({ name: 'Elevación', email: `x-${email}`, password, role: 'admin' }).expect(400);
    const badPassword = await request(app).post('/api/auth/login').send({ email, password: 'incorrecta' }).expect(401);
    const badEmail = await request(app).post('/api/auth/login').send({ email: `missing-${email}`, password }).expect(401);
    assert.deepEqual(badPassword.body, badEmail.body);
    const logged = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    assert.equal(logged.body.user.id, userId);
    await request(app).get('/api/auth/me').auth(userToken, { type: 'bearer' }).expect(200);
    const admin = await request(app).post('/api/auth/login').send({ email: 'admin@aura.demo', password: 'AuraAdmin!2026' }).expect(200);
    adminToken = admin.body.token;
  });
  await t.test('CRUD exige rol admin y conserva los códigos 401, 403, 400, 404 y 409', async () => {
    await request(app).delete(`/api/products/${product.id}`).expect(401);
    await request(app).delete(`/api/products/${product.id}`).auth(userToken, { type: 'bearer' }).expect(403);
    const input: ProductInput = {
      name: 'Sneaker prueba integración', sku: `TEST-${suffix}`, brandId: product.brandId,
      categoryId: product.categoryId, description: product.description, color: product.color,
      price: product.price, image: product.image, alt: product.alt, tag: product.tag, sizes: product.sizes,
    };
    await request(app).post('/api/products').auth(adminToken, { type: 'bearer' }).send({ ...input, price: -1 }).expect(400);
    const created = await request(app).post('/api/products').auth(adminToken, { type: 'bearer' }).send(input).expect(201);
    const createdId = created.body.id as string;
    try {
      await request(app).post('/api/products').auth(adminToken, { type: 'bearer' }).send(input).expect(409);
      const updated = await request(app).put(`/api/products/${createdId}`).auth(adminToken, { type: 'bearer' }).send({ ...input, price: 450000 }).expect(200);
      assert.equal(updated.body.price, 450000);
    } finally {
      await request(app).delete(`/api/products/${createdId}`).auth(adminToken, { type: 'bearer' }).expect(204);
    }
    await request(app).get(`/api/products/${createdId}`).expect(404);
  });
  await t.test('solicitud persistida, dueño desde el token, aislamiento y relaciones', async () => {
    const size = product.sizes.find((item) => item.stock > 0)?.size;
    assert.ok(size);
    const input = { productId: product.id, size, city: 'Medellín', message: `Solicitud de prueba automatizada ${suffix}`, consent: true };
    await request(app).post('/api/orders').send(input).expect(401);
    await request(app).post('/api/orders').auth(userToken, { type: 'bearer' }).send({ ...input, userId: randomUUID() }).expect(400);
    await request(app).post('/api/orders').auth(userToken, { type: 'bearer' }).send({ ...input, size: 20 }).expect(400);
    const created = await request(app).post('/api/orders').auth(userToken, { type: 'bearer' }).send(input).expect(201);
    orderId = created.body.id;
    assert.equal(created.body.userId, userId);
    assert.equal(created.body.unitPrice, product.price);
    const own = await request(app).get('/api/orders/mias').auth(userToken, { type: 'bearer' }).expect(200);
    assert.ok(own.body.data.some((item: Order) => item.id === orderId));
    assert.ok(own.body.data.every((item: Order) => item.userId === userId));
    const other = await request(app).get('/api/orders/mias').auth(adminToken, { type: 'bearer' }).expect(200);
    assert.ok(other.body.data.every((item: Order) => item.userId !== userId));
    await request(app).get('/api/orders').auth(userToken, { type: 'bearer' }).expect(403);
    const all = await request(app).get('/api/orders').auth(adminToken, { type: 'bearer' }).expect(200);
    assert.ok(all.body.data.some((item: Order) => item.id === orderId));
    await request(app).delete(`/api/products/${product.id}`).auth(adminToken, { type: 'bearer' }).expect(409);
    await request(app).get(`/api/products/${product.id}`).expect(200);
  });
  await t.test('CORS restringido, JSON inválido y errores sin detalles internos', async () => {
    const allowed = await request(app).get('/api/products').set('Origin', deps.origins[0]!).expect(200);
    assert.equal(allowed.headers['access-control-allow-origin'], deps.origins[0]);
    const denied = await request(app).get('/api/products').set('Origin', 'https://untrusted.example').expect(403);
    assert.equal(denied.headers['access-control-allow-origin'], undefined);
    await request(app).post('/api/auth/register').set('Content-Type', 'application/json').send('{bad').expect(400);
    const missing = await request(app).get('/api/does-not-exist').expect(404);
    assert.equal('stack' in missing.body, false);
  });
});
