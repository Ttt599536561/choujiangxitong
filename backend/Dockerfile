FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 创建数据库目录
RUN mkdir -p database

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "app.js"]
