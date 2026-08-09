import bcrypt from 'bcryptjs'
import type { Knex } from 'knex'
import { config } from './config.js'

const rights = [
  { id: 125, auth_name: '用户管理', path: '', level: 0, pid: 0, permission_code: 'users.section' },
  { id: 110, auth_name: '用户列表', path: 'users', level: 1, pid: 125, permission_code: 'users.read' },
  { id: 1101, auth_name: '维护用户', path: 'users', level: 2, pid: 110, permission_code: 'users.write' },
  { id: 103, auth_name: '权限管理', path: '', level: 0, pid: 0, permission_code: 'rights.section' },
  { id: 111, auth_name: '角色列表', path: 'roles', level: 1, pid: 103, permission_code: 'roles.read' },
  { id: 1111, auth_name: '维护角色', path: 'roles', level: 2, pid: 111, permission_code: 'roles.write' },
  { id: 112, auth_name: '权限列表', path: 'rights', level: 1, pid: 103, permission_code: 'rights.read' },
  { id: 101, auth_name: '救助信息管理', path: '', level: 0, pid: 0, permission_code: 'goods.section' },
  { id: 113, auth_name: '救助信息分类', path: 'categories', level: 1, pid: 101, permission_code: 'categories.read' },
  { id: 1131, auth_name: '维护分类', path: 'categories', level: 2, pid: 113, permission_code: 'categories.write' },
  { id: 114, auth_name: '分类参数设置', path: 'params', level: 1, pid: 101, permission_code: 'attributes.read' },
  { id: 1141, auth_name: '维护分类参数', path: 'params', level: 2, pid: 114, permission_code: 'attributes.write' },
  { id: 115, auth_name: '救助信息列表', path: 'infos', level: 1, pid: 101, permission_code: 'goods.read' },
  { id: 1151, auth_name: '维护救助信息', path: 'infos', level: 2, pid: 115, permission_code: 'goods.write' },
  { id: 116, auth_name: '添加救助信息', path: 'infos/add', level: 1, pid: 101, permission_code: 'goods.create' },
  { id: 102, auth_name: '执行情况管理', path: '', level: 0, pid: 0, permission_code: 'orders.section' },
  { id: 117, auth_name: '救助执行情况', path: 'process', level: 1, pid: 102, permission_code: 'orders.read' },
  { id: 1171, auth_name: '维护执行记录', path: 'process', level: 2, pid: 117, permission_code: 'orders.write' },
  { id: 145, auth_name: '统计报表', path: '', level: 0, pid: 0, permission_code: 'reports.section' },
  { id: 118, auth_name: '救助信息统计', path: 'reports', level: 1, pid: 145, permission_code: 'reports.read' }
]

async function ensureRole(db: Knex, roleName: string, roleDesc: string) {
  let role = await db('roles').where({ role_name: roleName }).first()
  if (!role) {
    const [id] = await db('roles').insert({ role_name: roleName, role_desc: roleDesc })
    role = await db('roles').where({ id }).first()
  }
  return role
}

async function ensureUser(db: Knex, input: { username: string; password: string; email: string; mobile: string; roleId: number; force: boolean }) {
  const existing = await db('users').where({ username: input.username }).first()
  if (existing) return existing
  const passwordHash = await bcrypt.hash(input.password, 12)
  const [id] = await db('users').insert({
    username: input.username,
    password_hash: passwordHash,
    email: input.email,
    mobile: input.mobile,
    state: true,
    role_id: input.roleId,
    force_password_change: input.force,
    token_version: 0
  })
  return db('users').where({ id }).first()
}

export async function seed(db: Knex) {
  await db.transaction(async trx => {
    if ((await trx('rights').count<{ count: number | string }>({ count: '*' }).first())?.count === 0) {
      await trx('rights').insert(rights)
    }

    const adminRole = await ensureRole(trx, '超级管理员', '拥有系统全部权限')
    const operatorRole = await ensureRole(trx, '救助专员', '维护救助信息与执行记录')
    const viewerRole = await ensureRole(trx, '只读观察员', '只读查看救助业务数据')

    if (!(await trx('role_rights').where({ role_id: adminRole.id }).first())) {
      await trx('role_rights').insert(rights.map(right => ({ role_id: adminRole.id, right_id: right.id })))
    }

    const operatorCodes = ['goods.section', 'categories.read', 'attributes.read', 'goods.read', 'goods.write', 'goods.create', 'orders.section', 'orders.read', 'orders.write', 'reports.section', 'reports.read']
    const viewerCodes = ['goods.section', 'categories.read', 'attributes.read', 'goods.read', 'orders.section', 'orders.read', 'reports.section', 'reports.read']
    for (const [role, codes] of [[operatorRole, operatorCodes], [viewerRole, viewerCodes]] as const) {
      if (!(await trx('role_rights').where({ role_id: role.id }).first())) {
        const roleRights = rights.filter(right => codes.includes(right.permission_code))
        await trx('role_rights').insert(roleRights.map(right => ({ role_id: role.id, right_id: right.id })))
      }
    }

    await ensureUser(trx, {
      username: config.seedAdminUsername,
      password: config.seedAdminPassword,
      email: 'admin@easvue.local',
      mobile: '13800000000',
      roleId: adminRole.id,
      force: config.seedForcePasswordChange
    })
    await ensureUser(trx, {
      username: 'operator', password: 'operator123', email: 'operator@easvue.local', mobile: '13800000001', roleId: operatorRole.id, force: false
    })
    await ensureUser(trx, {
      username: 'viewer', password: 'viewer123', email: 'viewer@easvue.local', mobile: '13800000002', roleId: viewerRole.id, force: false
    })
    await ensureUser(trx, {
      username: 'dispatcher', password: 'dispatcher123', email: 'dispatcher@easvue.local', mobile: '13800000003', roleId: operatorRole.id, force: false
    })
    await ensureUser(trx, {
      username: 'coordinator', password: 'coordinator123', email: 'coordinator@easvue.local', mobile: '13800000004', roleId: operatorRole.id, force: false
    })
    await ensureUser(trx, {
      username: 'auditor', password: 'auditor123', email: 'auditor@easvue.local', mobile: '13800000005', roleId: viewerRole.id, force: false
    })

    if (!(await trx('categories').first())) {
      await trx('categories').insert([
        { id: 1, name: '自然灾害', pid: 0, level: 0, deleted: false },
        { id: 2, name: '医疗救助', pid: 0, level: 0, deleted: false },
        { id: 3, name: '生活帮扶', pid: 0, level: 0, deleted: false },
        { id: 11, name: '极端天气', pid: 1, level: 1, deleted: false },
        { id: 12, name: '地质灾害', pid: 1, level: 1, deleted: false },
        { id: 21, name: '急诊协助', pid: 2, level: 1, deleted: false },
        { id: 22, name: '长期治疗', pid: 2, level: 1, deleted: false },
        { id: 31, name: '物资支持', pid: 3, level: 1, deleted: false },
        { id: 32, name: '临时安置', pid: 3, level: 1, deleted: false },
        { id: 111, name: '暴雨内涝', pid: 11, level: 2, deleted: false },
        { id: 112, name: '台风影响', pid: 11, level: 2, deleted: false },
        { id: 121, name: '山体滑坡', pid: 12, level: 2, deleted: false },
        { id: 211, name: '紧急送医', pid: 21, level: 2, deleted: false },
        { id: 221, name: '大病筹助', pid: 22, level: 2, deleted: false },
        { id: 311, name: '食品物资', pid: 31, level: 2, deleted: false },
        { id: 312, name: '御寒物资', pid: 31, level: 2, deleted: false },
        { id: 321, name: '临时住所', pid: 32, level: 2, deleted: false }
      ])
    }

    const additionalCategories = [
      { name: '高温热浪', pid: 11, level: 2, deleted: false },
      { name: '地震险情', pid: 12, level: 2, deleted: false },
      { name: '夜间急诊', pid: 21, level: 2, deleted: false },
      { name: '康复护理', pid: 22, level: 2, deleted: false },
      { name: '婴幼儿物资', pid: 31, level: 2, deleted: false },
      { name: '无障碍安置', pid: 32, level: 2, deleted: false }
    ]
    for (const category of additionalCategories) {
      if (!(await trx('categories').where({ pid: category.pid, name: category.name }).first())) {
        await trx('categories').insert(category)
      }
    }
    const additionalCategoryIds: Record<string, number> = {}
    for (const category of additionalCategories) {
      const row = await trx('categories').where({ pid: category.pid, name: category.name }).first()
      additionalCategoryIds[category.name] = row.id
    }

    const categoryAttributes = [
      { id: 1, category_id: 111, name: '受灾程度', attr_sel: 'many', attr_vals: '轻度 中度 重度 紧急' },
      { id: 2, category_id: 111, name: '现场情况', attr_sel: 'only', attr_vals: '积水深度 受困人数 断电情况 道路通行' },
      { id: 6, category_id: 111, name: '重点人群', attr_sel: 'many', attr_vals: '独居老人 儿童 孕妇 残障人士 慢病患者' },
      { id: 7, category_id: 112, name: '风力影响', attr_sel: 'many', attr_vals: '六至七级 八至九级 十级以上' },
      { id: 8, category_id: 112, name: '现场风险', attr_sel: 'only', attr_vals: '高空坠物 树木倒伏 房屋受损 停水停电' },
      { id: 9, category_id: 121, name: '滑坡规模', attr_sel: 'many', attr_vals: '小型 中型 大型 特大型' },
      { id: 10, category_id: 121, name: '地质现场', attr_sel: 'only', attr_vals: '裂缝范围 受威胁住户 道路阻断 二次滑坡风险' },
      { id: 3, category_id: 211, name: '伤情等级', attr_sel: 'many', attr_vals: '一般 紧急 危重' },
      { id: 4, category_id: 211, name: '就诊医院', attr_sel: 'only', attr_vals: '医院名称 急诊科室 接诊联系人 绿色通道' },
      { id: 11, category_id: 211, name: '转运需求', attr_sel: 'many', attr_vals: '普通车辆 无障碍车辆 救护车 儿童座椅' },
      { id: 12, category_id: 221, name: '治疗阶段', attr_sel: 'many', attr_vals: '术前治疗 手术住院 术后康复 长期用药' },
      { id: 13, category_id: 221, name: '筹助资料', attr_sel: 'only', attr_vals: '诊断证明 费用清单 医保信息 家庭情况' },
      { id: 5, category_id: 311, name: '物资种类', attr_sel: 'many', attr_vals: '饮用水 米面 食用油 即食食品 婴幼儿食品' },
      { id: 14, category_id: 311, name: '配送要求', attr_sel: 'only', attr_vals: '收货人数 配送批次 保质期要求 清真需求' },
      { id: 15, category_id: 312, name: '御寒种类', attr_sel: 'many', attr_vals: '棉被 保暖衣 电热毯 暖宝宝 防寒帐篷' },
      { id: 16, category_id: 312, name: '尺码人群', attr_sel: 'only', attr_vals: '成人男装 成人女装 儿童尺码 老年人尺码' },
      { id: 17, category_id: 321, name: '住所类型', attr_sel: 'many', attr_vals: '集中安置点 宾馆 民宿 周转房 亲友家' },
      { id: 18, category_id: 321, name: '安置需求', attr_sel: 'only', attr_vals: '入住人数 无障碍设施 宠物安置 基础药品 餐食安排' },
      { category_id: additionalCategoryIds['高温热浪'], name: '高温等级', attr_sel: 'many', attr_vals: '橙色预警 红色预警 连续高温 夜间高温' },
      { category_id: additionalCategoryIds['高温热浪'], name: '补给需求', attr_sel: 'only', attr_vals: '饮用水 防暑药品 遮阳设施 降温点 医疗巡查' },
      { category_id: additionalCategoryIds['地震险情'], name: '建筑风险', attr_sel: 'many', attr_vals: '墙体开裂 玻璃坠落 燃气泄漏 电梯停运' },
      { category_id: additionalCategoryIds['地震险情'], name: '排查结果', attr_sel: 'only', attr_vals: '受影响楼栋 需转移人数 临时警戒范围 复查时间' },
      { category_id: additionalCategoryIds['夜间急诊'], name: '急诊类型', attr_sel: 'many', attr_vals: '儿科 外科 内科 产科 心脑血管' },
      { category_id: additionalCategoryIds['夜间急诊'], name: '协助事项', attr_sel: 'only', attr_vals: '预约急诊 车辆转运 陪诊翻译 家属联络' },
      { category_id: additionalCategoryIds['康复护理'], name: '护理阶段', attr_sel: 'many', attr_vals: '术后观察 居家康复 康复训练 长期随访' },
      { category_id: additionalCategoryIds['康复护理'], name: '护理需求', attr_sel: 'only', attr_vals: '上门护理 康复器具 用药提醒 心理支持' },
      { category_id: additionalCategoryIds['婴幼儿物资'], name: '婴幼儿用品', attr_sel: 'many', attr_vals: '配方奶粉 纸尿裤 湿巾 奶瓶 辅食' },
      { category_id: additionalCategoryIds['婴幼儿物资'], name: '年龄与过敏', attr_sel: 'only', attr_vals: '月龄段 奶粉段数 过敏原 特殊喂养要求' },
      { category_id: additionalCategoryIds['无障碍安置'], name: '无障碍设施', attr_sel: 'many', attr_vals: '无障碍坡道 电梯 无障碍卫生间 护理床' },
      { category_id: additionalCategoryIds['无障碍安置'], name: '安置评估', attr_sel: 'only', attr_vals: '轮椅尺寸 陪护人数 医疗设备 接送安排' }
    ]
    for (const attribute of categoryAttributes) {
      const key = { category_id: attribute.category_id, name: attribute.name, attr_sel: attribute.attr_sel }
      const existing = await trx('category_attributes').where(key).first()
      if (!existing) {
        await trx('category_attributes').insert(attribute)
      } else if (!String(existing.attr_vals ?? '').trim()) {
        await trx('category_attributes').where({ id: existing.id }).update({ attr_vals: attribute.attr_vals })
      }
    }

    if (!(await trx('goods').first())) {
      await trx('goods').insert([
        { id: 1, name: '城南社区暴雨应急救助', price: 286, number: 5, weight: 0, state: 1, category_id: 111, goods_cat: '1,11,111', introduce: '<p>为受内涝影响的居民提供转移、食品和饮用水。</p>' },
        { id: 2, name: '儿童紧急送医协助', price: 93, number: 5, weight: 0, state: 0, category_id: 211, goods_cat: '2,21,211', introduce: '<p>协调车辆及医院绿色通道。</p>' },
        { id: 3, name: '独居老人御寒物资', price: 127, number: 3, weight: 0, state: 2, category_id: 312, goods_cat: '3,31,312', introduce: '<p>发放棉被、电热毯和保暖衣物。</p>' },
        { id: 4, name: '临时安置点生活保障', price: 341, number: 4, weight: 0, state: 1, category_id: 321, goods_cat: '3,32,321', introduce: '<p>保障安置点基础生活用品。</p>' }
      ])
      await trx('goods_attributes').insert([
        { goods_id: 1, attribute_id: 1, value: '重度' },
        { goods_id: 1, attribute_id: 2, value: '一层积水，需优先转移老人儿童' },
        { goods_id: 2, attribute_id: 3, value: '紧急' },
        { goods_id: 2, attribute_id: 4, value: '市第一人民医院' }
      ])
    }

    const additionalGoods = [
      { name: '台风后独居老人安全排查', price: 158, number: 12, weight: 0, state: 1, category_id: 112, goods_cat: '1,11,112', introduce: '<p>逐户排查独居老人住房、用电和基本生活保障情况。</p>' },
      { name: '山区滑坡群众转移安置', price: 420, number: 18, weight: 0, state: 1, category_id: 121, goods_cat: '1,12,121', introduce: '<p>协调车辆、临时住所和生活物资，转移受威胁群众。</p>' },
      { name: '高温天气户外急救补给', price: 206, number: 30, weight: 0, state: 2, category_id: additionalCategoryIds['高温热浪'], goods_cat: `1,11,${additionalCategoryIds['高温热浪']}`, introduce: '<p>为户外工作者和高温易感人群提供饮水、防暑药品与巡查。</p>' },
      { name: '夜间急诊绿色通道协助', price: 115, number: 6, weight: 0, state: 1, category_id: additionalCategoryIds['夜间急诊'], goods_cat: `2,21,${additionalCategoryIds['夜间急诊']}`, introduce: '<p>协调夜间车辆、急诊挂号和陪诊联络。</p>' },
      { name: '肿瘤患者居家康复陪护', price: 360, number: 2, weight: 0, state: 0, category_id: additionalCategoryIds['康复护理'], goods_cat: `2,22,${additionalCategoryIds['康复护理']}`, introduce: '<p>提供阶段性上门护理、用药提醒和康复训练支持。</p>' },
      { name: '婴幼儿应急奶粉配送', price: 188, number: 15, weight: 0, state: 1, category_id: additionalCategoryIds['婴幼儿物资'], goods_cat: `3,31,${additionalCategoryIds['婴幼儿物资']}`, introduce: '<p>按月龄和过敏情况配送配方奶粉、纸尿裤等用品。</p>' },
      { name: '轮椅使用者无障碍安置', price: 295, number: 4, weight: 0, state: 1, category_id: additionalCategoryIds['无障碍安置'], goods_cat: `3,32,${additionalCategoryIds['无障碍安置']}`, introduce: '<p>匹配具有坡道、电梯和无障碍卫生间的临时住所。</p>' },
      { name: '受灾家庭食品补给包', price: 146, number: 24, weight: 0, state: 2, category_id: 311, goods_cat: '3,31,311', introduce: '<p>按家庭人数配置饮用水、米面油和即食食品。</p>' }
    ]
    for (const goods of additionalGoods) {
      if (!(await trx('goods').where({ name: goods.name }).first())) {
        await trx('goods').insert(goods)
      }
    }

    const additionalGoodsAttributes = [
      { goodsName: '台风后独居老人安全排查', categoryId: 112, attributeName: '风力影响', value: '八至九级' },
      { goodsName: '台风后独居老人安全排查', categoryId: 112, attributeName: '现场风险', value: '树木倒伏、部分住户停电' },
      { goodsName: '山区滑坡群众转移安置', categoryId: 121, attributeName: '滑坡规模', value: '中型' },
      { goodsName: '山区滑坡群众转移安置', categoryId: 121, attributeName: '地质现场', value: '受威胁住户 18 户，道路单向通行' },
      { goodsName: '高温天气户外急救补给', categoryId: additionalCategoryIds['高温热浪'], attributeName: '高温等级', value: '红色预警' },
      { goodsName: '夜间急诊绿色通道协助', categoryId: additionalCategoryIds['夜间急诊'], attributeName: '急诊类型', value: '儿科' },
      { goodsName: '肿瘤患者居家康复陪护', categoryId: additionalCategoryIds['康复护理'], attributeName: '护理阶段', value: '居家康复' },
      { goodsName: '婴幼儿应急奶粉配送', categoryId: additionalCategoryIds['婴幼儿物资'], attributeName: '婴幼儿用品', value: '配方奶粉 纸尿裤' },
      { goodsName: '轮椅使用者无障碍安置', categoryId: additionalCategoryIds['无障碍安置'], attributeName: '无障碍设施', value: '无障碍坡道 电梯 无障碍卫生间' },
      { goodsName: '受灾家庭食品补给包', categoryId: 311, attributeName: '物资种类', value: '饮用水 米面 食用油 即食食品' }
    ]
    for (const item of additionalGoodsAttributes) {
      const goods = await trx('goods').where({ name: item.goodsName }).first()
      const attribute = await trx('category_attributes').where({ category_id: item.categoryId, name: item.attributeName }).first()
      if (goods && attribute && !(await trx('goods_attributes').where({ goods_id: goods.id, attribute_id: attribute.id }).first())) {
        await trx('goods_attributes').insert({ goods_id: goods.id, attribute_id: attribute.id, value: item.value })
      }
    }

    if (!(await trx('orders').first())) {
      await trx('orders').insert([
        { id: 1, order_number: 'EV202608090001', invoice_title: '城南社区救助站', pay_status: 1, is_send: '是', consignee_addr: '杭州市城南社区服务中心', status: '执行中', goods_id: 1 },
        { id: 2, order_number: 'EV202608090002', invoice_title: '市急救志愿队', pay_status: 1, is_send: '是', consignee_addr: '杭州市第一人民医院急诊部', status: '已完成', goods_id: 2 },
        { id: 3, order_number: 'EV202608090003', invoice_title: '暖冬行动小组', pay_status: 0, is_send: '否', consignee_addr: '杭州市幸福里街道办', status: '待执行', goods_id: 3 },
        { id: 4, order_number: 'EV202608090004', invoice_title: '临时安置协调组', pay_status: 1, is_send: '是', consignee_addr: '杭州市体育馆临时安置点', status: '执行中', goods_id: 4 }
      ])
      await trx('order_events').insert([
        { order_id: 1, event_time: '2026-08-09 08:15:00', context: '救助申请审核通过', location: '城南社区服务中心' },
        { order_id: 1, event_time: '2026-08-09 09:40:00', context: '首批饮用水和食品已装车', location: '市应急物资仓库' },
        { order_id: 1, event_time: '2026-08-09 10:35:00', context: '物资送达，志愿者开始入户核验', location: '城南社区' },
        { order_id: 2, event_time: '2026-08-08 14:05:00', context: '接到紧急送医请求', location: '湖滨街道' },
        { order_id: 2, event_time: '2026-08-08 14:32:00', context: '救助车辆接到患儿', location: '湖滨街道' },
        { order_id: 2, event_time: '2026-08-08 14:58:00', context: '抵达医院并完成急诊交接', location: '市第一人民医院' },
        { order_id: 3, event_time: '2026-08-09 11:20:00', context: '需求已登记，等待物资出库', location: '幸福里街道办' },
        { order_id: 4, event_time: '2026-08-09 07:40:00', context: '安置点物资清单确认', location: '市体育馆' },
        { order_id: 4, event_time: '2026-08-09 09:10:00', context: '床品与洗漱用品送达', location: '市体育馆临时安置点' }
      ])
    }


    const additionalOrders = [
      { number: 'EV202608090005', title: '沿江街道网格中心', pay: 1, arrived: '是', address: '杭州市沿江街道安置服务点', status: '已完成', goodsName: '台风后独居老人安全排查' },
      { number: 'EV202608090006', title: '北山镇应急办', pay: 1, arrived: '是', address: '杭州市北山镇中心小学安置点', status: '执行中', goodsName: '山区滑坡群众转移安置' },
      { number: 'EV202608090007', title: '城市志愿服务队', pay: 1, arrived: '否', address: '杭州市火车东站南广场', status: '待执行', goodsName: '高温天气户外急救补给' },
      { number: 'EV202608090008', title: '湖滨街道夜间值班组', pay: 1, arrived: '是', address: '杭州市儿童医院急诊中心', status: '已完成', goodsName: '夜间急诊绿色通道协助' },
      { number: 'EV202608090009', title: '康复照护联络站', pay: 0, arrived: '否', address: '杭州市柳岸家园 3 幢', status: '已取消', goodsName: '肿瘤患者居家康复陪护' },
      { number: 'EV202608090010', title: '妇幼关爱志愿组', pay: 1, arrived: '是', address: '杭州市青禾社区服务中心', status: '执行中', goodsName: '婴幼儿应急奶粉配送' },
      { number: 'EV202608090011', title: '无障碍服务协调组', pay: 1, arrived: '否', address: '杭州市西溪无障碍周转公寓', status: '待执行', goodsName: '轮椅使用者无障碍安置' },
      { number: 'EV202608090012', title: '城北物资保障队', pay: 1, arrived: '是', address: '杭州市城北应急物资发放点', status: '执行中', goodsName: '受灾家庭食品补给包' }
    ]
    for (const item of additionalOrders) {
      if (await trx('orders').where({ order_number: item.number }).first()) continue
      const goods = await trx('goods').where({ name: item.goodsName }).first()
      await trx('orders').insert({
        order_number: item.number,
        invoice_title: item.title,
        pay_status: item.pay,
        is_send: item.arrived,
        consignee_addr: item.address,
        status: item.status,
        goods_id: goods?.id ?? null
      })
    }

    const additionalEvents = [
      { number: 'EV202608090005', time: '2026-08-09 08:20:00', context: '完成独居老人名单核对', location: '沿江街道网格中心' },
      { number: 'EV202608090005', time: '2026-08-09 12:10:00', context: '逐户排查完成并提交安全记录', location: '沿江街道' },
      { number: 'EV202608090006', time: '2026-08-09 09:00:00', context: '地质风险区开始人员转移', location: '北山镇石岭村' },
      { number: 'EV202608090006', time: '2026-08-09 10:45:00', context: '首批群众抵达临时安置点', location: '北山镇中心小学' },
      { number: 'EV202608090007', time: '2026-08-09 13:25:00', context: '防暑物资已完成分装', location: '市志愿服务仓库' },
      { number: 'EV202608090008', time: '2026-08-09 01:15:00', context: '接到儿童夜间急诊协助申请', location: '湖滨街道' },
      { number: 'EV202608090008', time: '2026-08-09 01:48:00', context: '完成急诊绿色通道交接', location: '市儿童医院急诊中心' },
      { number: 'EV202608090009', time: '2026-08-09 09:30:00', context: '家属申请调整服务时间，记录已取消', location: '康复照护联络站' },
      { number: 'EV202608090010', time: '2026-08-09 10:05:00', context: '按月龄完成奶粉和用品配货', location: '妇幼关爱物资站' },
      { number: 'EV202608090010', time: '2026-08-09 11:15:00', context: '首批物资已送达社区', location: '青禾社区服务中心' },
      { number: 'EV202608090011', time: '2026-08-09 14:00:00', context: '已确认无障碍房源与接送车辆', location: '西溪无障碍周转公寓' },
      { number: 'EV202608090012', time: '2026-08-09 08:40:00', context: '食品补给包完成质检与装车', location: '城北应急物资仓库' },
      { number: 'EV202608090012', time: '2026-08-09 10:20:00', context: '第一批家庭完成签收', location: '城北应急物资发放点' }
    ]
    for (const item of additionalEvents) {
      const order = await trx('orders').where({ order_number: item.number }).first()
      if (!order) continue
      const key = { order_id: order.id, event_time: item.time, context: item.context }
      if (!(await trx('order_events').where(key).first())) {
        await trx('order_events').insert({ ...key, location: item.location })
      }
    }
  })
}
