# Day 9：异常处理 + 全局异常

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