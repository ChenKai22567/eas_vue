# EasVue 救助信息后台管理系统

这是对 2021 年 Vue 2 项目的全栈恢复版本。页面继续使用 Vue 2 + Element UI，后端为 Node.js 24 + Express 5 + TypeScript，数据访问使用 Knex，默认数据库为 SQLite，并可通过环境变量切换到 MariaDB。

- 生产地址：<https://easvue.624work.club>
- 前后端源码：<https://github.com/ChenKai22567/eas_vue>

## 本地运行

需要 Node.js 24 与 npm 11。

```powershell
npm run setup
npm run dev
```

- 前端：http://localhost:8080
- API：http://127.0.0.1:8888
- 健康检查：http://127.0.0.1:8888/api/health
- 本地演示管理员：`admin` / `123456`

`npm run setup` 使用 lockfile 全新安装前后端依赖，并幂等执行数据库迁移和演示数据初始化。本地 SQLite 数据和上传文件位于 `server/var/`，不会纳入 Git。
演示数据覆盖用户与角色、三级分类及树形参数、12 条救助信息、12 条执行记录和完整时间线。

## 验证命令

```powershell
npm ci
npm --prefix server ci
npm --prefix server run db:setup
npm run lint
npm run build
npm run test:api
```

## 配置

后端配置示例见 `server/.env.example`。生产环境必须提供至少 32 位的随机 `JWT_SECRET`，并把 SQLite 与上传目录配置到发布目录之外。标准 API 前缀为 `/api/private/v1/`，旧式裸 Token 和标准 `Bearer` Token 都受支持。

服务器布局、发布、备份、回滚及故障排查见 `docs/SERVER_RUNBOOK.md`。
