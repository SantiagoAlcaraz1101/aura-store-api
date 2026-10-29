import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticate, onlyAdmin, errorHandler } from '../src/interface/middleware';
import { JwtTokens } from '../src/infrastructure/security';
import type { PublicUser } from '../src/domain/entities';
import type { UserRepository } from '../src/domain/ports';

const secret = 'test-only-secret-never-used-in-a-deployment';
const tokens = new JwtTokens(secret, '1h');
const user: PublicUser = { id: '11111111-1111-4111-8111-111111111111', role: 'user', name: 'Prueba', email: 'test@example.test' };
const admin: PublicUser = { ...user, id: '22222222-2222-4222-8222-222222222222', role: 'admin' };
const users: UserRepository = {
  async byId(id) { return [user, admin].find((item) => item.id === id) ?? null; },
  async byEmail() { return null; },
  async create() { throw new Error('No se registra desde estas pruebas.'); },
};
const app = express();
app.get('/private', authenticate(tokens, users), (req, res) => res.json(req.user));
app.delete('/admin', authenticate(tokens, users), onlyAdmin, (_req, res) => res.sendStatus(204));
app.use(errorHandler);

test('sin token, formato incorrecto, firma falsa y token expirado responden 401', async () => {
  const expired = jwt.sign({ id: user.id, role: 'user' }, secret, { expiresIn: -1 });
  const wrongSecret = new JwtTokens('another-test-secret', '1h').sign(user);
  for (const header of ['', 'Basic abc', 'Bearer invalid', `Bearer ${expired}`, `Bearer ${wrongSecret}`]) {
    const response = await request(app).get('/private').set('Authorization', header);
    assert.equal(response.status, 401);
    assert.equal('stack' in response.body, false);
  }
});
test('sesión válida identifica al usuario y no expone contraseña', async () => {
  const response = await request(app).get('/private').auth(tokens.sign(user), { type: 'bearer' }).expect(200);
  assert.deepEqual(response.body, user);
  assert.equal('passwordHash' in response.body, false);
});
test('usuario sin permiso recibe 403; administrador recibe 204', async () => {
  await request(app).delete('/admin').auth(tokens.sign(user), { type: 'bearer' }).expect(403);
  await request(app).delete('/admin').auth(tokens.sign(admin), { type: 'bearer' }).expect(204);
  await request(app).delete('/admin').expect(401);
});
test('token de usuario inexistente o con rol desactualizado recibe 401', async () => {
  await request(app).get('/private').auth(tokens.sign({ ...user, role: 'admin' }), { type: 'bearer' }).expect(401);
  await request(app).get('/private').auth(tokens.sign({ ...user, id: '33333333-3333-4333-8333-333333333333' }), { type: 'bearer' }).expect(401);
});
test('JWT contiene únicamente id, role y marcas temporales; rechaza algoritmo diferente y falta de expiración', async () => {
  const payload = jwt.decode(tokens.sign(user));
  assert.ok(payload && typeof payload !== 'string');
  assert.deepEqual(Object.keys(payload).sort(), ['exp', 'iat', 'id', 'role']);
  for (const invalid of [jwt.sign({ id: user.id, role: 'user' }, secret), jwt.sign(user, secret, { algorithm: 'HS384', expiresIn: '1h' })]) {
    await request(app).get('/private').auth(invalid, { type: 'bearer' }).expect(401);
  }
});
