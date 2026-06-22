# Day 03：泛型 + 统一返回结果 + 配置文件

### Spring 实战（1.5 小时）

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
    name: demo
```

---

### 📝 今日笔记（5 行）

1. 泛型 `<T>` 实现类型安全和代码复用
2. 统一返回结果类使用泛型支持任意数据类型
3. `@RestControllerAdvice` 实现全局异常处理
4. YAML 配置文件比 properties 更易读
5. 装箱拆箱可能导致性能问题，注意避免自动拆箱 NPE
