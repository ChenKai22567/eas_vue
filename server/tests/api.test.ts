import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'easvue-api-test-'))
process.env.NODE_ENV = 'test'
process.env.DB_FILENAME = path.join(testRoot, 'test.sqlite3')
process.env.UPLOAD_DIR = path.join(testRoot, 'uploads')
process.env.JWT_SECRET = 'easvue-test-secret-with-at-least-32-characters'

const { getDb, closeDb } = await import('../src/db.js')
const { migrate } = await import('../src/migrate.js')
const { seed } = await import('../src/seed.js')
const { createApp } = await import('../src/app.js')

const db = getDb()
const app = createApp()
let token = ''

before(async () => {
  await migrate(db)
  await migrate(db)
  await seed(db)
  await seed(db)
})

after(async () => {
  await closeDb()
  fs.rmSync(testRoot, { recursive: true, force: true })
})

test('health, login, JWT and legacy raw token authentication', async () => {
  const health = await request(app).get('/api/health').expect(200)
  assert.equal(health.body.data.database, 'connected')
  await request(app).post('/api/private/v1/login').send({ username: 'admin', password: 'wrong-password' }).expect(400)
  const login = await request(app).post('/api/private/v1/login').send({ username: 'admin', password: '123456' }).expect(200)
  token = login.body.data.token
  assert.ok(token)
  await request(app).get('/api/private/v1/menus').set('Authorization', token).expect(200)
  await request(app).get('/api/private/v1/menus').expect(401)
})

test('users, roles, RBAC and uniqueness constraints', async () => {
  const auth = { Authorization: `Bearer ${token}` }
  const role = await request(app).post('/api/private/v1/roles').set(auth).send({ roleName: '测试角色', roleDesc: '集成测试' }).expect(201)
  const roleId = role.body.data.id
  await request(app).post(`/api/private/v1/roles/${roleId}/rights`).set(auth).send({ rids: '101,115' }).expect(200)
  const created = await request(app).post('/api/private/v1/users').set(auth).send({ username: 'apitester', password: 'pass1234', email: 'api@test.local', mobile: '13800009999' }).expect(201)
  const userId = created.body.data.id
  await request(app).post('/api/private/v1/users').set(auth).send({ username: 'apitester', password: 'pass1234', email: 'api@test.local', mobile: '13800009999' }).expect(409)
  await request(app).put(`/api/private/v1/users/${userId}/role`).set(auth).send({ rid: roleId }).expect(200)
  const list = await request(app).get('/api/private/v1/users?query=apitester&pagenum=1&pagesize=10').set(auth).expect(200)
  assert.equal(list.body.data.total, 1)
  await request(app).put(`/api/private/v1/users/${userId}`).set(auth).send({ email: 'changed@test.local', mobile: '13800008888' }).expect(200)
  await request(app).delete(`/api/private/v1/users/${userId}`).set(auth).expect(200)
  await request(app).delete(`/api/private/v1/roles/${roleId}`).set(auth).expect(200)
})

test('categories and category attributes CRUD', async () => {
  const auth = { Authorization: `Bearer ${token}` }
  const root = await request(app).post('/api/private/v1/categories').set(auth).send({ cat_name: '测试根分类', cat_pid: 0, cat_level: 0 }).expect(201)
  const child = await request(app).post('/api/private/v1/categories').set(auth).send({ cat_name: '测试二级', cat_pid: root.body.data.cat_id, cat_level: 1 }).expect(201)
  const leaf = await request(app).post('/api/private/v1/categories').set(auth).send({ cat_name: '测试三级', cat_pid: child.body.data.cat_id, cat_level: 2 }).expect(201)
  const attribute = await request(app).post(`/api/private/v1/categories/${leaf.body.data.cat_id}/attributes`).set(auth).send({ attr_name: '测试参数', attr_sel: 'many', attr_vals: 'A B' }).expect(201)
  const attrId = attribute.body.data.attr_id
  await request(app).put(`/api/private/v1/categories/${leaf.body.data.cat_id}/attributes/${attrId}`).set(auth).send({ attr_name: '更新参数', attr_sel: 'many', attr_vals: 'A B C' }).expect(200)
  const attrs = await request(app).get(`/api/private/v1/categories/${leaf.body.data.cat_id}/attributes?sel=many`).set(auth).expect(200)
  assert.equal(attrs.body.data[0].attr_vals, 'A B C')
  await request(app).delete(`/api/private/v1/categories/${leaf.body.data.cat_id}/attributes/${attrId}`).set(auth).expect(200)
  await request(app).delete(`/api/private/v1/categories/${root.body.data.cat_id}`).set(auth).expect(200)
})

test('goods, upload validation and picture response', async () => {
  const auth = { Authorization: `Bearer ${token}` }
  await request(app).post('/api/private/v1/upload').set(auth).attach('file', Buffer.from('not-an-image'), { filename: 'bad.txt', contentType: 'text/plain' }).expect(400)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nWQAAAAASUVORK5CYII=', 'base64')
  const uploaded = await request(app).post('/api/private/v1/upload').set(auth).attach('file', png, { filename: 'pixel.png', contentType: 'image/png' }).expect(200)
  assert.match(uploaded.body.data.url, /^\/uploads\//)
  const created = await request(app).post('/api/private/v1/goods').set(auth).send({ goods_name: '集成测试救助信息', goods_price: 10, goods_number: 4, goods_state: 2, goods_cat: '1,11,111', goods_introduce: '<p>测试</p>', pics: [{ pic: uploaded.body.data.tmp_path, url: uploaded.body.data.url }], attrs: [{ attr_id: 1, attr_value: '轻度' }] }).expect(201)
  const goodsId = created.body.data.goods_id
  await request(app).post('/api/private/v1/goods').set(auth).send({ goods_name: '集成测试救助信息' }).expect(409)
  await request(app).put(`/api/private/v1/goods/${goodsId}`).set(auth).send({ goods_name: '集成测试救助信息-已更新', goods_state: 1 }).expect(200)
  const detail = await request(app).get(`/api/private/v1/goods/${goodsId}`).set(auth).expect(200)
  assert.equal(detail.body.data.pics.length, 1)
  await request(app).delete(`/api/private/v1/goods/${goodsId}`).set(auth).expect(200)
})

test('orders search, update, real timeline and delete', async () => {
  const auth = { Authorization: `Bearer ${token}` }
  const created = await request(app).post('/api/private/v1/orders').set(auth).send({ order_number: 'EV-API-TEST', order_fapiao_title: '测试执行组', consignee_addr: '测试地址', order_status: '待执行', goods_id: 1 }).expect(201)
  const orderId = created.body.data.order_id
  await request(app).put(`/api/private/v1/orders/${orderId}`).set(auth).send({ consignee_addr: '更新后的测试地址', order_status: '执行中', is_send: '是' }).expect(200)
  const list = await request(app).get('/api/private/v1/orders?query=EV-API-TEST').set(auth).expect(200)
  assert.equal(list.body.data.total, 1)
  const timeline = await request(app).get(`/api/private/v1/kuaidi/${orderId}`).set(auth).expect(200)
  assert.ok(timeline.body.data.length >= 2)
  assert.equal(timeline.body.data[0].location, '更新后的测试地址')
  await request(app).delete(`/api/private/v1/orders/${orderId}`).set(auth).expect(200)
})

test('profile update and password rotation invalidate old token', async () => {
  const auth = { Authorization: `Bearer ${token}` }
  await request(app).put('/api/private/v1/me').set(auth).send({ email: 'admin-updated@easvue.local', mobile: '13800000009' }).expect(200)
  await request(app).put('/api/private/v1/me/password').set(auth).send({ currentPassword: 'bad', newPassword: 'NewAdmin123!' }).expect(400)
  await request(app).put('/api/private/v1/me/password').set(auth).send({ currentPassword: '123456', newPassword: 'NewAdmin123!' }).expect(200)
  await request(app).get('/api/private/v1/me').set(auth).expect(401)
  await request(app).post('/api/private/v1/login').send({ username: 'admin', password: '123456' }).expect(400)
  const login = await request(app).post('/api/private/v1/login').send({ username: 'admin', password: 'NewAdmin123!' }).expect(200)
  assert.ok(login.body.data.token)
})
