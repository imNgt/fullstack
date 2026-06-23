# Day 20：Docker 容器化 + 微服务部署 + CI/CD

### 📚 Java 补充（30 分钟）

#### 1. Docker 基础概念

```
┌──────────────────────────────────────────────────────────────┐
│                    Docker 架构                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │   Client     │────>│   Docker    │────>│   Host       │ │
│  │  (docker)    │     │   Daemon    │     │   Machine    │ │
│  └──────────────┘     └──────────────┘     └──────────────┘ │
│                                                      │      │
│                                                      │      │
│                                        ┌─────────────┴─────┐│
│                                        │                 ││
│                                        ▼                 ▼│
│                                  ┌─────────┐      ┌─────────┐│
│                                  │  Image  │─────>│  Container││
│                                  │ (镜像)  │      │  (容器)  ││
│                                  └─────────┘      └─────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘

核心概念：
- Image（镜像）：只读模板，包含运行应用所需的所有依赖
- Container（容器）：镜像的运行实例
- Dockerfile：定义如何构建镜像的脚本
- Docker Compose：编排多个容器的工具
```

#### 2. Dockerfile 示例

```dockerfile
# 使用官方 Java 基础镜像
FROM openjdk:21-jdk-slim

# 设置工作目录
WORKDIR /app

# 复制 Maven 构建产物
COPY target/demo-app.jar app.jar

# 暴露端口
EXPOSE 8080

# 运行应用
CMD ["java", "-jar", "app.jar"]
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：Dockerfile 最佳实践

**多阶段构建：**

```dockerfile
# 第一阶段：构建
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .
COPY src ./src

# 构建项目（跳过测试）
RUN mvn clean package -DskipTests

# 第二阶段：运行
FROM openjdk:21-jdk-slim

WORKDIR /app

# 从构建阶段复制 jar 文件
COPY --from=builder /app/target/*.jar app.jar

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非 root 用户
RUN useradd -m appuser
USER appuser

# 暴露端口
EXPOSE 8080

# 运行应用
ENTRYPOINT ["java", "-jar", "-Xms256m", "-Xmx512m", "app.jar"]
```

#### 任务 2：Docker Compose 编排

**docker-compose.yml：**

```yaml
version: '3.8'

services:
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: mysql-db
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: example_db
      MYSQL_USER: app
      MYSQL_PASSWORD: password
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Redis
  redis:
    image: redis:7.0
    container_name: redis-cache
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # 应用服务
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: spring-boot-app
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/example_db?useSSL=false&serverTimezone=Asia/Shanghai
      SPRING_DATASOURCE_USERNAME: app
      SPRING_DATASOURCE_PASSWORD: password
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

volumes:
  mysql-data:
  redis-data:
```

#### 任务 3：Docker 网络配置

```yaml
version: '3.8'

networks:
  # 前端网络
  frontend:
    driver: bridge
  
  # 后端网络
  backend:
    driver: bridge
  
  # 数据库网络（隔离）
  database:
    driver: bridge

services:
  nginx:
    image: nginx:alpine
    networks:
      - frontend
      - backend
  
  app:
    build: .
    networks:
      - backend
      - database
  
  mysql:
    image: mysql:8.0
    networks:
      - database
```

#### 任务 4：CI/CD 流水线（GitHub Actions）

**.github/workflows/ci-cd.yml：**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven
      
      - name: Build with Maven
        run: mvn clean package -DskipTests
      
      - name: Run tests
        run: mvn test
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-jar
          path: target/*.jar

  docker:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: app-jar
          path: target
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_TOKEN }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_HUB_USERNAME }}/demo-app:${{ github.sha }}
```

#### 任务 5：Kubernetes 部署

**deployment.yaml：**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-app
  labels:
    app: demo-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: demo-app
  template:
    metadata:
      labels:
        app: demo-app
    spec:
      containers:
      - name: demo-app
        image: your-docker-username/demo-app:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: SPRING_DATASOURCE_URL
          value: jdbc:mysql://mysql-service:3306/example_db
        - name: SPRING_DATASOURCE_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: username
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
```

**service.yaml：**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: demo-app-service
spec:
  selector:
    app: demo-app
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

#### 任务 6：健康检查与监控

**application.yml 配置：**

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus
  endpoint:
    health:
      show-details: always
  metrics:
    export:
      prometheus:
        enabled: true
```

**Docker healthcheck：**

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
```

---

### 📝 今日笔记（5 行）

1. **Docker**：容器化平台，通过镜像打包应用及其依赖，实现环境一致性
2. **Dockerfile**：定义镜像构建步骤的脚本，支持多阶段构建减小镜像体积
3. **Docker Compose**：使用 YAML 文件编排多个容器，简化本地开发环境搭建
4. **CI/CD**：持续集成持续部署，自动化构建、测试、部署流程
5. **Kubernetes**：容器编排平台，支持自动扩缩容、服务发现、负载均衡等