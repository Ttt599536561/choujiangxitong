# Docker 部署指南

## 快速开始（3 步部署）

### 第 1 步：修改前端 API 地址

**重要！** 在构建 Docker 镜像之前，必须先修改前端的 API 地址。

编辑以下两个文件：

**文件：`frontend/src/services/lotteryApi.js`**
```javascript
// 本地开发（注释掉）
// const API_BASE_URL = 'http://localhost:3000/api';

// Docker 部署（使用相对路径，让 Nginx 代理）
const API_BASE_URL = '/api';
```

**文件：`frontend/src/services/adminApi.js`**
```javascript
// 同样改成相对路径
const API_BASE_URL = '/api';
```

> 💡 使用相对路径 `/api` 后，Nginx 会自动代理到后端容器，无需暴露后端端口。

---

### 第 2 步：配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，修改 JWT_SECRET
nano .env
```

生成安全的 JWT_SECRET：
```bash
# Linux/Mac
openssl rand -base64 32

# 或者使用在线工具
# https://www.random.org/strings/
```

---

### 第 3 步：启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps
```

访问：
- 前端页面：http://your-server-ip
- 管理后台：http://your-server-ip/admin/login
  - 账号：`admin`
  - 密码：`admin123`

---

## 常用命令

### 启动服务
```bash
docker-compose up -d
```

### 停止服务
```bash
docker-compose down
```

### 查看日志
```bash
# 查看所有日志
docker-compose logs -f

# 只看后端日志
docker-compose logs -f backend

# 只看前端日志
docker-compose logs -f frontend
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 只重启后端
docker-compose restart backend

# 只重启前端
docker-compose restart frontend
```

### 重新构建镜像
```bash
# 修改代码后，重新构建并启动
docker-compose up -d --build

# 只重新构建后端
docker-compose build backend
docker-compose up -d backend

# 只重新构建前端
docker-compose build frontend
docker-compose up -d frontend
```

### 查看服务状态
```bash
docker-compose ps
```

### 进入容器
```bash
# 进入后端容器
docker-compose exec backend sh

# 进入前端容器
docker-compose exec frontend sh
```

### 清理所有容器和镜像
```bash
# 停止并删除容器
docker-compose down

# 删除所有相关镜像
docker-compose down --rmi all

# 删除所有数据（危险！会删除数据库）
docker-compose down -v
```

---

## 数据持久化

数据库文件保存在：
```
./backend/database/lottery.db
```

这个目录已通过 Docker volume 挂载，数据不会因为容器重启而丢失。

**备份数据库：**
```bash
# 复制数据库文件到备份目录
cp backend/database/lottery.db backup/lottery_$(date +%Y%m%d_%H%M%S).db
```

**恢复数据库：**
```bash
# 停止服务
docker-compose down

# 恢复数据库文件
cp backup/lottery_20231201_120000.db backend/database/lottery.db

# 启动服务
docker-compose up -d
```

---

## 生产环境部署

### 1. 使用自定义域名

如果有域名，需要额外配置：

**方法 A：修改 Nginx 配置**

编辑 `frontend/nginx.conf`，修改 `server_name`：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 改成你的域名
    # ... 其他配置
}
```

**方法 B：使用外部 Nginx 反向代理**

在服务器上配置一个外部 Nginx：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. 配置 HTTPS

#### 方法 A：使用 Let's Encrypt（推荐）

在 `docker-compose.yml` 中添加 Certbot 服务：

```yaml
services:
  # ... 现有服务

  certbot:
    image: certbot/certbot
    container_name: lottery-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
```

修改 `frontend/nginx.conf` 支持 HTTPS：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... 其他配置
}
```

#### 方法 B：使用 Cloudflare（最简单）

1. 将域名 DNS 托管到 Cloudflare
2. 开启 Cloudflare 的 SSL/TLS 加密（Flexible 模式）
3. Docker 容器只需监听 80 端口，Cloudflare 自动处理 HTTPS

### 3. 修改暴露端口

如果 80 端口被占用，修改 `docker-compose.yml`：
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 改成其他端口
```

访问地址变为：`http://your-server-ip:8080`

### 4. 安全加固

**a. 不暴露后端端口**

在 `docker-compose.yml` 中注释掉后端的端口映射：
```yaml
services:
  backend:
    # ports:
    #   - "3000:3000"  # 注释掉，不暴露到外网
```

**b. 配置防火墙**
```bash
# 只开放 80 和 443 端口
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

**c. 定期更新**
```bash
# 拉取最新镜像
docker-compose pull

# 重新构建
docker-compose up -d --build
```

---

## 监控和维护

### 查看资源占用
```bash
docker stats
```

### 自动重启策略

`docker-compose.yml` 已配置 `restart: unless-stopped`，容器会在以下情况自动重启：
- 容器崩溃
- 服务器重启
- Docker 守护进程重启

### 日志管理

限制日志大小，编辑 `/etc/docker/daemon.json`：
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

重启 Docker：
```bash
sudo systemctl restart docker
```

---

## 故障排查

### 1. 容器启动失败
```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend

# 检查容器状态
docker-compose ps
```

### 2. 前端无法访问后端 API
```bash
# 进入前端容器测试
docker-compose exec frontend sh
wget http://backend:3000/api/config

# 检查网络连接
docker network ls
docker network inspect lottery-system_lottery-network
```

### 3. 数据库权限问题
```bash
# 检查数据库文件权限
ls -la backend/database/

# 修复权限
chmod 755 backend/database
chmod 644 backend/database/lottery.db
```

### 4. 端口被占用
```bash
# 查看端口占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3000

# 停止占用端口的服务
sudo kill -9 <PID>
```

---

## 性能优化

### 1. 启用 Gzip 压缩

在 `frontend/nginx.conf` 中添加：
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. 配置 Redis 缓存（可选）

在 `docker-compose.yml` 中添加：
```yaml
services:
  redis:
    image: redis:alpine
    container_name: lottery-redis
    restart: unless-stopped
    networks:
      - lottery-network
```

修改后端代码集成 Redis。

### 3. 使用 CDN

将静态资源（图片、字体）上传到 CDN，减轻服务器压力。

---

## 多服务器部署（高可用）

如果需要多服务器部署，可以使用：
- Docker Swarm（简单）
- Kubernetes（复杂但强大）

需要的话我可以提供配置。

---

## 卸载

```bash
# 停止并删除所有容器
docker-compose down

# 删除镜像
docker-compose down --rmi all

# 删除数据（危险！）
docker-compose down -v

# 手动删除项目文件
rm -rf /path/to/lottery-system
```

---

需要其他帮助吗？例如：
- Kubernetes 部署配置
- CI/CD 自动部署
- 监控告警系统
- 备份恢复方案
