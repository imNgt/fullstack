# Day 15：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. Maven 打包

**Maven 是 Java 的项目管理与构建工具：**

```bash
# 打包（跳过测试）
mvn clean package -DskipTests

# 打包（运行测试）
mvn clean package

# 运行
java -jar target/myapp.jar

# 指定配置文件
java -jar target/myapp.jar --spring.profiles.active=prod

# 指定 JVM 参数
java -Xms256m -Xmx512m -jar target/myapp.jar

# 设置系统属性
java -Dspring.config.location=file:/config/application.yml -jar target/myapp.jar

# 后台运行（Linux）
nohup java -jar target/myapp.jar > /dev/null 2>&1 &

# 查看运行中的 Java 进程
jps
ps aux | grep java
```

**Maven 生命周期：**

| 阶段 | 说明 |
|-----|------|
| `clean` | 清理构建产物 |
| `validate` | 验证项目结构 |
| `compile` | 编译主代码 |
| `test` | 运行测试 |
| `package` | 打包 |
| `install` | 安装到本地仓库 |
| `deploy` | 部署到远程仓库 |

**pom.xml 常用配置：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>
    
    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <packaging>jar</packaging>
    
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 2. 配置文件分离

**Spring Boot 支持多环境配置：**

```yaml
# application.yml（公共配置）
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

# application-dev.yml（开发环境）
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/dev_db
    username: root
    password: password

# application-prod.yml（生产环境）
server:
  port: 80

spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:3306/prod_db
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

logging:
  level:
    root: INFO
```

**环境变量注入：**

```bash
# Linux/Mac 环境变量
export DB_HOST=mysql.example.com
export DB_USERNAME=prod_user
export DB_PASSWORD=secret123

# Windows 环境变量（PowerShell）
$env:DB_HOST="mysql.example.com"
$env:DB_USERNAME="prod_user"
$env:DB_PASSWORD="secret123"
```

**命令行参数覆盖：**

```bash
java -jar myapp.jar \
  --spring.profiles.active=prod \
  --server.port=8080 \
  --spring.datasource.url=jdbc:mysql://localhost:3306/mydb
```

#### 3. JVM 调优

**JVM 内存配置：**

```bash
# 堆内存
java -Xms256m -Xmx512m -jar myapp.jar

# 新生代和老年代
java -Xms512m -Xmx1024m -Xmn256m -jar myapp.jar

# 堆外内存
java -XX:MaxDirectMemorySize=256m -jar myapp.jar

# GC 日志
java -XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xloggc:gc.log -jar myapp.jar

# GC 算法选择
java -XX:+UseG1GC -jar myapp.jar  # G1 GC（Java 9+ 默认）
java -XX:+UseParallelGC -jar myapp.jar  # 并行 GC
java -XX:+UseConcMarkSweepGC -jar myapp.jar  # CMS GC（已废弃）
```

**常见 GC 参数：**

| 参数 | 说明 |
|-----|------|
| `-Xms` | 初始堆大小 |
| `-Xmx` | 最大堆大小 |
| `-Xmn` | 新生代大小 |
| `-XX:MetaspaceSize` | 元空间初始大小 |
| `-XX:MaxMetaspaceSize` | 元空间最大大小 |
| `-XX:+UseG1GC` | 使用 G1 GC |
| `-XX:MaxGCPauseMillis` | 最大 GC 停顿时间目标 |

#### 4. Docker 基础

**Docker 容器化部署：**

```dockerfile
# Dockerfile
FROM eclipse-temurin:17-jre-jammy

LABEL maintainer="ngtao@example.com"

WORKDIR /app

COPY target/myapp.jar /app/myapp.jar

ENV JAVA_OPTS="-Xms256m -Xmx512m"
ENV SPRING_PROFILES_ACTIVE="prod"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/myapp.jar"]
```

**Docker Compose：**

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
      - DB_USERNAME=root
      - DB_PASSWORD=root123
    depends_on:
      mysql:
        condition: service_healthy
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
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

volumes:
  mysql_data:

networks:
  app-network:
    driver: bridge
```

**Docker 命令：**

```bash
# 构建镜像
docker build -t myapp:latest .

# 运行容器
docker run -d -p 8080:8080 --name myapp myapp:latest

# 查看容器日志
docker logs -f myapp

# 进入容器
docker exec -it myapp bash

# 停止容器
docker stop myapp

# 删除容器
docker rm myapp

# 删除镜像
docker rmi myapp:latest

# 清理未使用的资源
docker system prune
```