# Day 04：Lambda + Stream + 异常处理

### 📚 Java 补充（30 分钟）

#### 1. Lambda 表达式

```java
// 无参数无返回值
Runnable runnable = () -> System.out.println("Hello");

// 单参数
Consumer<String> consumer = (s) -> System.out.println(s);
// 或省略括号
Consumer<String> consumer2 = s -> System.out.println(s);

// 多参数
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;

// 代码块
Comparator<Integer> comparator = (a, b) -> {
    System.out.println("comparing");
    return a.compareTo(b);
};
```

#### 2. Stream API

```java
List<User> users = Arrays.asList(
    new User(1L, "张三", 20),
    new User(2L, "李四", 25),
    new User(3L, "王五", 30)
);

// 过滤 + 映射 + 收集
List<String> names = users.stream()
    .filter(u -> u.getAge() > 20)
    .map(User::getName)
    .collect(Collectors.toList());

// 统计
long count = users.stream()
    .filter(u -> u.getAge() < 30)
    .count();

// 分组
Map<String, List<User>> groupByFirstChar = users.stream()
    .collect(Collectors.groupingBy(u -> u.getName().substring(0, 1)));
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：全局异常处理

```java
package com.example.demo.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // 处理自定义业务异常
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<Void>> handleBusinessException(BusinessException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Result.error(e.getCode(), e.getMessage()));
    }
    
    // 处理参数校验异常
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Result<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Result.error(400, message));
    }
    
    // 处理其他未知异常
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<Void>> handleException(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Result.error(500, "服务器内部错误"));
    }
}

// 自定义业务异常
public class BusinessException extends RuntimeException {
    
    private int code;
    
    public BusinessException(String message) {
        super(message);
        this.code = 400;
    }
    
    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }
    
    public int getCode() { return code; }
}
```

#### 任务 2：添加参数校验

```java
package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public class CreateUserRequest {
    
    @NotBlank(message = "用户名不能为空")
    private String name;
    
    @NotNull(message = "年龄不能为空")
    @Min(value = 1, message = "年龄最小为1")
    @Max(value = 150, message = "年龄最大为150")
    private Integer age;
    
    // Getters and Setters
}

// 修改 Service
@Service
public class UserService {
    
    public User createUser(CreateUserRequest request) {
        User user = new User();
        user.setName(request.getName());
        user.setAge(request.getAge());
        user.setId(nextId++);
        userMap.put(user.getId(), user);
        return user;
    }
}

// 修改 Controller
@PostMapping
public Result<User> createUser(@Valid @RequestBody CreateUserRequest request) {
    return Result.success("创建成功", userService.createUser(request));
}
```

#### 任务 3：添加分页支持

```java
// 分页请求
public class PageRequest {
    private int page = 0;
    private int size = 10;
    
    // Getters and Setters
}

// 分页响应
public class PageResponse<T> {
    private List<T> content;
    private int totalElements;
    private int totalPages;
    private int currentPage;
    
    public PageResponse(List<T> content, int totalElements, int currentPage, int size) {
        this.content = content;
        this.totalElements = totalElements;
        this.currentPage = currentPage;
        this.totalPages = (int) Math.ceil((double) totalElements / size);
    }
    
    // Getters
}

// Service 方法
public PageResponse<User> getUsers(int page, int size) {
    List<User> allUsers = new ArrayList<>(userMap.values());
    
    int fromIndex = page * size;
    int toIndex = Math.min(fromIndex + size, allUsers.size());
    
    List<User> pageContent = fromIndex < allUsers.size() 
        ? allUsers.subList(fromIndex, toIndex) 
        : new ArrayList<>();
    
    return new PageResponse<>(pageContent, allUsers.size(), page, size);
}

// Controller
@GetMapping
public Result<PageResponse<User>> getUsers(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size) {
    return Result.success(userService.getUsers(page, size));
}
```

---

### 📝 今日笔记（5 行）

1. **Lambda**：简化匿名内部类，语法 `(参数) -> { 代码 }`
2. **Stream API**：链式操作，支持 filter/map/collect/groupingBy
3. `@RestControllerAdvice` + `@ExceptionHandler` 实现全局异常处理
4. `@Valid` + `@NotBlank/@NotNull` 实现参数校验
5. 分页响应包含：数据列表、总条数、总页数、当前页码
