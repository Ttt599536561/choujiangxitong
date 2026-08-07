#!/bin/bash

# 老虎机抽奖系统 - Docker 部署一键更新脚本
# 使用方法: bash update.sh

echo "========================================"
echo "  🎰 老虎机抽奖系统 - 更新脚本"
echo "========================================"
echo ""

# 检查是否在项目根目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误: 请在项目根目录下运行此脚本"
    exit 1
fi

# 1. 拉取最新代码
echo "📥 [1/5] 拉取最新代码..."
git pull origin master
if [ $? -ne 0 ]; then
    echo "❌ 代码拉取失败，请检查网络或 Git 配置"
    exit 1
fi
echo "✅ 代码更新成功"
echo ""

# 2. 备份数据库（可选）
echo "💾 [2/5] 备份数据库..."
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
if [ -f "./backend/database/lottery.db" ]; then
    cp ./backend/database/lottery.db "$BACKUP_DIR/lottery_$TIMESTAMP.db"
    echo "✅ 数据库已备份到: $BACKUP_DIR/lottery_$TIMESTAMP.db"
else
    echo "⚠️  未找到数据库文件，跳过备份"
fi
echo ""

# 3. 停止旧容器
echo "🛑 [3/5] 停止旧容器..."
docker-compose down
echo "✅ 旧容器已停止"
echo ""

# 4. 重新构建并启动
echo "🔨 [4/5] 重新构建镜像并启动服务..."
docker-compose up -d --build
if [ $? -ne 0 ]; then
    echo "❌ 容器启动失败"
    exit 1
fi
echo "✅ 服务已启动"
echo ""

# 5. 检查服务状态
echo "🔍 [5/5] 检查服务状态..."
sleep 3
docker-compose ps
echo ""

# 6. 显示日志
echo "📋 最近日志:"
echo "========================================"
docker-compose logs --tail=20
echo "========================================"
echo ""

echo "✨ 更新完成！"
echo ""
echo "📊 查看实时日志: docker-compose logs -f"
echo "🔄 重启服务: docker-compose restart"
echo "⏹️  停止服务: docker-compose down"
echo ""
