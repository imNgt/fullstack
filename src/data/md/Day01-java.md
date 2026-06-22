# Day 01：Java 前置知识

> **写给前端同学**：如果你熟悉 JavaScript/TypeScript，学习 Java 会很轻松。这部分我们用前端视角对比讲解，帮你快速上手。

---

#### 1. Java 类与对象（对比 JavaScript）

##### 1.1 类的定义

**Java 的类** 就像 JavaScript 的 `class`，用于定义对象的模板：

| 特性 | Java | JavaScript |
|------|------|------------|
| 类声明 | `public class User { ... }` | `class User { ... }` |
| 构造方法 | `public User() { ... }` | `constructor() { ... }` |
| 成员变量 | `private String name;` | `this.name = value;` |
| 成员方法 | `public void sayHello() { ... }` | `sayHello() { ... }` |

**Java 示例：**

```java
public class User {
    // 成员变量（属性）- 必须声明类型
    private String name;
    private Integer age;
    
    // 构造方法（类似 JS 的 constructor）
    public User(String name, Integer age) {
        this.name = name;
        this.age = age;
    }
    
    // 成员方法（类似 JS 的 prototype 方法）
    public String sayHello() {
        return "Hello, " + this.name;
    }
    
    // Getter/Setter（JS 中直接访问属性，Java 需要显式定义）
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
}

// 使用类创建对象
User user = new User("张三", 25);  // new 关键字实例化
System.out.println(user.sayHello());  // 调用方法
```

**与 JavaScript 的区别：**
- Java 是**强类型**：变量必须声明类型，如 `String name` 而非 `let name`
- Java 是**编译型语言**：需要先编译成字节码才能运行
- Java 的 `new` 关键字是必须的，不像 JS 可以省略

##### 1.2 访问修饰符（封装性）

Java 通过访问修饰符实现封装，就像 JS 中用 `#privateField` 或闭包隐藏内部实现：

| 修饰符 | 说明 | 可访问范围 | 类比 JS |
|--------|------|------------|---------|
| `public` | 公开 | 所有类都能访问 | 普通属性/方法 |
| `private` | 私有 | 仅本类可访问 | `#privateField` |
| `protected` | 受保护 | 本类、子类、同包 | 接近 `private` |
| `default` | 默认（无修饰符） | 仅同包类 | 模块内可见 |

```java
public class User {
    // private: 外部无法直接访问，必须通过 getter/setter
    private String password;
    
    public String getPassword() {
        // 可以在这里做校验、加密等逻辑
        return this.password;
    }
    
    public void setPassword(String password) {
        // 可以在这里做密码强度校验
        if (password.length() >= 6) {
            this.password = password;
        }
    }
}
```

##### 1.3 常用关键字

```java
public final class Config {
    // final: 常量，一旦赋值不可修改（类似 JS 的 const）
    public static final String VERSION = "1.0.0";
    
    // static: 静态成员，属于类本身（类似 JS 的 static 关键字）
    public static int count = 0;
    
    // private: 私有构造，防止外部实例化（单例模式）
    private Config() {}
    
    public static Config getInstance() {
        // 返回唯一实例
        return new Config();
    }
}
```

---

#### 2. Java 注解（对比 JS 装饰器）

**注解** 是 Java 的元数据机制，类似 JavaScript 的装饰器（Decorator）：

```java
// Java 注解
@RestController
@RequestMapping("/api")
public class UserController {
    @GetMapping("/hello")
    public String hello() {
        return "Hello";
    }
}

// 类似 JS 装饰器
@Controller("/api")
class UserController {
    @Get("/hello")
    hello() { return "Hello"; }
}
```

##### 2.1 常见内置注解

| 注解 | 作用 | 说明 |
|------|------|------|
| `@Override` | 标记方法重写 | 编译器检查是否正确覆盖父类方法 |
| `@Deprecated` | 标记已过时 | 提示开发者该方法已废弃 |
| `@SuppressWarnings` | 抑制警告 | 告诉编译器忽略特定警告 |
| `@FunctionalInterface` | 标记函数式接口 | 确保接口只有一个抽象方法 |

```java
public class Animal {
    public void makeSound() {
        System.out.println("动物叫声");
    }
}

public class Dog extends Animal {
    @Override  // 告诉编译器：这是重写父类的方法
    public void makeSound() {
        System.out.println("汪汪");
    }
}
```

##### 2.2 注解的作用

1. **编译检查**：`@Override` 确保方法正确重写
2. **运行时处理**：Spring 通过反射读取注解实现自动配置
3. **代码生成**：Lombok 的 `@Data` 自动生成 getter/setter
4. **文档生成**：Swagger 注解自动生成 API 文档

---

#### 3. Java 反射机制（对比 JS 动态属性访问）

**反射** 允许程序在运行时获取类的信息并动态操作对象，类似 JS 中的：

```javascript
// JS 动态访问
obj["property"]
obj["method"]()
Object.keys(obj)

// Java 反射
obj.getClass()
method.invoke(obj)
field.get(obj)
```

##### 3.1 反射的核心能力

| 能力 | Java 代码 | JS 等效 |
|------|-----------|---------|
| 获取类信息 | `clazz.getName()` | `obj.constructor.name` |
| 创建对象 | `clazz.newInstance()` | `new Class()` |
| 调用方法 | `method.invoke(obj)` | `obj[methodName]()` |
| 访问字段 | `field.get(obj)` | `obj[fieldName]` |

##### 3.2 反射示例

```java
import java.lang.reflect.Method;

public class ReflectionDemo {
    public static void main(String[] args) throws Exception {
        // 1. 获取类的 Class 对象（三种方式）
        Class<?> clazz = User.class;
        
        // 2. 动态创建对象（无需 new 关键字）
        Object user = clazz.getDeclaredConstructor().newInstance();
        
        // 3. 动态调用方法
        Method setName = clazz.getMethod("setName", String.class);
        setName.invoke(user, "张三");
        
        // 4. 动态访问字段（突破封装）
        java.lang.reflect.Field ageField = clazz.getDeclaredField("age");
        ageField.setAccessible(true);  // 绕过 private 限制
        ageField.set(user, 25);
        
        // 5. 获取类的所有方法
        Method[] methods = clazz.getMethods();
        for (Method m : methods) {
            System.out.println("方法名: " + m.getName());
        }
    }
}
```

##### 3.3 反射在 Spring 中的应用

Spring 框架就是用反射实现的：

| Spring 特性 | 反射的作用 | 示例 |
|-------------|-----------|------|
| 组件扫描 | 扫描带有 `@Component` 的类 | 自动注册 Bean |
| 依赖注入 | 通过 `@Autowired` 注入依赖 | 自动装配对象 |
| 路由映射 | 通过 `@GetMapping` 绑定 URL | 自动创建路由 |
| 配置绑定 | 通过 `@Value` 读取配置 | 自动注入配置值 |

**为什么前端同学要懂反射？**

就像你用 Vue 的 `ref`、`reactive` 时不需要关心内部实现，但理解 Proxy 能帮你更好地使用 Vue 一样，理解反射能让你：
- 更好地理解 Spring 的工作原理
- 更容易排查依赖注入问题
- 写出更优雅的自定义注解

---

#### 4. JDK 详细介绍

**JDK（Java Development Kit）** 是 Java 开发工具包，是编写、编译和运行 Java 程序的核心环境。

##### 4.1 JDK、JRE、JVM 的关系

| 组件 | 全称 | 作用 |
|------|------|------|
| **JVM** | Java Virtual Machine | Java 虚拟机，执行字节码，实现跨平台 |
| **JRE** | Java Runtime Environment | Java 运行时环境，包含 JVM 和核心类库 |
| **JDK** | Java Development Kit | Java 开发工具包，包含 JRE + 开发工具 |

```
JDK = JRE + 开发工具（javac, javadoc, jar 等）
JRE = JVM + Java 核心类库
```

##### 4.2 JDK 版本选择

- **Java 8**：长期支持版本（LTS），兼容性最好，企业广泛使用
- **Java 11**：长期支持版本（LTS），性能提升，模块化改进
- **Java 17**：长期支持版本（LTS），最新稳定版，推荐用于新项目
- **Java 21**：最新 LTS 版本，支持虚拟线程等新特性

> **Spring Boot 3.x 要求**：最低 Java 17

##### 4.3 安装与环境变量配置

```bash
# 检查当前 JDK 版本
java -version
javac -version  # 编译器版本

# Mac/Linux 配置环境变量（~/.bashrc 或 ~/.zshrc）
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export PATH=$JAVA_HOME/bin:$PATH

# Windows 配置（环境变量）
# JAVA_HOME = C:\Program Files\Java\jdk-17
# PATH 添加 %JAVA_HOME%\bin
```

##### 4.4 JDK 核心工具

| 工具 | 用途 |
|------|------|
| `javac` | Java 编译器，将 .java 编译为 .class |
| `java` | Java 运行时，执行字节码 |
| `javadoc` | 生成 API 文档 |
| `jar` | 创建和管理 JAR 文件 |

##### 4.5 多版本 JDK 管理

**Mac 系统：**
```bash
brew install openjdk@17
brew install openjdk@21
/usr/libexec/java_home -V  # 查看已安装版本
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

**跨平台方案（推荐）：**
```bash
curl -s "https://get.sdkman.io" | bash
sdk list java
sdk install java 17.0.10-tem
sdk use java 17.0.10-tem
```

---

#### 5. Maven 详细介绍（对比 npm）

**Maven** 是 Java 的项目管理与构建工具，类似 JavaScript 的 `npm`：

| 特性 | Maven | npm |
|------|-------|-----|
| 配置文件 | `pom.xml` | `package.json` |
| 依赖标识 | `groupId:artifactId:version` | `packageName@version` |
| 本地仓库 | `~/.m2/repository` | `node_modules` |
| 构建命令 | `mvn compile/package` | `npm run build` |

##### 5.1 Maven 核心概念

| 概念 | 说明 |
|------|------|
| **POM** | 项目对象模型，通过 `pom.xml` 描述项目 |
| **依赖管理** | 自动下载和管理项目依赖的 JAR 包 |
| **构建生命周期** | 标准化流程：clean → compile → test → package → install |
| **中央仓库** | Maven Central，全球最大的 Java 依赖仓库 |

##### 5.2 依赖坐标

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>    <!-- 组织标识 -->
    <artifactId>spring-boot-starter-web</artifactId> <!-- 项目名称 -->
    <version>3.2.0</version>                        <!-- 版本号 -->
</dependency>
```

##### 5.3 Maven 常用命令

```bash
mvn clean          # 清理构建产物
mvn compile        # 编译主代码
mvn test           # 运行测试
mvn package        # 打包（生成 JAR/WAR）
mvn install        # 安装到本地仓库
mvn spring-boot:run  # 运行 Spring Boot 项目
```

##### 5.4 pom.xml 示例

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

##### 5.5 依赖范围

| Scope | 说明 |
|-------|------|
| `compile` | 默认，编译、测试、运行都需要 |
| `test` | 仅测试时需要（如 JUnit） |
| `provided` | 编译需要，运行时由容器提供 |

---

#### 6. Spring 核心注解

##### 6.1 @RestController

组合注解，等价于 `@Controller + @ResponseBody`，返回 JSON 响应：

```java
@RestController
public class HelloController {
    public String hello() {
        return "Hello, World!";  // 直接返回 JSON
    }
}
```

##### 6.2 @RequestMapping

定义请求路由，支持多个 HTTP 方法：

```java
@RequestMapping("/api")        // 基础路径
@RequestMapping(value = "/hello", method = RequestMethod.GET)  // 指定方法
@RequestMapping("/users/{id}") // 路径参数
```

##### 6.3 @GetMapping

`@RequestMapping` 的 GET 方法简化版：

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

##### 6.4 请求参数获取

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    // 路径参数: /api/users/1
    @GetMapping("/{id}")
    public String getUser(@PathVariable Long id) {
        return "User ID: " + id;
    }
    
    // 查询参数: /api/users/search?name=张三
    @GetMapping("/search")
    public String search(@RequestParam String name) {
        return "Search: " + name;
    }
    
    // 请求体（POST JSON）
    @PostMapping
    public String create(@RequestBody User user) {
        return "Created: " + user.getName();
    }
}
```
