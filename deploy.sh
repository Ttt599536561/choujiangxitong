#!/bin/bash

echo "🚀 抽奖系统 - 快速部署脚本"
echo "================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 16+"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo "✅ npm 版本: $(npm -v)"
echo ""

# 安装后端依赖
echo "📦 [1/4] 安装后端依赖..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ 后端依赖安装失败"
    exit 1
fi
cd ..

# 安装前端依赖
echo ""
echo "📦 [2/4] 安装前端依赖..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ 前端依赖安装失败"
    exit 1
fi
cd ..

# 初始化数据库
echo ""
echo "🔧 [3/4] 初始化数据库..."
cd backend
node -e "const db = require('./config/database'); db.initDatabase(); console.log('数据库初始化完成');"
if [ $? -ne 0 ]; then
    echo "❌ 数据库初始化失败"
    exit 1
fi
cd ..

echo ""
echo "✅ [4/4] 部署完成！"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 安装成功！现在可以启动服务："
echo ""
echo "📍 启动后端（在 backend 目录）："
echo "   cd backend && npm start"
echo ""
echo "📍 启动前端（在 frontend 目录，新开终端）："
echo "   cd frontend && npm run dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 访问地址："
echo "   前台抽奖: http://localhost:5173"
echo "   后台管理: http://localhost:5173/admin/login"
echo ""
echo "🔑 默认管理员账号："
echo "   用户名: admin"
echo "   密码: admin123"
echo ""
echo "⚠️  请在生产环境立即修改默认密码！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
