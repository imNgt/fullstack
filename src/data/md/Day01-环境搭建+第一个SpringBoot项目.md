# Day 01：环境搭建 + 第一个 Spring Boot 项目

### 📚 Java 补充（30 分钟）

#### 1. JDK 安装与环境变量

```bash
# 检查 JDK 版本
java -version

# 配置环境变量（Linux/Mac）
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export PATH=$JAVA_HOME/bin:$PATH
```

#### 2. Maven pom.xml

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
        <relativePath/>
    </parent>
    
    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>demo</name>
    <description>Spring Boot Demo</description>
    
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
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

#### 3. @Override 注解

```java
public class UserService {
    @Override  // 告诉编译器这是重写方法
    public String toString() {
        return super.toString();
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：使用 start.spring.io 初始化项目

访问 [start.spring.io](https://start.spring.io/)，选择：
- Project: Maven
- Language: Java
- Spring Boot: 3.2.x
- Dependencies: Spring Web

下载并解压项目。

#### 任务 2：创建 HelloController

```java
@RestController
@RequestMapping("/api")
public class HelloController {
    
    @GetMapping("/hello")
    public String hello() {
        return "Hello, Spring Boot!";
    }
    
    @GetMapping("/hello/{name}")
    public String helloWithName(@PathVariable String name) {
        return "Hello, " + name + "!";
    }
}
```

#### 任务 3：启动项目

```bash
mvn spring-boot:run
# 或打包后运行
mvn clean package
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

访问 http://localhost:8080/api/hello

---

### 📝 今日笔记（5 行）

1. `@RestController` = `@Controller` + `@ResponseBody`，返回 JSON
2. `@RequestMapping` 定义路由，支持 GET/POST/PUT/DELETE
3. `@PathVariable` 获取 URL 路径参数
4. Maven 依赖版本由 parent 统一管理
5. Spring Boot 内置 Tomcat，无需额外配置
