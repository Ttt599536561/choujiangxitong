# 🎰 老虎机抽奖系统

一个基于 React + Node.js 的老虎机抽奖系统，支持充值资格验证、自定义奖项配置、中奖率控制等功能。

## ✨ 功能特性

- 🎮 **老虎机动画** - 流畅的老虎机滚动效果，中间行高亮显示中奖结果
- 🎁 **自定义奖项** - 支持自定义奖项名称、图标、金额和中奖率
- 💰 **货币符号** - 支持自定义货币符号（¥、$、€、₹ 等）
- 🔐 **充值验证** - 支持充值资格模式和免费抽奖模式
- 👥 **用户管理** - 批量导入充值记录，CSV 格式支持
- 🎫 **兑换码** - 自动生成中奖兑换码，支持批量导出
- 📊 **数据统计** - 完整的抽奖记录和中奖统计
- 🚀 **Docker 部署** - 一键部署，开箱即用

## 🖼️ 界面预览

- 现代化深色主题设计
- 渐变金色配色方案
- 响应式布局，支持移动端
- 流畅的动画效果

## 🛠️ 技术栈

### 前端
- React 18
- Vite
- Framer Motion（动画）
- React Router
- Axios

### 后端
- Node.js + Express
- SQLite (sql.js)
- JWT 认证
- bcryptjs 加密

## 📦 快速开始

### 方式一：本地开发

**环境要求：**
- Node.js 18+
- npm 或 yarn

**安装步骤：**

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd lottery-system

# 2. 安装后端依赖
cd backend
npm install

# 3. 启动后端服务
npm start
# 后端运行在 http://localhost:3000

# 4. 安装前端依赖
cd ../frontend
npm install

# 5. 启动前端服务
npm run dev
# 前端运行在 http://localhost:5173
```

**默认管理员账号：**
- 账号：`admin`
- 密码：`admin123`

### 方式二：Docker 部署（推荐生产环境）

**1. 修改前端 API 地址**

编辑以下文件，将 API 地址改为相对路径：

`frontend/src/services/lotteryApi.js`
```javascript
const API_BASE_URL = '/api';
```

`frontend/src/services/adminApi.js`
```javascript
const API_BASE_URL = '/api';
```

**2. 配置环境变量**

```bash
cp .env.example .env
nano .env  # 修改 JWT_SECRET
```

**3. 启动服务**

```bash
docker-compose up -d
```

访问：`http://your-server-ip:8848`

详细部署文档：[DOCKER-DEPLOY.md](DOCKER-DEPLOY.md)

## 📖 使用说明

### 管理后台

访问 `http://localhost:5173/admin/login`（开发环境）或 `http://your-server-ip:8848/admin/login`（生产环境）

**1. 配置抽奖规则**

进入"配置"页面：
- 选择抽奖模式（充值资格 / 免费抽奖）
- 设置充值门槛
- 配置中奖人数上限
- 自定义货币符号
- 修改提示文案

**2. 设置奖项**

进入"奖项管理"：
- 添加/编辑奖项
- 设置奖项名称、图标、金额
- 配置中奖率（总和应为 100%）
- 至少需要一个"谢谢参与"奖项

**3. 导入用户充值记录**

进入"用户管理"，上传 CSV 文件：

```csv
email,recharge_amount
user1@example.com,100
user2@example.com,200
```

**4. 查看抽奖记录**

进入"记录"查看所有用户的抽奖结果。

### 前台抽奖

用户访问首页，输入邮箱即可参与抽奖：
- 每个邮箱只能抽奖一次
- 充值资格模式下需满足充值门槛
- 中奖后自动生成兑换码

## 🗂️ 项目结构

```
lottery-system/
├── backend/                 # 后端服务
│   ├── config/             # 配置文件（数据库、JWT）
│   ├── routes/             # API 路由
│   ├── middleware/         # 中间件（认证）
│   ├── database/           # 数据库文件
│   ├── uploads/            # 上传文件目录
│   ├── app.js              # 应用入口
│   ├── Dockerfile          # 后端 Docker 配置
│   └── package.json
│
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/    # 组件（老虎机、弹窗等）
│   │   ├── pages/         # 页面（首页、管理后台）
│   │   ├── services/      # API 服务
│   │   └── main.jsx       # 应用入口
│   ├── Dockerfile         # 前端 Docker 配置
│   ├── nginx.conf         # Nginx 配置
│   └── package.json
│
├── docker-compose.yml     # Docker Compose 配置
├── .env.example           # 环境变量模板
├── .gitignore
├── deploy-guide.md        # 传统部署指南
└── DOCKER-DEPLOY.md       # Docker 部署指南
```

## ⚙️ 环境变量

创建 `.env` 文件：

```env
JWT_SECRET=your-super-secret-jwt-key-change-this
```

生成安全的密钥：

```bash
openssl rand -base64 32
```

## 🔒 安全建议

1. **修改默认密码** - 首次部署后立即修改管理员密码
2. **使用强密钥** - 生成随机的 JWT_SECRET
3. **启用 HTTPS** - 生产环境使用 SSL 证书
4. **配置防火墙** - 限制不必要的端口访问
5. **定期备份** - 备份 `backend/database/lottery.db` 文件

## 📝 常见问题

### 1. 前端无法访问后端 API

检查 API 地址配置：
- 开发环境：`http://localhost:3000/api`
- Docker 部署：`/api`（相对路径）

### 2. 数据库权限错误

```bash
chmod 755 backend/database
chmod 644 backend/database/lottery.db
```

### 3. 端口被占用

修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8848:80"  # 改成其他端口
```

### 4. Docker 构建失败

确保已修改前端 API 地址为相对路径 `/api`。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License

## 📞 联系方式

如有问题或建议，请提交 Issue。

---

⭐ 如果这个项目对你有帮助，欢迎 Star！
