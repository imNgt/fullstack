# Day 15：项目部署 + Docker

### 📚 Java 补充（30 分钟）

#### 1. Maven 打包

```bash
# 打包（跳过测试）
mvn clean package -DskipTests

# 运行
java -jar target/myapp.jar

# 指定配置文件
java -jar target/myapp.jar --spring.profiles.active=prod

# 指定 JVM 参数
java -Xms256m -Xmx512m -jar target/myapp.jar

# 后台运行（Linux）
nohup java -jar target/myapp.jar > /dev/null 2>&1 &
```

#### 2. 配置文件分离

```yaml
# application.yml（公共配置）
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

# application-dev.yml（开发环境）
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/dev_db

# application-prod.yml（生产环境）
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:3306/prod_db
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：Dockerfile

```dockerfile
# 使用官方 Java 17 基础镜像
FROM eclipse-temurin:17-jre-jammy

# 作者信息
LABEL maintainer="ngtao@example.com"

# 创建工作目录
WORKDIR /app

# 复制 jar 包到容器
COPY target/myapp.jar /app/myapp.jar

# 设置环境变量
ENV JAVA_OPTS="-Xms256m -Xmx512m"
ENV SPRING_PROFILES_ACTIVE="prod"

# 暴露端口
EXPOSE 8080

# 启动命令
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/myapp.jar"]
```

#### 任务 2：docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: myapp
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USERNAME=root
      - DB_PASSWORD=root123
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app-network

  mysql:
    image: mysql:8.0
    container_name: mysql
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=root123
      - MYSQL_DATABASE=myapp_db
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network

volumes:
  mysql_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

#### 任务 3：部署脚本

```bash
#!/bin/bash
# deploy.sh

APP_NAME="myapp"
APP_DIR="/opt/app/$APP_NAME"
JAR_FILE="target/$APP_NAME.jar"

# 停止旧进程
echo "Stopping existing application..."
pkill -f "$APP_NAME.jar" || true

# 等待进程结束
sleep 3

# 创建目录
mkdir -p "$APP_DIR/logs"

# 备份旧版本
if [ -f "$APP_DIR/$APP_NAME.jar" ]; then
    cp "$APP_DIR/$APP_NAME.jar" "$APP_DIR/backup-$APP_NAME-$(date +%Y%m%d%H%M%S).jar"
fi

# 复制新 jar
cp "$JAR_FILE" "$APP_DIR/"

# 启动应用
echo "Starting $APP_NAME..."
cd "$APP_DIR"
nohup java -Xms256m -Xmx512m -jar "$APP_NAME.jar" --spring.profiles.active=prod > logs/startup.log 2>&1 &

# 等待启动
sleep 10

# 检查状态
if pgrep -f "$APP_NAME.jar" > /dev/null; then
    echo "$APP_NAME started successfully!"
    echo "PID: $(pgrep -f $APP_NAME.jar)"
else
    echo "Failed to start $APP_NAME. Check logs for details."
    cat logs/startup.log
fi
```

#### 任务 4：Nginx 反向代理

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源
    location /static/ {
        root /var/www/html;
        expires 30d;
    }

    # 接口文档
    location /doc.html {
        proxy_pass http://localhost:8080/doc.html;
    }

    # HTTPS 重定向
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }
}
```

---

### 📝 今日笔记（5 行）

1. **Dockerfile**：定义容器构建步骤，从基础镜像到启动命令
2. **docker-compose**：管理多容器服务，自动处理网络和依赖
3. **环境变量**：生产环境密码通过环境变量注入，不写死在配置文件
4. **Nginx**：反向代理，处理静态资源和 SSL
5. **部署脚本**：自动化部署流程，包含备份和健康检查
