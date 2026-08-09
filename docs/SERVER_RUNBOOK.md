# EasVue 服务器运维手册

## 项目档案

| 项目 | 值 |
| --- | --- |
| 域名 | `easvue.624work.club` |
| 服务器 | `8.137.147.178`（Alibaba Cloud Linux 3） |
| SSH | `lisdeploy` + 专用密钥 |
| 发布目录 | `/www/wwwroot/easvue.624work.club/releases/<version>` |
| 当前版本 | `/www/wwwroot/easvue.624work.club/current`（原子软链接） |
| 持久化数据 | `/www/wwwroot/easvue.624work.club/shared/` |
| 备份 | `/www/backup/easvue/`，保留 14 天 |
| Node.js | `/opt/easvue/node-v24.18.1/`（官方 v24 LTS 隔离运行时） |
| 原生依赖构建 | 仅发布命令使用现有 `/usr/local/bin/python3.12`，不替换系统 Python 3.6 |
| API | `easvue-api.service`，`127.0.0.1:8787` |
| 备份计划 | `easvue-backup.timer`，每日 03:17，带随机延迟 |
| Nginx | 宝塔 Nginx，静态前端 + `/api/` 反向代理 |
| TLS | 宝塔 ACME，证书位于 `/www/server/panel/vhost/letsencrypt/easvue.624work.club/` |

生产环境不在发布目录保存数据库、上传或密钥。`shared/easvue.env` 权限为 `0600`，不得复制到工单、聊天或日志。

## 日常检查

```bash
sudo systemctl status easvue-api.service --no-pager
sudo systemctl status easvue-backup.timer --no-pager
curl --fail http://127.0.0.1:8787/api/health
sudo journalctl -u easvue-api.service -n 100 --no-pager
sudo /www/server/nginx/sbin/nginx -t
readlink -f /www/wwwroot/easvue.624work.club/current
```

数据库完整性检查应以服务用户执行，避免产生 root 所有的 WAL 文件：

```bash
sudo -u easvue /opt/easvue/node-v24.18.1/bin/node -e \
  "const r=require('/www/wwwroot/easvue.624work.club/current/server/node_modules/better-sqlite3'); const d=new r('/www/wwwroot/easvue.624work.club/shared/data/easvue.sqlite3',{readonly:true}); console.log(d.pragma('integrity_check',{simple:true})); d.close()"
```

预期输出为 `ok`。

## 发布

1. 本地必须通过 `npm ci`、前后端构建、lint、API 集成测试和 Playwright 回归。
2. 上传发布包及同名 `.sha256` 到 `/home/lisdeploy/`。
3. 服务器再次计算 SHA-256；新版本只解压到新的 `releases/<version>`。
4. 在新版本执行 `server/npm ci --omit=dev`，原子切换 `current`，再重启服务。
5. 依次验证 systemd、回环健康检查、SQLite 完整性、Nginx 配置和 HTTPS 页面。
6. 至少保留上一个可用发布目录，不在发布过程中修改 `shared/`。

发布脚本：

```bash
sudo /bin/bash /path/to/new/release/deploy/install-release.sh \
  /home/lisdeploy/easvue-<version>.tar.gz \
  /home/lisdeploy/easvue-<version>.tar.gz.sha256 \
  <version>
```

## 回滚

先获取准确的上一版本路径，禁止对站点根目录执行递归删除：

```bash
ls -ld /www/wwwroot/easvue.624work.club/releases/*
readlink -f /www/wwwroot/easvue.624work.club/current
```

确认目标后执行：

```bash
sudo ln -sfn /www/wwwroot/easvue.624work.club/releases/<previous> \
  /www/wwwroot/easvue.624work.club/current.next
sudo mv -Tf /www/wwwroot/easvue.624work.club/current.next \
  /www/wwwroot/easvue.624work.club/current
sudo systemctl restart easvue-api.service
curl --fail http://127.0.0.1:8787/api/health
```

如果新版本包含不向后兼容的数据迁移，应先停止写入，再从已验证备份恢复；当前迁移仅增量建表/约束，发布脚本不会删除业务数据。

## 备份与恢复验证

立即运行一次一致性备份：

```bash
sudo systemctl start easvue-backup.service
sudo journalctl -u easvue-backup.service -n 50 --no-pager
sudo -u easvue ls -lh /www/backup/easvue/
```

备份程序使用 SQLite 在线备份 API 写入临时文件，再以只读方式打开副本，执行 `integrity_check` 和用户表查询，成功后才原子改名。超过 14 天的匹配备份文件会被清理。

人工隔离恢复：停止 API，将目标备份复制为 `shared/data/easvue.restore.sqlite3`，以只读方式验证后再决定是否替换正式数据库。替换前必须另外保存当前数据库及 `-wal`、`-shm` 文件，并记录恢复点；未确认绝对路径时不得移动或删除。

## Nginx 与证书

宝塔站点配置以 `deploy/nginx-easvue.conf` 为模板；HTTP-01 验证目录固定为
`shared/acme-webroot/.well-known/acme-challenge/`。证书续签任务直接更新
`/www/server/panel/vhost/letsencrypt/easvue.624work.club/`，Nginx 不保存私钥副本。

检查证书、续签任务并重新加载：

```bash
sudo /www/server/nginx/sbin/nginx -t
sudo systemctl reload nginx 2>/dev/null || sudo /www/server/nginx/sbin/nginx -s reload
curl -I http://easvue.624work.club
curl -I https://easvue.624work.club/api/health
sudo openssl x509 \
  -in /www/server/panel/vhost/letsencrypt/easvue.624work.club/fullchain.pem \
  -noout -subject -issuer -dates -ext subjectAltName
sudo grep -Rhs 'acme_v2.py.*renew_v2' /var/spool/cron /www/server/cron
```

HTTP 应返回到 HTTPS 的 301；HTTPS 健康检查应为 200，SAN 必须包含
`easvue.624work.club`。禁止读取浏览器密码、Cookie、私钥或验证码。

## 故障处理

- API 502：检查 `easvue-api.service`、8787 回环监听和 `journalctl`，不要先重启 Nginx。
- 页面 404：确认 `current/dist/index.html` 和 SPA 的 `try_files ... /index.html`。
- 上传失败：确认 `shared/uploads` 属于 `easvue:easvue` 且 Nginx alias 指向相同目录。
- 数据库锁：检查是否出现 root 所有的数据库/WAL 文件；不要复制正在写入的 SQLite 主文件代替在线备份。
- 发布失败：保持 `current` 指向旧版本，修复新 release 后重新验证；不要覆盖旧 release。

每次故障处理记录版本、时间、触发命令、日志摘要、回滚点和最终验证结果。
