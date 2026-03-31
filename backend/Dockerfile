# 1. 使用轻量级 Node.js 镜像
FROM node:20-slim

# 2. 安装 Prisma 运行所需的系统库（openssl 等）
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 3. 仅复制依赖配置文件，利用 Docker 缓存层
COPY package*.json ./
RUN npm ci

# 4. 复制所有源代码
COPY . .

# 5. 【构建阶段】生成 Prisma Client 
# 这一步不联网，只是生成本地代码，所以可以放在 RUN 里
RUN npx prisma generate

# 6. 【构建阶段】编译项目
RUN npm run build

# 7. 声明容器内部端口（需与云托管控制台设置的“容器端口”一致）
EXPOSE 3000

# 8. 【运行阶段核心收口】
# 使用 sh -c 确保容器启动时先跑数据库迁移，成功后再启动服务器
# 此时容器已在 VPC 内，可以正常访问 10.8.108.220
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]