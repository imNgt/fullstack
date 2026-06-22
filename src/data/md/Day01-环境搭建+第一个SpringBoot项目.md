# Day 01：环境搭建 + 第一个 Spring Boot 项目

### 📚 Java 补充（30 分钟）

#### 1. Java 类与类修饰符

##### 1.1 类的定义

```java
public class HelloWorld {
    // 类的成员变量（属性）
    private String message;

    // 构造方法
    public HelloWorld(String message) {
        this.message = message;
    }

    // 成员方法
    public void sayHello() {
        System.out.println(message);
    }
}
```

##### 1.2 类修饰符

| 修饰符      | 说明       | 可访问性                 |
| ----------- | ---------- | ------------------------ |
| `public`    | 公开访问   | 所有类都可访问           |
| `private`   | 私有访问   | 仅本类可访问             |
| `protected` | 受保护访问 | 本类、子类、同包类可访问 |
| `default`   | 默认访问   | 仅同包类可访问           |

##### 1.3 常见关键字

```java
public final class Singleton {
    // final: 类不可继承，方法不可重写，变量不可修改
    // static: 静态成员，属于类而非实例
    private static Singleton instance;

    // private: 私有构造，防止外部实例化
    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

#### 2. Java 注解

**注解**是 Java 5 引入的元数据机制，用于为代码添加额外信息。

##### 2.1 内置注解

```java
@Override       // 标记方法重写，编译器检查
@Deprecated     // 标记已过时的方法/类
@SuppressWarnings("unchecked")  // 抑制编译器警告
@FunctionalInterface  // 标记函数式接口
```

##### 2.2 注解的作用

1. **编译检查**：`@Override` 确保方法正确重写
2. **运行时处理**：通过反射获取注解信息
3. **代码生成**：框架根据注解自动生成代码
4. **文档生成**：生成 API 文档

#### 3. JDK 详细介绍

**JDK（Java Development Kit）** 是 Java 开发工具包，是编写、编译和运行 Java 程序的核心环境。

##### 3.1 JDK、JRE、JVM 的关系

| 组件    | 全称                     | 作用                                 |
| ------- | ------------------------ | ------------------------------------ |
| **JVM** | Java Virtual Machine     | Java 虚拟机，执行字节码，实现跨平台  |
| **JRE** | Java Runtime Environment | Java 运行时环境，包含 JVM 和核心类库 |
| **JDK** | Java Development Kit     | Java 开发工具包，包含 JRE + 开发工具 |

```
JDK = JRE + 开发工具（javac, javadoc, jar 等）
JRE = JVM + Java 核心类库
```

##### 3.2 JDK 版本选择

- **Java 8**：长期支持版本（LTS），兼容性最好，企业广泛使用
- **Java 11**：长期支持版本（LTS），性能提升，模块化改进
- **Java 17**：长期支持版本（LTS），最新稳定版，推荐用于新项目
- **Java 21**：最新 LTS 版本，支持虚拟线程等新特性

> **Spring Boot 3.x 要求**：最低 Java 17

##### 3.3 安装与环境变量配置

```bash
# 检查当前 JDK 版本
java -version
javac -version  # 编译器版本

# Linux/Mac 配置环境变量（~/.bashrc 或 ~/.zshrc）
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export PATH=$JAVA_HOME/bin:$PATH
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar

# 使配置生效
source ~/.zshrc

# Windows 配置（环境变量）
# JAVA_HOME = C:\Program Files\Java\jdk-17
# PATH 添加 %JAVA_HOME%\bin
```

##### 3.4 JDK 核心工具

| 工具        | 用途                                |
| ----------- | ----------------------------------- |
| `javac`     | Java 编译器，将 .java 编译为 .class |
| `java`      | Java 运行时，执行字节码             |
| `javadoc`   | 生成 API 文档                       |
| `jar`       | 创建和管理 JAR 文件                 |
| `jps`       | 列出正在运行的 Java 进程            |
| `jconsole`  | Java 监控和管理控制台               |
| `jvisualvm` | Java 可视化虚拟机监控工具           |

##### 3.5 多版本 JDK 管理

**Mac 系统：**

```bash
# 使用 Homebrew 安装多个版本
brew install openjdk@17
brew install openjdk@21

# 查看已安装的 JDK
/usr/libexec/java_home -V

# 临时切换版本
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# 永久切换（修改 ~/.zshrc 或 ~/.bashrc）
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
source ~/.zshrc
```

**Windows 系统：**

1. 下载并安装多个 JDK 版本
2. 在环境变量中配置多个 JAVA_HOME：
   - `JAVA_HOME_17` = `C:\Program Files\Java\jdk-17`
   - `JAVA_HOME_21` = `C:\Program Files\Java\jdk-21`
3. 修改 `JAVA_HOME` 环境变量切换版本

**跨平台方案（推荐）：**

```bash
# 使用 SDKMAN（适用于 Mac/Linux）
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

sdk list java          # 查看可用版本
sdk install java 17.0.10-tem  # 安装指定版本
sdk use java 17.0.10-tem      # 临时使用
sdk default java 17.0.10-tem  # 设置为默认版本
```

#### 4. Maven 详细介绍

**Maven** 是 Apache 基金会推出的项目管理与构建自动化工具，主要用于 Java 项目的依赖管理和构建。

##### 4.1 Maven 核心概念

| 概念             | 说明                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| **POM**          | Project Object Model，项目对象模型，通过 `pom.xml` 文件描述项目       |
| **依赖管理**     | 自动下载和管理项目依赖的 JAR 包                                       |
| **构建生命周期** | 标准化的构建流程：clean → compile → test → package → install → deploy |
| **中央仓库**     | Maven Central，全球最大的 Java 依赖仓库                               |
| **本地仓库**     | `~/.m2/repository`，本地缓存依赖                                      |

##### 4.2 Maven 依赖坐标

每个依赖由三个部分组成：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>    <!-- 组织/公司标识 -->
    <artifactId>spring-boot-starter-web</artifactId> <!-- 项目/模块名称 -->
    <version>3.2.0</version>                        <!-- 版本号 -->
</dependency>
```

##### 4.3 Maven 常用命令

```bash
# 清理构建产物
mvn clean

# 编译主代码
mvn compile

# 运行测试
mvn test

# 打包（生成 JAR/WAR）
mvn package

# 安装到本地仓库
mvn install

# 部署到远程仓库
mvn deploy

# 跳过测试打包
mvn package -DskipTests

# 查看依赖树
mvn dependency:tree
```

##### 4.4 Maven 配置文件（pom.xml）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- Spring Boot 父工程，提供依赖版本管理 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <!-- 项目基本信息 -->
    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>demo</name>
    <description>Spring Boot Demo</description>

    <!-- 属性配置 -->
    <properties>
        <java.version>17</java.version>
    </properties>

    <!-- 依赖列表 -->
    <dependencies>
        <!-- Spring Web 依赖 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- 测试依赖（仅测试时使用） -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <!-- 构建配置 -->
    <build>
        <plugins>
            <!-- Spring Boot 打包插件 -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

##### 4.5 依赖范围（Scope）

| Scope      | 说明                                           |
| ---------- | ---------------------------------------------- |
| `compile`  | 默认，编译、测试、运行都需要                   |
| `test`     | 仅测试时需要（如 JUnit）                       |
| `provided` | 编译需要，但运行时由容器提供（如 Servlet API） |
| `runtime`  | 运行时需要，编译不需要                         |

##### 4.6 Maven vs npm 对比

| 特性     | Maven                      | npm                   |
| -------- | -------------------------- | --------------------- |
| 所属生态 | Java/JVM                   | JavaScript/Node.js    |
| 配置文件 | `pom.xml` (XML)            | `package.json` (JSON) |
| 依赖标识 | groupId:artifactId:version | packageName@version   |
| 本地仓库 | `~/.m2/repository`         | `node_modules`        |
| 构建能力 | 强（完整生命周期）         | 弱（依赖 scripts）    |

#### 5. Spring 核心注解

##### 5.1 @RestController

组合注解，等价于 `@Controller + @ResponseBody`，返回 JSON 响应。

```java
@RestController
public class HelloController {
    // 方法返回值直接序列化为 JSON
    public String hello() {
        return "Hello, World!";
    }
}
```

##### 5.2 @RequestMapping

定义请求路由，支持多个 HTTP 方法。

```java
@RequestMapping("/api")        // 基础路径
@RequestMapping(value = "/hello", method = RequestMethod.GET)  // 指定方法
@RequestMapping("/users/{id}") // 路径参数
```

##### 5.3 @GetMapping

`@RequestMapping` 的 GET 方法简化版。

```java
@RestController
@RequestMapping("/api")
public class HelloController {

    // GET /api/hello
    @GetMapping("/hello")
    public String hello() {
        return "Hello, Spring Boot!";
    }

    // GET /api/hello/{name} - 路径参数
    @GetMapping("/hello/{name}")
    public String helloWithName(@PathVariable String name) {
        return "Hello, " + name + "!";
    }
}
```

##### 5.4 常见请求注解

| 注解             | HTTP 方法 | 说明     |
| ---------------- | --------- | -------- |
| `@GetMapping`    | GET       | 查询资源 |
| `@PostMapping`   | POST      | 创建资源 |
| `@PutMapping`    | PUT       | 更新资源 |
| `@DeleteMapping` | DELETE    | 删除资源 |

##### 5.5 请求参数获取

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    // 获取路径参数
    @GetMapping("/{id}")
    public String getUser(@PathVariable Long id) {
        return "User ID: " + id;
    }

    // 获取查询参数 ?name=xxx
    @GetMapping("/search")
    public String search(@RequestParam String name) {
        return "Search: " + name;
    }

    // 获取请求体
    @PostMapping
    public String create(@RequestBody User user) {
        return "Created: " + user.getName();
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
