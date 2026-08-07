# 抽奖系统部署指南

## 部署方案选择

### 方案一：传统服务器部署（推荐新手）

适用于：Linux 服务器（Ubuntu/CentOS）、宝塔面板等

#### 1. 服务器环境准备

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2（进程守护）
sudo npm install -g pm2

# 安装 Nginx（可选，用于反向代理）
sudo apt-get install nginx
```

#### 2. 上传代码到服务器

```bash
# 方法 A：使用 Git
cd /var/www
git clone <your-repo-url> lottery-system
cd lottery-system

# 方法 B：使用 FTP/SFTP
# 将整个项目文件夹上传到 /var/www/lottery-system
```

#### 3. 后端部署

```bash
cd /var/www/lottery-system/backend

# 安装依赖
npm install --production

# 创建环境变量文件
cat > .env << EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
EOF

# 使用 PM2 启动
pm2 start app.js --name lottery-backend

# 设置开机自启
pm2 startup
pm2 save
```

#### 4. 前端部署

```bash
cd /var/www/lottery-system/frontend

# 安装依赖
npm install

# 修改 API 地址（重要！）
# 编辑 src/services/lotteryApi.js 和 src/services/adminApi.js
# 将 baseURL 改为你的服务器地址，例如：
# const API_BASE_URL = 'https://your-domain.com/api';

# 构建生产版本
npm run build
# 构建完成后，dist 文件夹包含所有静态文件
```

#### 5. Nginx 配置（推荐）

创建 Nginx 配置文件 `/etc/nginx/sites-available/lottery`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 改成你的域名或 IP

    # 前端静态文件
    location / {
        root /var/www/lottery-system/frontend/dist;
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
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/lottery /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. 配置 HTTPS（可选但推荐）

```bash
# 使用 Let's Encrypt 免费证书
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### 方案二：宝塔面板部署（最简单）

#### 1. 安装宝塔面板

```bash
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
```

#### 2. 在宝塔面板中操作

1. **安装软件**：
   - Nginx 1.22+
   - PM2 管理器

2. **上传项目**：
   - 在"文件"中上传项目压缩包到 `/www/wwwroot/`
   - 解压

3. **后端部署**：
   - 打开 PM2 管理器
   - 添加项目：
     - 项目路径：`/www/wwwroot/lottery-system/backend`
     - 启动文件：`app.js`
     - 项目名称：`lottery-backend`
   - 点击启动

4. **前端构建**：
   - 在终端中执行：
     ```bash
     cd /www/wwwroot/lottery-system/frontend
     npm install
     npm run build
     ```

5. **添加网站**：
   - 在"网站"中添加站点
   - 网站目录：`/www/wwwroot/lottery-system/frontend/dist`
   - 在"反向代理"中添加：
     - 代理名称：`api`
     - 目标 URL：`http://127.0.0.1:3000`
     - 发送域名：`$host`
     - 代理目录：`/api`

---

### 方案三：Docker 部署（推荐进阶用户）

我可以为你生成 Docker 配置文件，一键部署整个系统。需要吗？

---

## 部署前的重要修改

### 1. 修改前端 API 地址

**文件：`frontend/src/services/lotteryApi.js`**

```javascript
// 本地开发
// const API_BASE_URL = 'http://localhost:3000/api';

// 生产环境（改成你的实际域名或 IP）
const API_BASE_URL = 'https://your-domain.com/api';
// 或者使用 IP: const API_BASE_URL = 'http://123.456.789.0/api';
```

**文件：`frontend/src/services/adminApi.js`**

```javascript
// 同样修改这个文件的 API_BASE_URL
const API_BASE_URL = 'https://your-domain.com/api';
```

### 2. 修改后端配置（可选）

**创建文件：`backend/.env`**

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=请改成一个复杂的随机字符串
```

### 3. 修改管理员密码

首次部署后，立即登录管理后台修改默认密码：
- 默认账号：`admin`
- 默认密码：`admin123`

---

## 部署后检查清单

- [ ] 后端服务正常运行（访问 `http://your-domain.com/api/config`）
- [ ] 前端页面能正常打开
- [ ] 管理后台能登录
- [ ] 抽奖功能正常
- [ ] 数据库文件有写入权限（`backend/database/lottery.db`）
- [ ] 已修改默认管理员密码
- [ ] 已配置防火墙（开放 80、443 端口）

---

## 常见问题

### 1. API 请求 404
- 检查 Nginx 反向代理配置
- 确认后端服务正在运行：`pm2 list`

### 2. 前端页面空白
- 检查浏览器控制台是否有 API 地址错误
- 确认前端构建时修改了正确的 API 地址

### 3. 数据库文件权限错误
```bash
sudo chown -R www-data:www-data /var/www/lottery-system/backend/database
sudo chmod 755 /var/www/lottery-system/backend/database
sudo chmod 644 /var/www/lottery-system/backend/database/lottery.db
```

### 4. PM2 进程崩溃
```bash
# 查看日志
pm2 logs lottery-backend

# 重启服务
pm2 restart lottery-backend
```

---

## 性能优化建议

1. **启用 Gzip 压缩**（Nginx）
2. **配置 CDN**（加速静态资源）
3. **数据库备份**（定时备份 `lottery.db`）
4. **日志管理**（PM2 日志轮转）

---

需要我生成 Docker 部署方案或其他部署方式的详细配置吗？
