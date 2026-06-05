# Day 1：环境搭建 + 第一个 Spring Boot 项目

### 📚 Java 补充（40 分钟）

#### 1. JDK 安装与配置

```bash
# 检查是否已安装
java -version

# macOS 安装方式
brew install openjdk@17

# 配置环境变量（编辑 ~/.zshrc 或 ~/.bash_profile）
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH=$JAVA_HOME/bin:$PATH

# 验证
java -version
javac -version
```

#### 2. IDEA 基础配置

- 下载 IntelliJ IDEA Community Edition（免费）
- 配置 JDK：`File → Project Structure → SDKs`
- 配置 Maven：`File → Settings → Build Tools → Maven`
  - Maven home directory: 选择 IDEA 自带的或自己安装的
  - User settings file: `~/.m2/settings.xml`

#### 3. Maven `pom.xml` 基础结构

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- 坐标：唯一标识项目 -->
    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>1.0.0</version>

    <!-- 继承 Spring Boot 父项目 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <!-- 依赖 -->
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>
</project>
```

#### 4. 注解 `@Override` 是什么

```java
public class Animal {
    public void makeSound() {
        System.out.println("动物叫");
    }
}

public class Dog extends Animal {
    @Override  // 编译器检查：确保父类有这个方法
    public void makeSound() {
        System.out.println("汪汪");
    }
}
```

**作用**：防止方法名写错，强制实现父类方法

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：用 start.spring.io 初始化项目

1. 访问 https://start.spring.io/
2. 选择配置：
   - Project: Maven
   - Language: Java
   - Spring Boot: 3.2.0
   - Group: com.example
   - Artifact: demo
   - Packaging: Jar
   - Java: 17
3. 添加依赖：Spring Web
4. 点击 "GENERATE"，下载并解压

#### 任务 2：导入 IDEA 并运行

```bash
# 解压后进入目录
cd demo

# 用 IDEA 打开
idea .

# 或直接在 IDEA 中 File → Open
```

#### 任务 3：创建第一个 Controller

```java
package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController  // 告诉 Spring 这是一个 Web 控制器
public class HelloController {

    @GetMapping("/hello")  // 处理 GET /hello 请求
    public String hello() {
        return "Hello, Spring Boot!";
    }
}
```

#### 任务 4：运行并测试

```bash
# 在 IDEA 中点击 DemoApplication 的运行按钮
# 或命令行执行
mvn spring-boot:run
```

**测试**：

- 浏览器访问：http://localhost:8080/hello
- 应该看到：`Hello, Spring Boot!`

#### 任务 5：观察启动日志

找到关键信息：

```
Tomcat started on port 8080
Started DemoApplication in 2.345 seconds
```

---

### 📝 今日笔记（5 分钟）

1. Maven 的 `groupId/artifactId/version` 三要素是什么？
2. `@RestController` 和 `@GetMapping` 的作用？
3. Spring Boot 默认端口是多少？如何修改？
4. 遇到的问题：**\_\_**
5. 今天的收获：**\_\_**
