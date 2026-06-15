# Day 03：泛型 + 统一返回结果 + 配置文件

### 📚 Java 补充（30 分钟）

#### 1. 泛型基础

```java
// 泛型类
public class Result<T> {
    private T data;
    private int code;
    
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
}

// 泛型方法
public <T> List<T> filter(List<T> list, Predicate<T> predicate) {
    return list.stream().filter(predicate).collect(Collectors.toList());
}

// 通配符
public void process(List<?> list) {
    for (Object obj : list) {
        System.out.println(obj);
    }
}
```

#### 2. 装箱与拆箱

```java
// 自动装箱
Integer num = 10;  // 等价于 Integer.valueOf(10)

// 自动拆箱
int value = num;   // 等价于 num.intValue()

// 注意：null 拆箱会报 NullPointerException
Integer nullable = null;
// int x = nullable;  // 运行时异常
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建统一返回结果类

```java
package com.example.demo.common;

public class Result<T> {
    
    private int code;
    private String message;
    private T data;
    
    private Result(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
    
    // 成功
    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }
    
    // 成功（带消息）
    public static <T> Result<T> success(String message, T data) {
        return new Result<>(200, message, data);
    }
    
    // 失败
    public static <T> Result<T> error(int code, String message) {
        return new Result<>(code, message, null);
    }
    
    // 失败（默认 500）
    public static <T> Result<T> error(String message) {
        return new Result<>(500, message, null);
    }
    
    // Getters
    public int getCode() { return code; }
    public String getMessage() { return message; }
    public T getData() { return data; }
}
```

#### 任务 2：修改 Controller 使用统一返回

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    
    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping
    public Result<List<User>> getAllUsers() {
        return Result.success(userService.getAllUsers());
    }
    
    @GetMapping("/{id}")
    public Result<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        if (user == null) {
            return Result.error(404, "用户不存在");
        }
        return Result.success(user);
    }
    
    @PostMapping
    public Result<User> createUser(@RequestBody User user) {
        return Result.success("创建成功", userService.createUser(user));
    }
    
    @PutMapping("/{id}")
    public Result<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        User updated = userService.updateUser(id, user);
        if (updated == null) {
            return Result.error(404, "用户不存在");
        }
        return Result.success("更新成功", updated);
    }
    
    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return Result.success("删除成功", null);
    }
}
```

#### 任务 3：配置 application.yml

```yaml
server:
  port: 8080

spring:
  application:
    name: demo-app

# 自定义配置
app:
  version: 1.0.0
  description: Spring Boot Demo Application

logging:
  level:
    com.example.demo: DEBUG
    org.springframework.web: INFO
```

#### 任务 4：读取自定义配置

```java
@Component
@ConfigurationProperties(prefix = "app")
public class AppConfig {
    
    private String version;
    private String description;
    
    // Getters and Setters
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getDescription() { return description; }
}

// 在 Controller 中使用
@RestController
@RequestMapping("/api")
public class AppController {
    
    @Autowired
    private AppConfig appConfig;
    
    @GetMapping("/info")
    public Result<Map<String, String>> getAppInfo() {
        Map<String, String> info = new HashMap<>();
        info.put("version", appConfig.getVersion());
        info.put("description", appConfig.getDescription());
        return Result.success(info);
    }
}
```

---

### 📝 今日笔记（5 行）

1. **泛型**：`Result<T>` 实现类型安全的统一返回
2. `@ConfigurationProperties` 批量读取配置文件
3. 配置文件支持 YAML 和 Properties 两种格式
4. 统一返回格式：`{ "code": 200, "message": "...", "data": {...} }`
5. 装箱拆箱可能影响性能，频繁操作建议使用基本类型
