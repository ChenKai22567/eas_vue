import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import express, { type NextFunction, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { z } from 'zod'
import { config } from './config.js'
import { getDb } from './db.js'
import type { AuthRequest } from './types.js'

const db = getDb()

function envelope(data: unknown, status = 200, msg = '操作成功') {
  return { data, meta: { status, msg } }
}

function send(res: Response, data: unknown, status = 200, msg = '操作成功') {
  return res.status(status).json(envelope(data, status, msg))
}

function fail(res: Response, status: number, msg: string, data: unknown = null) {
  return res.status(status).json(envelope(data, status, msg))
}

function asId(value: unknown) {
  const id = Number(Array.isArray(value) ? value[0] : value)
  return Number.isInteger(id) && id > 0 ? id : 0
}

function pageValues(query: Record<string, unknown>) {
  const pagenum = Math.max(1, Number(query.pagenum) || 1)
  const pagesize = Math.min(100, Math.max(1, Number(query.pagesize) || 10))
  return { pagenum, pagesize, offset: (pagenum - 1) * pagesize }
}

function isoTime(value: unknown) {
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value ?? '') : date.toISOString()
}

function buildTree<T extends { id: number; pid: number }>(rows: T[], map: (row: T) => Record<string, unknown>) {
  const nodes = new Map<number, Record<string, unknown> & { children: Record<string, unknown>[] }>()
  for (const row of rows) nodes.set(row.id, { ...map(row), children: [] })
  const roots: Array<Record<string, unknown> & { children: Record<string, unknown>[] }> = []
  for (const row of rows) {
    const node = nodes.get(row.id)!
    const parent = nodes.get(row.pid)
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  const prune = (node: Record<string, unknown> & { children: Record<string, unknown>[] }) => {
    node.children.forEach(child => prune(child as typeof node))
    if (node.children.length === 0) delete (node as { children?: unknown }).children
    return node
  }
  return roots.map(prune)
}

function rightDto(row: any) {
  return { id: row.id, authName: row.auth_name, path: row.path, level: String(row.level), pid: row.pid }
}

function categoryDto(row: any) {
  return { cat_id: row.id, cat_name: row.name, cat_pid: row.pid, cat_level: row.level, cat_deleted: Boolean(row.deleted) }
}

function attributeDto(row: any) {
  return { attr_id: row.id, attr_name: row.name, cat_id: row.category_id, attr_sel: row.attr_sel, attr_write: 'list', attr_vals: row.attr_vals ?? '' }
}

function userDto(row: any) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    mobile: row.mobile,
    type: row.role_id,
    role_name: row.role_name,
    mg_state: Boolean(row.state),
    create_time: isoTime(row.created_at),
    force_password_change: Boolean(row.force_password_change)
  }
}

function goodsDto(row: any) {
  return {
    goods_id: row.id,
    goods_name: row.name,
    goods_price: Number(row.price),
    goods_number: Number(row.number),
    goods_weight: Number(row.weight),
    goods_state: Number(row.state),
    goods_cat: row.goods_cat,
    goods_introduce: row.introduce,
    add_time: isoTime(row.created_at),
    upd_time: isoTime(row.updated_at),
    cat_name: row.cat_name ?? ''
  }
}

function orderDto(row: any) {
  return {
    order_id: row.id,
    order_number: row.order_number,
    order_fapiao_title: row.invoice_title,
    pay_status: Number(row.pay_status),
    is_send: row.is_send,
    create_time: isoTime(row.created_at),
    consignee_addr: row.consignee_addr,
    order_status: row.status,
    goods_id: row.goods_id,
    goods_name: row.goods_name ?? ''
  }
}

async function permissionsFor(roleId: number) {
  const rows = await db('role_rights as rr').join('rights as r', 'r.id', 'rr.right_id').where('rr.role_id', roleId).select('r.permission_code')
  return rows.map(row => row.permission_code as string)
}

async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.get('authorization')?.trim() ?? ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : header
  if (!token) return fail(res, 401, '请先登录')
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload
    const user = await db('users').where({ id: Number(payload.sub) }).first()
    if (!user || !user.state || Number(payload.tv) !== Number(user.token_version)) return fail(res, 401, '登录状态已失效')
    req.auth = {
      id: user.id,
      username: user.username,
      roleId: user.role_id,
      tokenVersion: user.token_version,
      permissions: await permissionsFor(user.role_id)
    }
    next()
  } catch {
    return fail(res, 401, '无效或过期的登录令牌')
  }
}

function permit(...codes: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (codes.some(code => req.auth?.permissions.includes(code))) return next()
    return fail(res, 403, '当前角色无权执行此操作')
  }
}

const userCreateSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(6).max(128),
  email: z.email(),
  mobile: z.string().trim().min(6).max(32)
})

fs.mkdirSync(config.uploadDir, { recursive: true })
const allowedUploadTypes: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp'
}
const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename(_req, file, callback) {
      callback(null, `${randomUUID()}${allowedUploadTypes[file.mimetype] ?? ''}`)
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    callback(null, Boolean(allowedUploadTypes[file.mimetype]))
  }
})

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 'loopback')
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }))
  app.use(express.json({ limit: '1mb' }))
  app.use('/uploads', express.static(config.uploadDir, { fallthrough: false, immutable: true, maxAge: '30d' }))

  app.get('/api/health', async (_req, res) => {
    await db.raw('select 1 as ok')
    send(res, { status: 'ok', database: 'connected', time: new Date().toISOString() }, 200, '服务正常')
  })

  const api = express.Router()
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(_req, res) { fail(res, 429, '登录尝试次数过多，请稍后再试') }
  })

  api.post('/login', loginLimiter, async (req, res) => {
    const username = String(req.body?.username ?? '').trim()
    const password = String(req.body?.password ?? '')
    const user = await db('users as u').join('roles as r', 'r.id', 'u.role_id').where('u.username', username).select('u.*', 'r.role_name').first()
    if (!user || !user.state || !(await bcrypt.compare(password, user.password_hash))) return fail(res, 400, '用户名或密码错误')
    const token = jwt.sign({ tv: user.token_version }, config.jwtSecret, { subject: String(user.id), expiresIn: '8h', issuer: 'easvue-api' })
    return send(res, { ...userDto(user), token }, 200, '登录成功')
  })

  api.use(authenticate)

  api.get('/menus', async (req: AuthRequest, res) => {
    const rows = await db('role_rights as rr').join('rights as r', 'r.id', 'rr.right_id').where('rr.role_id', req.auth!.roleId).whereIn('r.level', [0, 1]).select('r.*').orderBy(['r.level', 'r.id'])
    const menus = buildTree(rows, rightDto)
    return send(res, menus)
  })

  api.get('/rights/:type', permit('rights.read', 'roles.read'), async (req, res) => {
    const rows = await db('rights').select('*').orderBy(['level', 'id'])
    if (req.params.type === 'tree') return send(res, buildTree(rows, rightDto))
    return send(res, rows.map(rightDto))
  })

  api.get('/roles', permit('roles.read', 'users.write'), async (_req, res) => {
    const roles = await db('roles').orderBy('id')
    const allRights = await db('rights').orderBy(['level', 'id'])
    const assigned = await db('role_rights')
    const data = roles.map(role => {
      const ids = new Set(assigned.filter(item => item.role_id === role.id).map(item => item.right_id))
      const rows = allRights.filter(right => ids.has(right.id))
      return { id: role.id, roleName: role.role_name, roleDesc: role.role_desc, children: buildTree(rows, rightDto) }
    })
    return send(res, data)
  })

  api.post('/roles', permit('roles.write'), async (req, res) => {
    const roleName = String(req.body?.roleName ?? '').trim()
    const roleDesc = String(req.body?.roleDesc ?? '').trim()
    if (!roleName) return fail(res, 400, '角色名称不能为空')
    if (await db('roles').where({ role_name: roleName }).first()) return fail(res, 409, '角色名称已存在')
    const [id] = await db('roles').insert({ role_name: roleName, role_desc: roleDesc })
    return send(res, { id, roleName, roleDesc }, 201, '创建角色成功')
  })

  api.get('/roles/:id', permit('roles.read'), async (req, res) => {
    const row = await db('roles').where({ id: asId(req.params.id) }).first()
    if (!row) return fail(res, 404, '角色不存在')
    return send(res, { roleId: row.id, roleName: row.role_name, roleDesc: row.role_desc })
  })

  api.put('/roles/:id', permit('roles.write'), async (req, res) => {
    const id = asId(req.params.id)
    const roleName = String(req.body?.roleName ?? '').trim()
    const roleDesc = String(req.body?.roleDesc ?? '').trim()
    if (!roleName) return fail(res, 400, '角色名称不能为空')
    const conflict = await db('roles').where({ role_name: roleName }).whereNot({ id }).first()
    if (conflict) return fail(res, 409, '角色名称已存在')
    const changed = await db('roles').where({ id }).update({ role_name: roleName, role_desc: roleDesc, updated_at: db.fn.now() })
    if (!changed) return fail(res, 404, '角色不存在')
    return send(res, { roleId: id, roleName, roleDesc }, 200, '修改角色成功')
  })

  api.delete('/roles/:id', permit('roles.write'), async (req, res) => {
    const id = asId(req.params.id)
    if (await db('users').where({ role_id: id }).first()) return fail(res, 409, '该角色仍有关联用户，不能删除')
    const changed = await db('roles').where({ id }).delete()
    if (!changed) return fail(res, 404, '角色不存在')
    return send(res, null, 200, '删除角色成功')
  })

  async function roleRightsTree(roleId: number) {
    const rows = await db('role_rights as rr').join('rights as r', 'r.id', 'rr.right_id').where('rr.role_id', roleId).select('r.*').orderBy(['r.level', 'r.id'])
    return buildTree(rows, rightDto)
  }

  api.post('/roles/:id/rights', permit('roles.write'), async (req, res) => {
    const roleId = asId(req.params.id)
    if (!(await db('roles').where({ id: roleId }).first())) return fail(res, 404, '角色不存在')
    const requested = String(req.body?.rids ?? '').split(',').map(Number).filter(Number.isInteger)
    const validRows = requested.length ? await db('rights').whereIn('id', requested).select('id') : []
    await db.transaction(async trx => {
      await trx('role_rights').where({ role_id: roleId }).delete()
      if (validRows.length) await trx('role_rights').insert(validRows.map(row => ({ role_id: roleId, right_id: row.id })))
      await trx('users').where({ role_id: roleId }).increment('token_version', 1)
    })
    return send(res, await roleRightsTree(roleId), 200, '分配权限成功')
  })

  api.delete('/roles/:roleId/rights/:rightId', permit('roles.write'), async (req, res) => {
    const roleId = asId(req.params.roleId)
    const rootId = asId(req.params.rightId)
    const rows = await db('rights').select('id', 'pid')
    const ids = [rootId]
    for (let index = 0; index < ids.length; index += 1) {
      ids.push(...rows.filter(row => row.pid === ids[index]).map(row => row.id))
    }
    await db.transaction(async trx => {
      await trx('role_rights').where({ role_id: roleId }).whereIn('right_id', ids).delete()
      await trx('users').where({ role_id: roleId }).increment('token_version', 1)
    })
    return send(res, await roleRightsTree(roleId), 200, '移除权限成功')
  })

  api.get('/users', permit('users.read'), async (req, res) => {
    const { pagenum, pagesize, offset } = pageValues(req.query)
    const query = String(req.query.query ?? '').trim()
    const base = db('users as u').join('roles as r', 'r.id', 'u.role_id')
    if (query) base.whereLike('u.username', `%${query}%`)
    const countRow = await base.clone().count<{ count: number | string }>({ count: '*' }).first()
    const rows = await base.clone().select('u.*', 'r.role_name').orderBy('u.id').limit(pagesize).offset(offset)
    return send(res, { total: Number(countRow?.count ?? 0), pagenum, users: rows.map(userDto) })
  })

  api.post('/users', permit('users.write'), async (req, res) => {
    const parsed = userCreateSchema.safeParse(req.body)
    if (!parsed.success) return fail(res, 400, parsed.error.issues[0]?.message ?? '用户信息不完整')
    if (await db('users').where({ username: parsed.data.username }).first()) return fail(res, 409, '用户名已存在')
    const defaultRole = await db('roles').where({ role_name: '只读观察员' }).first() ?? await db('roles').orderBy('id').first()
    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    const [id] = await db('users').insert({ username: parsed.data.username, password_hash: passwordHash, email: parsed.data.email, mobile: parsed.data.mobile, state: true, role_id: defaultRole.id, force_password_change: false, token_version: 0 })
    const row = await db('users as u').join('roles as r', 'r.id', 'u.role_id').where('u.id', id).select('u.*', 'r.role_name').first()
    return send(res, userDto(row), 201, '创建用户成功')
  })

  api.get('/users/:id', permit('users.read'), async (req, res) => {
    const row = await db('users as u').join('roles as r', 'r.id', 'u.role_id').where('u.id', asId(req.params.id)).select('u.*', 'r.role_name').first()
    if (!row) return fail(res, 404, '用户不存在')
    return send(res, userDto(row))
  })

  api.put('/users/:id/state/:state', permit('users.write'), async (req: AuthRequest, res) => {
    const id = asId(req.params.id)
    if (id === req.auth!.id && req.params.state === 'false') return fail(res, 400, '不能停用当前登录用户')
    const state = req.params.state === 'true' || req.params.state === '1'
    const changed = await db('users').where({ id }).update({ state, token_version: db.raw('token_version + 1'), updated_at: db.fn.now() })
    if (!changed) return fail(res, 404, '用户不存在')
    return send(res, { id, mg_state: state }, 200, '修改用户状态成功')
  })

  api.put('/users/:id/role', permit('users.write'), async (req: AuthRequest, res) => {
    const id = asId(req.params.id)
    const roleId = Number(req.body?.rid)
    if (!(await db('roles').where({ id: roleId }).first())) return fail(res, 400, '目标角色不存在')
    if (id === req.auth!.id && roleId !== req.auth!.roleId) return fail(res, 400, '不能修改当前登录用户自己的角色')
    const changed = await db('users').where({ id }).update({ role_id: roleId, token_version: db.raw('token_version + 1'), updated_at: db.fn.now() })
    if (!changed) return fail(res, 404, '用户不存在')
    return send(res, { id, rid: roleId }, 200, '分配角色成功')
  })

  api.put('/users/:id', permit('users.write'), async (req, res) => {
    const id = asId(req.params.id)
    const email = String(req.body?.email ?? '').trim()
    const mobile = String(req.body?.mobile ?? '').trim()
    if (!z.email().safeParse(email).success || !mobile) return fail(res, 400, '邮箱或电话格式不正确')
    const changed = await db('users').where({ id }).update({ email, mobile, updated_at: db.fn.now() })
    if (!changed) return fail(res, 404, '用户不存在')
    return send(res, { id, email, mobile }, 200, '修改用户成功')
  })

  api.delete('/users/:id', permit('users.write'), async (req: AuthRequest, res) => {
    const id = asId(req.params.id)
    if (id === req.auth!.id) return fail(res, 400, '不能删除当前登录用户')
    const changed = await db('users').where({ id }).delete()
    if (!changed) return fail(res, 404, '用户不存在')
    return send(res, null, 200, '删除用户成功')
  })

  api.get('/me', async (req: AuthRequest, res) => {
    const row = await db('users as u').join('roles as r', 'r.id', 'u.role_id').where('u.id', req.auth!.id).select('u.*', 'r.role_name').first()
    return send(res, userDto(row))
  })

  api.put('/me', async (req: AuthRequest, res) => {
    const email = String(req.body?.email ?? '').trim()
    const mobile = String(req.body?.mobile ?? '').trim()
    if (!z.email().safeParse(email).success || !mobile) return fail(res, 400, '邮箱或电话格式不正确')
    await db('users').where({ id: req.auth!.id }).update({ email, mobile, updated_at: db.fn.now() })
    const row = await db('users as u').join('roles as r', 'r.id', 'u.role_id').where('u.id', req.auth!.id).select('u.*', 'r.role_name').first()
    return send(res, userDto(row), 200, '个人资料已更新')
  })

  api.put('/me/password', async (req: AuthRequest, res) => {
    const currentPassword = String(req.body?.currentPassword ?? '')
    const newPassword = String(req.body?.newPassword ?? '')
    const minimumLength = config.env === 'production' ? 12 : 6
    if (newPassword.length < minimumLength || newPassword.length > 128) return fail(res, 400, `新密码长度应为 ${minimumLength} 到 128 位`)
    const row = await db('users').where({ id: req.auth!.id }).first()
    if (!(await bcrypt.compare(currentPassword, row.password_hash))) return fail(res, 400, '当前密码不正确')
    if (await bcrypt.compare(newPassword, row.password_hash)) return fail(res, 400, '新密码不能与当前密码相同')
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await db('users').where({ id: req.auth!.id }).update({ password_hash: passwordHash, force_password_change: false, token_version: db.raw('token_version + 1'), updated_at: db.fn.now() })
    return send(res, null, 200, '密码修改成功，请重新登录')
  })

  api.get('/categories', permit('categories.read', 'attributes.read', 'goods.read', 'goods.create'), async (req, res) => {
    const maxLevel = req.query.type === undefined ? 2 : Math.max(0, Number(req.query.type) - 1)
    const rows = await db('categories').where({ deleted: false }).where('level', '<=', maxLevel).orderBy(['level', 'id'])
    const tree = buildTree(rows, categoryDto)
    if (req.query.pagenum !== undefined || req.query.pagesize !== undefined) {
      const { pagenum, pagesize, offset } = pageValues(req.query)
      return send(res, { total: tree.length, pagenum, result: tree.slice(offset, offset + pagesize) })
    }
    return send(res, tree)
  })

  api.post('/categories', permit('categories.write'), async (req, res) => {
    const name = String(req.body?.cat_name ?? '').trim()
    const pid = Number(req.body?.cat_pid ?? 0)
    const level = Number(req.body?.cat_level ?? 0)
    if (!name || level < 0 || level > 2) return fail(res, 400, '分类信息不正确')
    if (pid && !(await db('categories').where({ id: pid, deleted: false }).first())) return fail(res, 400, '父级分类不存在')
    if (await db('categories').where({ name, pid, deleted: false }).first()) return fail(res, 409, '同级分类名称已存在')
    const [id] = await db('categories').insert({ name, pid, level, deleted: false })
    return send(res, categoryDto({ id, name, pid, level, deleted: false }), 201, '创建分类成功')
  })

  api.get('/categories/:id', permit('categories.read'), async (req, res) => {
    const row = await db('categories').where({ id: asId(req.params.id), deleted: false }).first()
    if (!row) return fail(res, 404, '分类不存在')
    return send(res, categoryDto(row))
  })

  api.put('/categories/:id', permit('categories.write'), async (req, res) => {
    const id = asId(req.params.id)
    const name = String(req.body?.cat_name ?? '').trim()
    if (!name) return fail(res, 400, '分类名称不能为空')
    const row = await db('categories').where({ id, deleted: false }).first()
    if (!row) return fail(res, 404, '分类不存在')
    if (await db('categories').where({ pid: row.pid, name, deleted: false }).whereNot({ id }).first()) return fail(res, 409, '同级分类名称已存在')
    await db('categories').where({ id }).update({ name })
    return send(res, categoryDto({ ...row, name }), 200, '修改分类成功')
  })

  api.delete('/categories/:id', permit('categories.write'), async (req, res) => {
    const rootId = asId(req.params.id)
    if (!(await db('categories').where({ id: rootId, deleted: false }).first())) return fail(res, 404, '分类不存在')
    const rows = await db('categories').where({ deleted: false }).select('id', 'pid')
    const ids = [rootId]
    for (let index = 0; index < ids.length; index += 1) ids.push(...rows.filter(row => row.pid === ids[index]).map(row => row.id))
    await db.transaction(async trx => {
      await trx('goods').whereIn('category_id', ids).update({ category_id: null })
      await trx('categories').whereIn('id', ids).update({ deleted: true })
    })
    return send(res, null, 200, '删除分类成功')
  })

  api.get('/categories/:categoryId/attributes', permit('attributes.read', 'goods.create'), async (req, res) => {
    let query = db('category_attributes').where({ category_id: asId(req.params.categoryId) })
    if (req.query.sel) query = query.where({ attr_sel: String(req.query.sel) })
    const rows = await query.orderBy('id')
    return send(res, rows.map(attributeDto))
  })

  api.post('/categories/:categoryId/attributes', permit('attributes.write'), async (req, res) => {
    const categoryId = asId(req.params.categoryId)
    const name = String(req.body?.attr_name ?? '').trim()
    const attrSel = String(req.body?.attr_sel ?? '')
    if (!name || !['many', 'only'].includes(attrSel)) return fail(res, 400, '参数信息不正确')
    if (!(await db('categories').where({ id: categoryId, level: 2, deleted: false }).first())) return fail(res, 400, '只能为三级分类添加参数')
    if (await db('category_attributes').where({ category_id: categoryId, name, attr_sel: attrSel }).first()) return fail(res, 409, '参数名称已存在')
    const [id] = await db('category_attributes').insert({ category_id: categoryId, name, attr_sel: attrSel, attr_vals: String(req.body?.attr_vals ?? '') })
    return send(res, attributeDto({ id, category_id: categoryId, name, attr_sel: attrSel, attr_vals: String(req.body?.attr_vals ?? '') }), 201, '创建参数成功')
  })

  api.get('/categories/:categoryId/attributes/:id', permit('attributes.read'), async (req, res) => {
    const row = await db('category_attributes').where({ id: asId(req.params.id), category_id: asId(req.params.categoryId) }).first()
    if (!row) return fail(res, 404, '参数不存在')
    return send(res, attributeDto(row))
  })

  api.put('/categories/:categoryId/attributes/:id', permit('attributes.write'), async (req, res) => {
    const id = asId(req.params.id)
    const categoryId = asId(req.params.categoryId)
    const row = await db('category_attributes').where({ id, category_id: categoryId }).first()
    if (!row) return fail(res, 404, '参数不存在')
    const name = String(req.body?.attr_name ?? row.name).trim()
    const attrSel = String(req.body?.attr_sel ?? row.attr_sel)
    const attrVals = String(req.body?.attr_vals ?? row.attr_vals)
    if (!name || !['many', 'only'].includes(attrSel)) return fail(res, 400, '参数信息不正确')
    await db('category_attributes').where({ id }).update({ name, attr_sel: attrSel, attr_vals: attrVals })
    return send(res, attributeDto({ ...row, name, attr_sel: attrSel, attr_vals: attrVals }), 200, '修改参数成功')
  })

  api.delete('/categories/:categoryId/attributes/:id', permit('attributes.write'), async (req, res) => {
    const changed = await db('category_attributes').where({ id: asId(req.params.id), category_id: asId(req.params.categoryId) }).delete()
    if (!changed) return fail(res, 404, '参数不存在')
    return send(res, null, 200, '删除参数成功')
  })

  api.get('/goods', permit('goods.read'), async (req, res) => {
    const { pagenum, pagesize, offset } = pageValues(req.query)
    const search = String(req.query.query ?? '').trim()
    const base = db('goods as g').leftJoin('categories as c', 'c.id', 'g.category_id')
    if (search) base.whereLike('g.name', `%${search}%`)
    const countRow = await base.clone().count<{ count: number | string }>({ count: '*' }).first()
    const rows = await base.clone().select('g.*', 'c.name as cat_name').orderBy('g.id', 'desc').limit(pagesize).offset(offset)
    return send(res, { total: Number(countRow?.count ?? 0), pagenum, goods: rows.map(goodsDto) })
  })

  api.post('/goods', permit('goods.create'), async (req, res) => {
    const name = String(req.body?.goods_name ?? '').trim()
    const goodsCat = String(req.body?.goods_cat ?? '')
    const categoryId = Number(goodsCat.split(',').filter(Boolean).at(-1)) || null
    if (!name) return fail(res, 400, '救助信息名称不能为空')
    if (await db('goods').where({ name }).first()) return fail(res, 409, '救助信息名称已存在')
    const id = await db.transaction(async trx => {
      const [newId] = await trx('goods').insert({
        name,
        price: Number(req.body?.goods_price ?? 0),
        number: Number(req.body?.goods_number ?? 1),
        weight: Number(req.body?.goods_weight ?? 0),
        state: Number(req.body?.goods_state ?? 2),
        category_id: categoryId,
        goods_cat: goodsCat,
        introduce: String(req.body?.goods_introduce ?? '')
      })
      const pics = Array.isArray(req.body?.pics) ? req.body.pics : []
      if (pics.length) await trx('goods_pictures').insert(pics.map((pic: any) => ({ goods_id: newId, path: String(pic.pic ?? pic.tmp_path ?? ''), url: String(pic.url ?? pic.pic ?? '') })))
      const attrs = Array.isArray(req.body?.attrs) ? req.body.attrs : []
      if (attrs.length) await trx('goods_attributes').insert(attrs.map((attr: any) => ({ goods_id: newId, attribute_id: Number(attr.attr_id), value: String(attr.attr_value ?? '') })))
      return Number(newId)
    })
    const row = await db('goods as g').leftJoin('categories as c', 'c.id', 'g.category_id').where('g.id', id).select('g.*', 'c.name as cat_name').first()
    return send(res, goodsDto(row), 201, '创建救助信息成功')
  })

  api.get('/goods/:id', permit('goods.read'), async (req, res) => {
    const row = await db('goods as g').leftJoin('categories as c', 'c.id', 'g.category_id').where('g.id', asId(req.params.id)).select('g.*', 'c.name as cat_name').first()
    if (!row) return fail(res, 404, '救助信息不存在')
    const pics = await db('goods_pictures').where({ goods_id: row.id }).select('id as pics_id', 'path as pics_big_url', 'url as pics_mid_url', 'url as pics_sma_url')
    const attrs = await db('goods_attributes').where({ goods_id: row.id }).select('attribute_id as attr_id', 'value as attr_value')
    return send(res, { ...goodsDto(row), pics, attrs })
  })

  api.put('/goods/:id', permit('goods.write'), async (req, res) => {
    const id = asId(req.params.id)
    const row = await db('goods').where({ id }).first()
    if (!row) return fail(res, 404, '救助信息不存在')
    const name = String(req.body?.goods_name ?? row.name).trim()
    const goodsCat = String(req.body?.goods_cat ?? row.goods_cat)
    const conflict = await db('goods').where({ name }).whereNot({ id }).first()
    if (conflict) return fail(res, 409, '救助信息名称已存在')
    const categoryId = Number(goodsCat.split(',').filter(Boolean).at(-1)) || null
    await db('goods').where({ id }).update({
      name,
      price: Number(req.body?.goods_price ?? row.price),
      number: Number(req.body?.goods_number ?? row.number),
      weight: Number(req.body?.goods_weight ?? row.weight),
      state: Number(req.body?.goods_state ?? row.state),
      category_id: categoryId,
      goods_cat: goodsCat,
      introduce: String(req.body?.goods_introduce ?? row.introduce),
      updated_at: db.fn.now()
    })
    const updated = await db('goods as g').leftJoin('categories as c', 'c.id', 'g.category_id').where('g.id', id).select('g.*', 'c.name as cat_name').first()
    return send(res, goodsDto(updated), 200, '修改救助信息成功')
  })

  api.delete('/goods/:id', permit('goods.write'), async (req, res) => {
    const changed = await db('goods').where({ id: asId(req.params.id) }).delete()
    if (!changed) return fail(res, 404, '救助信息不存在')
    return send(res, null, 200, '删除救助信息成功')
  })

  api.post('/upload', permit('goods.create', 'goods.write'), upload.single('file'), (req, res) => {
    if (!req.file) return fail(res, 400, '仅支持不超过 5 MB 的 JPEG、PNG 或 WebP 图片')
    const url = `/uploads/${req.file.filename}`
    return send(res, { tmp_path: req.file.filename, url }, 200, '上传成功')
  })

  api.get('/orders', permit('orders.read'), async (req, res) => {
    const { pagenum, pagesize, offset } = pageValues(req.query)
    const search = String(req.query.query ?? '').trim()
    const base = db('orders as o').leftJoin('goods as g', 'g.id', 'o.goods_id')
    if (search) base.where(builder => builder.whereLike('o.order_number', `%${search}%`).orWhereLike('o.invoice_title', `%${search}%`).orWhereLike('o.consignee_addr', `%${search}%`).orWhereLike('g.name', `%${search}%`))
    if (req.query.status) base.where('o.status', String(req.query.status))
    const countRow = await base.clone().count<{ count: number | string }>({ count: '*' }).first()
    const rows = await base.clone().select('o.*', 'g.name as goods_name').orderBy('o.id', 'desc').limit(pagesize).offset(offset)
    return send(res, { total: Number(countRow?.count ?? 0), pagenum, goods: rows.map(orderDto) })
  })

  api.post('/orders', permit('orders.write'), async (req, res) => {
    const orderNumber = String(req.body?.order_number ?? '').trim() || `EV${Date.now()}`
    const address = String(req.body?.consignee_addr ?? '').trim()
    const goodsId = Number(req.body?.goods_id) || null
    if (!address) return fail(res, 400, '执行地址不能为空')
    if (goodsId && !(await db('goods').where({ id: goodsId }).first())) return fail(res, 400, '关联救助信息不存在')
    if (await db('orders').where({ order_number: orderNumber }).first()) return fail(res, 409, '执行编号已存在')
    const id = await db.transaction(async trx => {
      const [newId] = await trx('orders').insert({
        order_number: orderNumber,
        invoice_title: String(req.body?.order_fapiao_title ?? ''),
        pay_status: Number(req.body?.pay_status ?? 0),
        is_send: String(req.body?.is_send ?? '否'),
        consignee_addr: address,
        status: String(req.body?.order_status ?? '待执行'),
        goods_id: goodsId
      })
      await trx('order_events').insert({ order_id: newId, event_time: new Date(), context: '执行记录已创建', location: address })
      return Number(newId)
    })
    const row = await db('orders as o').leftJoin('goods as g', 'g.id', 'o.goods_id').where('o.id', id).select('o.*', 'g.name as goods_name').first()
    return send(res, orderDto(row), 201, '创建执行记录成功')
  })

  api.get('/orders/:id', permit('orders.read'), async (req, res) => {
    const row = await db('orders as o').leftJoin('goods as g', 'g.id', 'o.goods_id').where('o.id', asId(req.params.id)).select('o.*', 'g.name as goods_name').first()
    if (!row) return fail(res, 404, '执行记录不存在')
    return send(res, orderDto(row))
  })

  api.put('/orders/:id', permit('orders.write'), async (req: AuthRequest, res) => {
    const id = asId(req.params.id)
    const row = await db('orders').where({ id }).first()
    if (!row) return fail(res, 404, '执行记录不存在')
    const status = String(req.body?.order_status ?? req.body?.status ?? row.status)
    if (!['待执行', '执行中', '已完成', '已取消'].includes(status)) return fail(res, 400, '执行状态不正确')
    const address = String(req.body?.consignee_addr ?? row.consignee_addr).trim()
    const isSend = String(req.body?.is_send ?? row.is_send)
    await db.transaction(async trx => {
      await trx('orders').where({ id }).update({ consignee_addr: address, status, is_send: isSend, pay_status: Number(req.body?.pay_status ?? row.pay_status), updated_at: db.fn.now() })
      if (status !== row.status) await trx('order_events').insert({ order_id: id, event_time: new Date(), context: `执行状态由“${row.status}”更新为“${status}”`, location: address })
    })
    const updated = await db('orders as o').leftJoin('goods as g', 'g.id', 'o.goods_id').where('o.id', id).select('o.*', 'g.name as goods_name').first()
    return send(res, orderDto(updated), 200, '更新执行记录成功')
  })

  api.delete('/orders/:id', permit('orders.write'), async (req, res) => {
    const changed = await db('orders').where({ id: asId(req.params.id) }).delete()
    if (!changed) return fail(res, 404, '执行记录不存在')
    return send(res, null, 200, '删除执行记录成功')
  })

  api.get('/kuaidi/:id', permit('orders.read'), async (req, res) => {
    const key = String(req.params.id)
    const order = /^\d+$/.test(key) ? await db('orders').where({ id: Number(key) }).orWhere({ order_number: key }).first() : await db('orders').where({ order_number: key }).first()
    if (!order) return fail(res, 404, '执行记录不存在')
    const events = await db('order_events').where({ order_id: order.id }).orderBy('event_time', 'desc')
    return send(res, events.map(event => ({ time: isoTime(event.event_time), ftime: isoTime(event.event_time), context: event.context, location: event.location })))
  })

  app.use('/api/private/v1', api)

  if (config.frontendDir && fs.existsSync(config.frontendDir)) {
    app.use(express.static(config.frontendDir, { index: 'index.html', maxAge: config.env === 'production' ? '1h' : 0 }))
    app.get(/^\/(?!api\/|uploads\/).*/, (_req, res) => res.sendFile(path.join(config.frontendDir!, 'index.html')))
  }

  app.use((req, res) => fail(res, 404, `接口不存在：${req.method} ${req.path}`))
  app.use((error: any, _req: express.Request, res: Response, _next: NextFunction) => {
    if (error instanceof multer.MulterError) return fail(res, 400, error.code === 'LIMIT_FILE_SIZE' ? '图片不能超过 5 MB' : '图片上传失败')
    if (error?.code === 'SQLITE_CONSTRAINT' || error?.code === 'ER_DUP_ENTRY') return fail(res, 409, '数据与现有记录冲突')
    console.error(error)
    return fail(res, 500, '服务器内部错误')
  })

  return app
}
