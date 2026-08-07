# 部署指南

## 📋 部署前准备

### 系统要求
- Node.js 16+ 
- npm 或 yarn
- 至少 512MB 内存
- 至少 1GB 磁盘空间

### 需要准备的信息
- 服务器 IP 地址
- 域名（可选）
- SSL 证书（如果使用 HTTPS）

## 🚀 部署方式

### 方式一：单服务器部署（推荐用于小型项目）

#### 1. 克隆代码到服务器

```bash
# SSH 登录服务器
ssh user@your-server-ip

# 克隆或上传代码
git clone <your-repo-url>
# 或使用 scp 上传
```

#### 2. 安装依赖

```bash
# 后端
cd lottery-system/backend
npm install --production

# 前端
cd ../frontend
npm install
```

#### 3. 配置环境变量

```bash
cd backend
cp .env.example .env
nano .env  # 或使用 vi 编辑
```

修改以下配置：
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=<生成一个复杂的随机字符串>
DB_PATH=./database/lottery.db
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=<设置强密码>
FRONTEND_URL=http://your-domain.com
```

**生成安全的 JWT_SECRET：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. 初始化数据库

```bash
cd backend
npm run init-db
```

#### 5. 构建前端

```bash
cd frontend
npm run build
```

#### 6. 使用 PM2 启动后端（保持后台运行）

```bash
# 安装 PM2
npm install -g pm2

# 启动后端
cd backend
pm2 start src/app.js --name lottery-backend

# 设置开机自启
pm2 startup
pm2 save
```

#### 7. 配置 Nginx 反向代理

安装 Nginx：
```bash
sudo apt update
sudo apt install nginx
```

创建配置文件：
```bash
sudo nano /etc/nginx/sites-available/lottery
```

配置内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    # 前端静态文件
    root /path/to/lottery-system/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/lottery /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl restart nginx
```

#### 8. 配置 HTTPS（可选但推荐）

使用 Let's Encrypt 免费证书：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 方式二：Docker 部署

#### 1. 创建 Dockerfile（后端）

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

#### 2. 创建 Dockerfile（前端）

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./backend/database:/app/database
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

#### 4. 启动服务

```bash
docker-compose up -d
```

## 🔒 安全加固

### 1. 修改默认管理员密码

首次部署后立即通过管理后台修改默认密码。

### 2. 配置防火墙

```bash
# 只开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

### 3. 定期备份数据库

创建备份脚本：
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_PATH="/path/to/lottery-system/backend/database/lottery.db"

cp $DB_PATH $BACKUP_DIR/lottery_backup_$DATE.db

# 删除 7 天前的备份
find $BACKUP_DIR -name "lottery_backup_*.db" -mtime +7 -delete
```

添加到 crontab（每天凌晨 2 点备份）：
```bash
crontab -e
# 添加：
0 2 * * * /path/to/backup.sh
```

### 4. 设置日志轮转

创建 `/etc/logrotate.d/lottery`：
```
/path/to/lottery-system/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

## 📊 监控和维护

### 查看 PM2 日志

```bash
pm2 logs lottery-backend
pm2 monit  # 实时监控
```

### 查看 Nginx 日志

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 重启服务

```bash
# 重启后端
pm2 restart lottery-backend

# 重启 Nginx
sudo systemctl restart nginx
```

### 更新代码

```bash
# 拉取最新代码
git pull

# 更新后端
cd backend
npm install
pm2 restart lottery-backend

# 更新前端
cd ../frontend
npm install
npm run build
```

## 🌐 域名配置

### 配置 DNS 记录

在域名服务商控制台添加 A 记录：
```
类型: A
主机记录: @（或 www）
记录值: 你的服务器IP
TTL: 600
```

等待 DNS 生效（通常 10 分钟到 2 小时）。

## ⚡ 性能优化

### 1. 启用 Gzip 压缩

已在 Nginx 配置中包含。

### 2. 配置 CDN（可选）

将前端静态资源托管到 CDN，提升访问速度。

### 3. 数据库优化

SQLite 已经针对读取优化，无需额外配置。如果用户量大，考虑迁移到 PostgreSQL 或 MySQL。

## 🐛 常见问题

### 问题1：端口被占用

```bash
# 查看占用端口的进程
sudo lsof -i :3000
# 杀死进程
sudo kill -9 <PID>
```

### 问题2：Nginx 403 错误

检查文件权限：
```bash
sudo chmod -R 755 /path/to/frontend/dist
```

### 问题3：数据库锁定

重启后端服务：
```bash
pm2 restart lottery-backend
```

## 📞 技术支持

如遇到部署问题，请检查：
1. Node.js 版本是否 >= 16
2. 端口是否被占用
3. 防火墙是否正确配置
4. 日志文件中的错误信息

---

**部署成功后记得测试所有功能！🎉**
