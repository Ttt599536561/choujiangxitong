# Docker 部署更新指南

## 快速更新（推荐）

使用一键更新脚本：

```bash
# 进入项目目录
cd choujiangxitong

# 运行更新脚本
bash update.sh
```

脚本会自动完成以下操作：
1. ✅ 拉取最新代码
2. 💾 备份数据库（保存到 `backups/` 目录）
3. 🛑 停止旧容器
4. 🔨 重新构建镜像
5. 🚀 启动新版本
6. 🔍 检查服务状态

---

## 手动更新

如果更喜欢手动操作：

```bash
# 1. 进入项目目录
cd choujiangxitong

# 2. 拉取最新代码
git pull origin master

# 3. 重新构建并启动
docker-compose down
docker-compose up -d --build

# 4. 查看日志
docker-compose logs -f
```

---

## 零停机更新（高级）

适用于生产环境，避免服务中断：

```bash
# 1. 拉取代码
git pull origin master

# 2. 构建新镜像（不停止服务）
docker-compose build

# 3. 逐个重启容器
docker-compose up -d --no-deps --build frontend
sleep 5
docker-compose up -d --no-deps --build backend

# 4. 验证
docker-compose ps
```

---

## 回滚到之前版本

如果更新后出现问题：

```bash
# 1. 查看备份的数据库
ls -lh backups/

# 2. 回滚代码
git log --oneline  # 查看提交历史
git reset --hard <commit-hash>  # 回滚到指定版本

# 3. 重新部署
docker-compose down
docker-compose up -d --build

# 4. 如需恢复数据库（谨慎操作）
cp backups/lottery_YYYYMMDD_HHMMSS.db backend/database/lottery.db
docker-compose restart backend
```

---

## 常见问题

### 1. 端口被占用

```bash
# 修改 docker-compose.yml 中的端口
ports:
  - "8848:80"  # 改成其他端口
```

### 2. 磁盘空间不足

```bash
# 清理未使用的 Docker 资源
docker system prune -a

# 查看磁盘使用
df -h
```

### 3. 数据库文件损坏

```bash
# 停止服务
docker-compose down

# 恢复备份
cp backups/lottery_YYYYMMDD_HHMMSS.db backend/database/lottery.db

# 重启服务
docker-compose up -d
```

### 4. 查看容器日志

```bash
# 查看所有日志
docker-compose logs -f

# 只查看后端日志
docker-compose logs -f backend

# 只查看前端日志
docker-compose logs -f frontend
```

---

## 自动化更新（可选）

设置定时任务自动拉取更新：

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨3点自动更新）
0 3 * * * cd /path/to/choujiangxitong && bash update.sh >> update.log 2>&1
```

⚠️ **注意：** 生产环境不建议自动更新，应该人工审核后再部署。

---

## 监控服务状态

```bash
# 查看容器状态
docker-compose ps

# 查看资源使用
docker stats

# 实时监控日志
docker-compose logs -f | grep -i error
```
