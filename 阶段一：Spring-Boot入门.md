# 阶段一：Spring Boot 入门（Day 1-10）

> 目标：跑通第一个 Web 项目，理解 IoC/DI
> 
> 里程碑：能独立搭项目、写 CRUD 接口、懂依赖注入

---

## Day 1：环境搭建 + 第一个 Spring Boot 项目

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
4. 遇到的问题：______
5. 今天的收获：______

---

## Day 2：包结构 + 路径参数

### 📚 Java 补充（40 分钟）

#### 1. 包（Package）概念
```java
// 文件路径：src/main/java/com/example/demo/User.java
package com.example.demo;  // 声明包，必须与目录结构一致

public class User {
    private String name;
}
```

**包的作用**：
- 避免类名冲突
- 组织代码结构
- 访问控制

#### 2. import 导入类
```java
package com.example.demo.controller;

import com.example.demo.model.User;  // 导入其他包的类
import org.springframework.web.bind.annotation.*;  // 通配符导入
import java.util.List;  // 导入 JDK 类
```

#### 3. 类路径（Classpath）
```
项目结构：
demo/
├── src/
│   ├── main/
│   │   ├── java/           ← 类路径根目录
│   │   │   └── com/example/demo/
│   │   ├── resources/      ← 配置文件、静态资源
│   │   └── webapp/         ← Web 资源（传统项目）
│   └── test/               ← 测试代码
```

**类路径**：JVM 查找 `.class` 文件的路径

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建 User 模型类

```java
// src/main/java/com/example/demo/model/User.java
package com.example.demo.model;

public class User {
    private Long id;
    private String name;
    private Integer age;
    
    // 构造方法
    public User() {}
    
    public User(Long id, String name, Integer age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }
    
    // Getter 和 Setter（IDEA 快捷键：Alt+Insert）
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}
```

#### 任务 2：路径参数接口

```java
// src/main/java/com/example/demo/controller/UserController.java
package com.example.demo.controller;

import com.example.demo.model.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")  // 统一前缀
public class UserController {
    
    // 路径参数：/users/1
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        // 模拟从数据库查询
        return new User(id, "张三", 25);
    }
    
    // 多个路径参数：/users/1/info
    @GetMapping("/{id}/info")
    public String getUserInfo(@PathVariable Long id) {
        return "用户 ID：" + id + "，详细信息...";
    }
}
```

#### 任务 3：测试接口

```bash
# 测试 1
curl http://localhost:8080/users/1

# 测试 2
curl http://localhost:8080/users/2/info
```

**预期输出**：
```json
{"id":1,"name":"张三","age":25}
```

#### 任务 4：添加查询参数

```java
// 查询参数：/users?name=李四&age=30
@GetMapping
public User getUserByQuery(
    @RequestParam(required = false) String name,
    @RequestParam(required = false) Integer age
) {
    return new User(3L, name, age);
}
```

---

### 📝 今日笔记

1. `@PathVariable` 和 `@RequestParam` 的区别？
2. 包名为什么要倒序域名（如 com.example）？
3. 如何让参数可选？
4. 遇到的问题：______
5. 今天的收获：______

---

## Day 3：反射 + Spring 扫描原理

### 📚 Java 补充（40 分钟）

#### 1. 反射基础

```java
package com.example.demo;

import java.lang.reflect.Method;

public class ReflectionDemo {
    public static void main(String[] args) throws Exception {
        // 方式 1：通过类名获取 Class 对象
        Class<?> clazz = Class.forName("com.example.demo.model.User");
        
        // 方式 2：通过对象获取
        User user = new User();
        Class<?> clazz2 = user.getClass();
        
        // 方式 3：通过 .class
        Class<?> clazz3 = User.class;
        
        // 获取所有方法
        Method[] methods = clazz.getDeclaredMethods();
        for (Method method : methods) {
            System.out.println("方法名：" + method.getName());
        }
        
        // 调用方法
        Method setNameMethod = clazz.getMethod("setName", String.class);
        User newUser = (User) clazz.getConstructor().newInstance();
        setNameMethod.invoke(newUser, "王五");
        System.out.println(newUser.getName());  // 输出：王五
    }
}
```

**反射的作用**：
- 运行时动态获取类信息
- 动态调用方法
- 框架底层大量使用（如 Spring）

#### 2. 获取类信息

```java
// 获取所有字段
Field[] fields = clazz.getDeclaredFields();

// 获取所有构造方法
Constructor<?>[] constructors = clazz.getConstructors();

// 获取注解
RestController annotation = clazz.getAnnotation(RestController.class);
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：观察 Spring 扫描过程

```java
// DemoApplication.java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication  // 包含 @ComponentScan，扫描当前包及子包
public class DemoApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(DemoApplication.class, args);
        
        // 打印所有 Bean 名称
        String[] beanNames = context.getBeanDefinitionNames();
        System.out.println("=== 容器中的 Bean ===");
        for (String name : beanNames) {
            if (name.contains("controller") || name.contains("service")) {
                System.out.println(name);
            }
        }
    }
}
```

#### 任务 2：自定义注解

```java
// src/main/java/com/example/demo/annotation/MyComponent.java
package com.example.demo.annotation;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)  // 运行时保留
@Target(ElementType.TYPE)            // 用在类上
public @interface MyComponent {
    String value() default "";
}
```

#### 任务 3：用反射扫描注解

```java
// src/main/java/com/example/demo/util/AnnotationScanner.java
package com.example.demo.util;

import com.example.demo.annotation.MyComponent;
import org.reflections.Reflections;
import org.springframework.stereotype.Component;

import java.util.Set;

public class AnnotationScanner {
    public static void main(String[] args) {
        // 扫描指定包下的类
        Reflections reflections = new Reflections("com.example.demo");
        
        // 获取带 @MyComponent 注解的类
        Set<Class<?>> annotated = reflections.getTypesAnnotatedWith(MyComponent.class);
        
        System.out.println("带 @MyComponent 的类：");
        annotated.forEach(clazz -> System.out.println(clazz.getName()));
        
        // 获取带 @Component 的类
        Set<Class<?>> components = reflections.getTypesAnnotatedWith(Component.class);
        System.out.println("\n带 @Component 的类：");
        components.forEach(clazz -> System.out.println(clazz.getName()));
    }
}
```

#### 任务 4：给 Controller 加自定义注解

```java
@MyComponent("userController")
@RestController
@RequestMapping("/users")
public class UserController {
    // ...
}
```

---

### 📝 今日笔记

1. 反射的三种获取 Class 对象的方式？
2. `@SpringBootApplication` 包含哪些核心注解？
3. Spring 如何扫描到我们的 Controller？
4. 遇到的问题：______
5. 今天的收获：______

---

## Day 4：接口 + 依赖注入

### 📚 Java 补充（40 分钟）

#### 1. 接口 vs 实现类

```java
// 接口：定义规范
public interface UserService {
    User getUserById(Long id);
    List<User> getAllUsers();
}

// 实现类：具体实现
public class UserServiceImpl implements UserService {
    @Override
    public User getUserById(Long id) {
        return new User(id, "实现类返回", 20);
    }
    
    @Override
    public List<User> getAllUsers() {
        return List.of(
            new User(1L, "张三", 25),
            new User(2L, "李四", 30)
        );
    }
}
```

**接口的作用**：
- 解耦：调用者不依赖具体实现
- 多态：一个接口多个实现
- 规范：定义统一的行为契约

#### 2. implements 关键字

```java
// 一个类可以实现多个接口
public class UserServiceImpl implements UserService, Serializable {
    // ...
}
```

#### 3. 为什么用接口？

```java
// 不用接口：强耦合
public class UserController {
    private UserServiceImpl userService = new UserServiceImpl();  // 硬编码
}

// 用接口：松耦合
public class UserController {
    private UserService userService;  // 只依赖接口，具体实现可替换
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建 Service 接口和实现

```java
// src/main/java/com/example/demo/service/UserService.java
package com.example.demo.service;

import com.example.demo.model.User;
import java.util.List;

public interface UserService {
    User getUserById(Long id);
    List<User> getAllUsers();
    User createUser(User user);
}
```

```java
// src/main/java/com/example/demo/service/impl/UserServiceImpl.java
package com.example.demo.service.impl;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service  // 告诉 Spring 这是一个 Service Bean
public class UserServiceImpl implements UserService {
    
    // 模拟数据库
    private final ConcurrentHashMap<Long, User> userMap = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);
    
    public UserServiceImpl() {
        // 初始化一些测试数据
        userMap.put(1L, new User(1L, "张三", 25));
        userMap.put(2L, new User(2L, "李四", 30));
    }
    
    @Override
    public User getUserById(Long id) {
        return userMap.get(id);
    }
    
    @Override
    public List<User> getAllUsers() {
        return new ArrayList<>(userMap.values());
    }
    
    @Override
    public User createUser(User user) {
        Long id = idGenerator.getAndIncrement();
        user.setId(id);
        userMap.put(id, user);
        return user;
    }
}
```

#### 任务 2：在 Controller 中注入 Service

```java
// UserController.java
@RestController
@RequestMapping("/users")
public class UserController {
    
    @Autowired  // 自动注入 UserService 的实现类
    private UserService userService;
    
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
    
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }
}
```

#### 任务 3：测试依赖注入

```bash
# 测试查询
curl http://localhost:8080/users/1

# 测试列表
curl http://localhost:8080/users
```

#### 任务 4：验证注入的是哪个实现类

```java
// DemoApplication.java
public static void main(String[] args) {
    ConfigurableApplicationContext context = SpringApplication.run(DemoApplication.class, args);
    
    // 获取 UserService Bean
    UserService userService = context.getBean(UserService.class);
    System.out.println("UserService 实现类：" + userService.getClass().getName());
    // 输出：com.example.demo.service.impl.UserServiceImpl
}
```

---

### 📝 今日笔记

1. 接口和抽象类的区别？
2. `@Autowired` 的作用是什么？
3. 为什么 Controller 要依赖接口而不是直接依赖实现类？
4. 遇到的问题：______
5. 今天的收获：______

---

## Day 5：构造方法 + 构造器注入

### 📚 Java 补充（40 分钟）

#### 1. 构造方法基础

```java
public class User {
    private Long id;
    private String name;
    
    // 无参构造
    public User() {
        System.out.println("无参构造被调用");
    }
    
    // 有参构造
    public User(Long id, String name) {
        this.id = id;
        this.name = name;
        System.out.println("有参构造被调用");
    }
    
    // 如果不写构造方法，Java 会自动生成无参构造
}
```

#### 2. this 关键字

```java
public class User {
    private String name;
    
    // this.name 指成员变量，name 指参数
    public User(String name) {
        this.name = name;  // 区分成员变量和局部变量
    }
    
    // this() 调用其他构造方法
    public User() {
        this("默认名字");  // 调用有参构造
    }
    
    // this 指当前对象
    public User setName(String name) {
        this.name = name;
        return this;  // 链式调用
    }
}
```

#### 3. 构造方法 vs Setter

```java
// 构造方法：创建对象时必须初始化
User user1 = new User(1L, "张三");

// Setter：可以分步设置
User user2 = new User();
user2.setId(1L);
user2.setName("张三");
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：理解构造器注入

```java
// UserController.java
@RestController
@RequestMapping("/users")
public class UserController {
    
    private final UserService userService;  // final 表示不可变
    
    // 构造器注入（推荐）
    public UserController(UserService userService) {
        this.userService = userService;
        System.out.println("UserController 构造方法被调用");
        System.out.println("注入的 UserService：" + userService.getClass().getName());
    }
    
    // 如果只有一个构造方法，@Autowired 可以省略（Spring 4.3+）
    
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
}
```

#### 任务 2：对比字段注入

```java
// 字段注入（不推荐）
@RestController
public class UserController {
    
    @Autowired
    private UserService userService;  // 直接在字段上注入
}
```

**为什么推荐构造器注入？**
- 保证依赖不可变（final）
- 保证依赖不为空（构造时必须提供）
- 便于单元测试（直接 new 对象传参）
- 避免 Spring 特定注解侵入代码

#### 任务 3：多依赖注入

```java
@Service
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    // 多个依赖通过构造方法注入
    public UserServiceImpl(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
}
```

#### 任务 4：验证注入时机

```java
@Component
public class BeanLifecycleDemo implements InitializingBean {
    
    public BeanLifecycleDemo() {
        System.out.println("1. 构造方法被调用");
    }
    
    @Autowired
    private UserService userService;
    
    @PostConstruct  // 依赖注入后执行
    public void init() {
        System.out.println("3. @PostConstruct 方法被调用");
        System.out.println("   UserService 是否为空：" + (userService != null));
    }
    
    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("4. InitializingBean.afterPropertiesSet 被调用");
    }
}
```

---

### 📝 今日笔记

1. 构造器注入 vs 字段注入 vs Setter 注入，哪个最好？
2. `final` 字段必须在什么时候初始化？
3. `@PostConstruct` 什么时候执行？
4. 遇到的问题：______
5. 今天的收获：______

---

## Day 6：泛型 + 集合返回

### 📚 Java 补充（40 分钟）

#### 1. 泛型基础

```java
// 泛型类
public class Box<T> {
    private T content;
    
    public void set(T content) {
        this.content = content;
    }
    
    public T get() {
        return content;
    }
}

// 使用
Box<String> stringBox = new Box<>();
stringBox.set("Hello");
String s = stringBox.get();

Box<Integer> intBox = new Box<>();
intBox.set(123);
Integer i = intBox.get();
```

#### 2. 泛型方法

```java
public class Utils {
    // 泛型方法
    public static <T> T getFirst(List<T> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        return list.get(0);
    }
}

// 使用
List<String> names = List.of("张三", "李四");
String firstName = Utils.getFirst(names);

List<Integer> numbers = List.of(1, 2, 3);
Integer firstNumber = Utils.getFirst(numbers);
```

#### 3. 常用泛型

```java
// List<T>：有序列表
List<String> list = new ArrayList<>();
list.add("A");
list.add("B");

// Map<K, V>：键值对
Map<String, Integer> map = new HashMap<>();
map.put("张三", 25);
map.put("李四", 30);

// 泛型通配符
List<?> unknownList = new ArrayList<String>();  // 未知类型
List<? extends Number> numbers = new ArrayList<Integer>();  // Number 的子类
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：返回 List

```java
// UserController.java
@GetMapping
public List<User> getAllUsers() {
    return userService.getAllUsers();
}

// 测试
curl http://localhost:8080/users
```

**返回 JSON**：
```json
[
  {"id":1,"name":"张三","age":25},
  {"id":2,"name":"李四","age":30}
]
```

#### 任务 2：返回 Map

```java
@GetMapping("/map/{id}")
public Map<String, Object> getUserAsMap(@PathVariable Long id) {
    User user = userService.getUserById(id);
    
    Map<String, Object> result = new HashMap<>();
    result.put("code", 200);
    result.put("message", "success");
    result.put("data", user);
    
    return result;
}

// 测试
curl http://localhost:8080/users/map/1
```

**返回 JSON**：
```json
{
  "code": 200,
  "message": "success",
  "data": {"id":1,"name":"张三","age":25}
}
```

#### 任务 3：创建统一返回结果类

```java
// src/main/java/com/example/demo/common/Result.java
package com.example.demo.common;

public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    
    // 私有构造，使用静态方法创建
    private Result() {}
    
    private Result(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
    
    // 成功返回（带数据）
    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }
    
    // 成功返回（无数据）
    public static <T> Result<T> success() {
        return new Result<>(200, "success", null);
    }
    
    // 失败返回
    public static <T> Result<T> error(String message) {
        return new Result<>(500, message, null);
    }
    
    // Getter
    public Integer getCode() { return code; }
    public String getMessage() { return message; }
    public T getData() { return data; }
}
```

#### 任务 4：使用统一返回结果

```java
// UserController.java
@GetMapping("/{id}")
public Result<User> getUserById(@PathVariable Long id) {
    User user = userService.getUserById(id);
    if (user == null) {
        return Result.error("用户不存在");
    }
    return Result.success(user);
}

@GetMapping
public Result<List<User>> getAllUsers() {
    return Result.success(userService.getAllUsers());
}
```

#### 任务 5：用 Postman 测试

1. 安装 Postman
2. 创建新请求：GET http://localhost:8080/users
3. 点击 Send，查看响应

---

### 📝 今日笔记

1. 泛型 `<T>` 的作用是什么？
2. 为什么推荐使用统一返回结果类？
3. `List<?>` 和 `List<Object>` 的区别？
4. 遇到的问题：______
5. 今天的收获：______

---

## Day 7：装箱拆箱 + 配置文件

### 📚 Java 补充（40 分钟）

#### 1. 基本类型 vs 包装类型

```java
// 基本类型（8 个）
byte, short, int, long, float, double, char, boolean

// 包装类型
Byte, Short, Integer, Long, Float, Double, Character, Boolean
```

#### 2. 自动装箱和拆箱

```java
// 装箱：基本类型 → 包装类型
Integer a = 10;  // 等价于 Integer.valueOf(10)

// 拆箱：包装类型 → 基本类型
int b = a;       // 等价于 a.intValue()

// 在集合中必须用包装类型
List<Integer> list = new ArrayList<>();  // 不能用 List<int>
list.add(10);  // 自动装箱
int value = list.get(0);  // 自动拆箱
```

#### 3. 装箱拆箱的坑

```java
// 坑 1：空指针
Integer x = null;
int y = x;  // NullPointerException

// 坑 2：比较
Integer a = 100;
Integer b = 100;
System.out.println(a == b);  // true（缓存 -128~127）

Integer c = 200;
Integer d = 200;
System.out.println(c == d);  // false（超出缓存范围）

// 正确比较方式
System.out.println(c.equals(d));  // true
```

#### 4. 什么时候用包装类型？

```java
// 用包装类型：可能为 null
private Integer age;  // 年龄可能未知

// 用基本类型：必须有值
private int count;    // 计数器，默认 0
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建配置文件

```yaml
# src/main/resources/application.yml
server:
  port: 8081  # 修改端口

spring:
  application:
    name: demo

# 自定义配置
app:
  name: Spring Boot Demo
  version: 1.0.0
  author: 张三
  max-users: 1000
```

#### 任务 2：读取配置

```java
// src/main/java/com/example/demo/config/AppConfig.java
package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")  // 读取 app.* 配置
public class AppConfig {
    private String name;
    private String version;
    private String author;
    private Integer maxUsers;
    
    // Getter 和 Setter
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    
    public Integer getMaxUsers() { return maxUsers; }
    public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }
}
```

#### 任务 3：使用配置

```java
@RestController
@RequestMapping("/config")
public class ConfigController {
    
    @Autowired
    private AppConfig appConfig;
    
    @GetMapping
    public Map<String, Object> getConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("name", appConfig.getName());
        config.put("version", appConfig.getVersion());
        config.put("author", appConfig.getAuthor());
        config.put("maxUsers", appConfig.getMaxUsers());
        return config;
    }
}
```

#### 任务 4：测试配置

```bash
# 重启应用后测试
curl http://localhost:8081/config
```

#### 任务 5：配置多环境

```yaml
# application-dev.yml（开发环境）
server:
  port: 8081
app:
  name: Spring Boot Demo (Dev)

# application-prod.yml（生产环境）
server:
  port: 80
app:
  name: Spring Boot Demo (Prod)

# application.yml（激活环境）
spring:
  profiles:
    active: dev  # 激活 dev 环境
```

---

### 📝 今日笔记

1. `Integer` 和 `int` 的区别？
2. 为什么 `Integer a = 200; Integer b = 200; a == b` 是 false？
3. `@ConfigurationProperties` 的作用？
4. 遇到的问题：______
5. 今天的收获：______

---

## Day 8：Lambda 表达式 + Stream 过滤

### 📚 Java 补充（40 分钟）

#### 1. Lambda 表达式基础

```java
// 传统方式：匿名内部类
Runnable r1 = new Runnable() {
    @Override
    public void run() {
        System.out.println("Hello");
    }
};

// Lambda 方式
Runnable r2 = () -> System.out.println("Hello");

// Lambda 语法
(参数) -> { 方法体 }

// 示例
() -> System.out.println("无参");
x -> System.out.println(x);  // 单参数可省略括号
(x, y) -> x + y;  // 单行可省略 return 和大括号
(x, y) -> { return x + y; }  // 多行需要大括号和 return
```

#### 2. 函数式接口

```java
// 只有一个抽象方法的接口
@FunctionalInterface
interface Calculator {
    int calculate(int a, int b);
}

// 使用 Lambda
Calculator add = (a, b) -> a + b;
Calculator multiply = (a, b) -> a * b;

System.out.println(add.calculate(2, 3));      // 5
System.out.println(multiply.calculate(2, 3)); // 6
```

#### 3. 常用函数式接口

```java
// Predicate<T>：断言，返回 boolean
Predicate<Integer> isEven = n -> n % 2 == 0;
System.out.println(isEven.test(4));  // true

// Function<T, R>：函数，输入 T 输出 R
Function<String, Integer> toLength = s -> s.length();
System.out.println(toLength.apply("Hello"));  // 5

// Consumer<T>：消费者，无返回值
Consumer<String> printer = s -> System.out.println(s);
printer.accept("Hello");  // 输出：Hello

// Supplier<T>：供应者，无输入返回 T
Supplier<Double> random = () -> Math.random();
System.out.println(random.get());  // 0.123...
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：Stream 基础操作

```java
// UserServiceImpl.java
public List<User> getUsersByAge(int minAge) {
    List<User> allUsers = getAllUsers();
    
    // 传统方式
    List<User> result = new ArrayList<>();
    for (User user : allUsers) {
        if (user.getAge() >= minAge) {
            result.add(user);
        }
    }
    return result;
    
    // Stream 方式
    return allUsers.stream()
        .filter(user -> user.getAge() >= minAge)  // 过滤
        .collect(Collectors.toList());  // 收集为 List
}
```

#### 任务 2：添加接口

```java
// UserController.java
@GetMapping("/age/{minAge}")
public Result<List<User>> getUsersByAge(@PathVariable int minAge) {
    return Result.success(userService.getUsersByAge(minAge));
}
```

#### 任务 3：Stream 链式操作

```java
// UserServiceImpl.java
public List<String> getUserNames() {
    return getAllUsers().stream()
        .map(User::getName)  // 转换：提取 name
        .collect(Collectors.toList());
}

public Map<Integer, List<User>> groupUsersByAge() {
    return getAllUsers().stream()
        .collect(Collectors.groupingBy(User::getAge));  // 按年龄分组
}

public List<User> sortUsersByName() {
    return getAllUsers().stream()
        .sorted(Comparator.comparing(User::getName))  // 按名字排序
        .collect(Collectors.toList());
}
```

#### 任务 4：添加更多接口

```java
// UserController.java
@GetMapping("/names")
public Result<List<String>> getUserNames() {
    return Result.success(userService.getUserNames());
}

@GetMapping("/group")
public Result<Map<Integer, List<User>>> groupUsersByAge() {
    return Result.success(userService.groupUsersByAge());
}

@GetMapping("/sorted")
public Result<List<User>> sortUsersByName() {
    return Result.success(userService.sortUsersByName());
}
```

#### 任务 5：测试

```bash
# 测试年龄过滤
curl http://localhost:8081/users/age/25

# 测试提取名字
curl http://localhost:8081/users/names

# 测试分组
curl http://localhost:8081/users/group

# 测试排序
curl http://localhost:8081/users/sorted
```

---

### 📝 今日笔记

1. Lambda 表达式的语法？
2. Stream 的 `map` 和 `filter` 的区别？
3. 为什么说 Stream 是"惰性求值"？
4. 遇到的问题：______
5. 今天的收获：______

---

## Day 9：异常处理 + 全局异常

### 📚 Java 补充（40 分钟）

#### 1. 异常体系

```
Throwable
├── Error（错误，如内存溢出，不处理）
└── Exception（异常）
    ├── RuntimeException（运行时异常，不强制处理）
    │   ├── NullPointerException
    │   ├── IndexOutOfBoundsException
    │   └── IllegalArgumentException
    └── Checked Exception（编译时异常，必须处理）
        ├── IOException
        └── SQLException
```

#### 2. try-catch-finally

```java
try {
    // 可能抛出异常的代码
    int result = 10 / 0;
} catch (ArithmeticException e) {
    // 捕获特定异常
    System.out.println("除零错误：" + e.getMessage());
} catch (Exception e) {
    // 捕获其他异常
    System.out.println("其他错误：" + e.getMessage());
} finally {
    // 无论是否异常都会执行
    System.out.println("finally 块");
}
```

#### 3. throw 和 throws

```java
// throws：声明可能抛出的异常
public void readFile() throws IOException {
    // ...
}

// throw：手动抛出异常
public void checkAge(int age) {
    if (age < 0) {
        throw new IllegalArgumentException("年龄不能为负数");
    }
}
```

#### 4. 自定义异常

```java
// 业务异常
public class BusinessException extends RuntimeException {
    private Integer code;
    
    public BusinessException(String message) {
        super(message);
        this.code = 500;
    }
    
    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
    }
    
    public Integer getCode() {
        return code;
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建自定义异常

```java
// src/main/java/com/example/demo/exception/UserNotFoundException.java
package com.example.demo.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(Long id) {
        super("用户不存在，ID：" + id);
    }
}
```

```java
// src/main/java/com/example/demo/exception/BusinessException.java
package com.example.demo.exception;

public class BusinessException extends RuntimeException {
    private Integer code;
    
    public BusinessException(String message) {
        super(message);
        this.code = 500;
    }
    
    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
    }
    
    public Integer getCode() {
        return code;
    }
}
```

#### 任务 2：在 Service 中抛出异常

```java
// UserServiceImpl.java
@Override
public User getUserById(Long id) {
    User user = userMap.get(id);
    if (user == null) {
        throw new UserNotFoundException(id);  // 抛出自定义异常
    }
    return user;
}

@Override
public User createUser(User user) {
    if (user.getName() == null || user.getName().isEmpty()) {
        throw new BusinessException("用户名不能为空");
    }
    // ...
}
```

#### 任务 3：全局异常处理

```java
// src/main/java/com/example/demo/exception/GlobalExceptionHandler.java
package com.example.demo.exception;

import com.example.demo.common.Result;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice  // 全局异常处理器
public class GlobalExceptionHandler {
    
    // 处理用户不存在异常
    @ExceptionHandler(UserNotFoundException.class)
    public Result<Void> handleUserNotFound(UserNotFoundException e) {
        return Result.error(e.getMessage());
    }
    
    // 处理业务异常
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        return Result.error(e.getMessage());
    }
    
    // 处理其他异常
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        e.printStackTrace();  // 打印堆栈（生产环境用日志）
        return Result.error("系统错误：" + e.getMessage());
    }
}
```

#### 任务 4：测试异常处理

```java
// UserController.java
@GetMapping("/error/{id}")
public Result<User> testError(@PathVariable Long id) {
    return Result.success(userService.getUserById(id));
}

@PostMapping
public Result<User> createUser(@RequestBody User user) {
    return Result.success(userService.createUser(user));
}
```

#### 任务 5：测试

```bash
# 测试用户不存在
curl http://localhost:8081/users/error/999

# 测试业务异常
curl -X POST http://localhost:8081/users \
  -H "Content-Type: application/json" \
  -d '{"name":"","age":20}'
```

---

### 📝 今日笔记

1. `@RestControllerAdvice` 的作用？
2. `@ExceptionHandler` 如何匹配异常？
3. 运行时异常和检查异常的区别？
4. 遇到的问题：______
5. 今天的收获：______

---

## Day 10：阶段复盘 + 项目重构

### 📚 复习要点（40 分钟）

#### 1. IoC 容器加载流程

```
1. 扫描 @SpringBootApplication 所在包及子包
2. 找到带 @Component、@Service、@Controller 等注解的类
3. 创建这些类的实例（Bean）
4. 处理依赖注入（@Autowired）
5. 执行初始化方法（@PostConstruct）
6. 应用启动完成
```

#### 2. 手画流程图

```
┌─────────────────────────────────────────┐
│  SpringApplication.run()               │
│  1. 创建 ApplicationContext            │
│         │                              │
│         ▼                              │
│  2. 扫描 @ComponentScan                │
│     ├─ 找到 @Controller                │
│     ├─ 找到 @Service                   │
│     └─ 找到 @Component                 │
│         │                              │
│         ▼                              │
│  3. 实例化 Bean                        │
│     ├─ 调用构造方法                    │
│     ├─ 依赖注入                        │
│     └─ @PostConstruct                  │
│         │                              │
│         ▼                              │
│  4. 启动 Web 服务器                    │
│     └─ Tomcat 监听 8081 端口           │
│         │                              │
│         ▼                              │
│  5. 应用就绪                            │
└─────────────────────────────────────────┘
```

#### 3. 关键注解总结

| 注解 | 作用 | 使用位置 |
|---|---|---|
| `@SpringBootApplication` | 启动类 | 类 |
| `@RestController` | Web 控制器 | 类 |
| `@GetMapping` | GET 请求映射 | 方法 |
| `@Service` | 服务层 Bean | 类 |
| `@Autowired` | 依赖注入 | 字段/构造方法 |
| `@ConfigurationProperties` | 读取配置 | 类 |
| `@RestControllerAdvice` | 全局异常处理 | 类 |
| `@ExceptionHandler` | 异常处理方法 | 方法 |

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：重构项目结构

```
src/main/java/com/example/demo/
├── DemoApplication.java           # 启动类
├── common/
│   └── Result.java                # 统一返回结果
├── config/
│   └── AppConfig.java             # 配置类
├── controller/
│   └── UserController.java        # 用户控制器
├── service/
│   ├── UserService.java           # 用户服务接口
│   └── impl/
│       └── UserServiceImpl.java   # 用户服务实现
├── model/
│   └── User.java                  # 用户实体
├── repository/
│   └── UserRepository.java        # 用户仓库（预留）
└── exception/
    ├── UserNotFoundException.java # 用户不存在异常
    ├── BusinessException.java     # 业务异常
    └── GlobalExceptionHandler.java # 全局异常处理
```

#### 任务 2：完善 UserRepository

```java
// src/main/java/com/example/demo/repository/UserRepository.java
package com.example.demo.repository;

import com.example.demo.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository {
    Optional<User> findById(Long id);
    List<User> findAll();
    User save(User user);
    void deleteById(Long id);
}
```

```java
// src/main/java/com/example/demo/repository/impl/UserRepositoryImpl.java
package com.example.demo.repository.impl;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class UserRepositoryImpl implements UserRepository {
    
    private final ConcurrentHashMap<Long, User> userMap = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);
    
    public UserRepositoryImpl() {
        // 初始化测试数据
        userMap.put(1L, new User(1L, "张三", 25));
        userMap.put(2L, new User(2L, "李四", 30));
    }
    
    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(userMap.get(id));
    }
    
    @Override
    public List<User> findAll() {
        return new ArrayList<>(userMap.values());
    }
    
    @Override
    public User save(User user) {
        if (user.getId() == null) {
            Long id = idGenerator.getAndIncrement();
            user.setId(id);
        }
        userMap.put(user.getId(), user);
        return user;
    }
    
    @Override
    public void deleteById(Long id) {
        userMap.remove(id);
    }
}
```

#### 任务 3：重构 UserService

```java
// UserServiceImpl.java
@Service
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }
    
    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    @Override
    public User createUser(User user) {
        if (user.getName() == null || user.getName().isEmpty()) {
            throw new BusinessException("用户名不能为空");
        }
        return userRepository.save(user);
    }
    
    @Override
    public void deleteUser(Long id) {
        if (!userRepository.findById(id).isPresent()) {
            throw new UserNotFoundException(id);
        }
        userRepository.deleteById(id);
    }
}
```

#### 任务 4：完善 UserController

```java
// UserController.java
@RestController
@RequestMapping("/users")
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    // 查询单个用户
    @GetMapping("/{id}")
    public Result<User> getUserById(@PathVariable Long id) {
        return Result.success(userService.getUserById(id));
    }
    
    // 查询所有用户
    @GetMapping
    public Result<List<User>> getAllUsers() {
        return Result.success(userService.getAllUsers());
    }
    
    // 创建用户
    @PostMapping
    public Result<User> createUser(@RequestBody User user) {
        return Result.success(userService.createUser(user));
    }
    
    // 删除用户
    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return Result.success();
    }
}
```

#### 任务 5：完整测试

```bash
# 查询所有
curl http://localhost:8081/users

# 查询单个
curl http://localhost:8081/users/1

# 创建用户
curl -X POST http://localhost:8081/users \
  -H "Content-Type: application/json" \
  -d '{"name":"王五","age":28}'

# 删除用户
curl -X DELETE http://localhost:8081/users/3

# 测试异常
curl http://localhost:8081/users/999
```

---

### 📝 阶段总结

#### ✅ 完成的里程碑

1. ✅ 能独立搭建 Spring Boot 项目
2. ✅ 能编写 RESTful CRUD 接口
3. ✅ 理解依赖注入（IoC/DI）
4. ✅ 掌握分层架构（Controller/Service/Repository）
5. ✅ 会用统一返回结果和全局异常处理

#### 📚 掌握的 Java 知识点

1. 包、类路径、import
2. 反射基础
3. 接口与实现
4. 构造方法、this 关键字
5. 泛型、集合
6. 装箱拆箱
7. Lambda 表达式
8. 异常处理

#### 🎯 下一步预告

阶段二将深入学习：
- 抽象类、static、final
- 日期 API、Optional
- 集合进阶（HashMap、ArrayList）
- Stream API 完整链
- 自定义注解

---

**🎉 恭喜完成阶段一！你现在已经能够独立开发一个简单的 Spring Boot Web 应用了！**