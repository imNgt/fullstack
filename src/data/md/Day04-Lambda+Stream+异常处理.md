# Day 04：Lambda + Stream + 异常处理

### 📚 Java 补充（30 分钟）

#### 1. Lambda 表达式

**Lambda 表达式**是 Java 8 引入的函数式编程特性，用于简化匿名内部类的写法：

```java
// 无参数无返回值
Runnable runnable = () -> System.out.println("Hello");

// 单参数（可省略括号）
Consumer<String> consumer = s -> System.out.println(s);

// 多参数
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;

// 代码块（需要 return）
Comparator<Integer> comparator = (a, b) -> {
    System.out.println("comparing");
    return a.compareTo(b);
};
```

**函数式接口**：只有一个抽象方法的接口，可以使用 Lambda 表达式实现：

| 接口 | 方法签名 | 用途 |
|------|---------|------|
| `Runnable` | `void run()` | 无参无返回值任务 |
| `Consumer<T>` | `void accept(T t)` | 消费一个参数 |
| `Supplier<T>` | `T get()` | 提供一个返回值 |
| `Function<T,R>` | `R apply(T t)` | 转换一个值 |
| `Predicate<T>` | `boolean test(T t)` | 判断条件 |

#### 2. Stream API

**Stream API** 提供了声明式的数据处理方式：

```java
List<User> users = Arrays.asList(
    new User(1L, "张三", 20),
    new User(2L, "李四", 25),
    new User(3L, "王五", 30)
);

// 过滤 + 映射 + 收集
List<String> names = users.stream()
    .filter(u -> u.getAge() > 20)      // 过滤年龄大于20的用户
    .map(User::getName)                 // 提取用户名
    .collect(Collectors.toList());      // 收集到列表

// 统计
long count = users.stream()
    .filter(u -> u.getAge() < 30)
    .count();

// 分组
Map<String, List<User>> groupByFirstChar = users.stream()
    .collect(Collectors.groupingBy(u -> u.getName().substring(0, 1)));

// 排序 + 限制
List<User> sortedUsers = users.stream()
    .sorted(Comparator.comparingInt(User::getAge))
    .limit(2)
    .collect(Collectors.toList());
```

#### 3. Optional 防空指针

```java
// 创建 Optional
Optional<String> optional = Optional.of("hello");
Optional<String> empty = Optional.empty();
Optional<String> nullable = Optional.ofNullable(null);

// 安全获取值
String value = optional.orElse("default");
String result = nullable.orElseGet(() -> "computed");

// 链式操作
String name = userRepository.findById(1L)
    .map(User::getName)
    .orElse("Unknown");
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：全局异常处理

使用 `@RestControllerAdvice` 实现统一异常处理：

```java
package com.example.demo.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    /**
     * 处理自定义业务异常
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<Void>> handleBusinessException(BusinessException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Result.error(e.getCode(), e.getMessage()));
    }
    
    /**
     * 处理参数校验异常 (@Valid)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Result<Void>> handleValidationException(
            MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Result.error(400, message));
    }
    
    /**
     * 处理参数类型转换异常
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Result<Void>> handleTypeMismatchException(
            MethodArgumentTypeMismatchException e) {
        String message = "参数 '" + e.getName() + "' 类型错误";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Result.error(400, message));
    }
    
    /**
     * 处理资源未找到异常
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Result<Void>> handleResourceNotFoundException(
            ResourceNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Result.error(404, e.getMessage()));
    }
    
    /**
     * 处理其他未知异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<Void>> handleException(Exception e) {
        // 生产环境应记录日志
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

// 资源未找到异常
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
```

#### 任务 2：添加参数校验

添加 `spring-boot-starter-validation` 依赖后使用校验注解：

```java
package com.example.demo.dto;

import jakarta.validation.constraints.*;

public class CreateUserRequest {
    
    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 50, message = "用户名长度必须在2-50之间")
    private String name;
    
    @NotNull(message = "年龄不能为空")
    @Min(value = 1, message = "年龄最小为1")
    @Max(value = 150, message = "年龄最大为150")
    private Integer age;
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    // Getters and Setters
}

// 修改 Controller
@PostMapping
public Result<User> createUser(@Valid @RequestBody CreateUserRequest request) {
    return Result.success("创建成功", userService.createUser(request));
}
```

**常用校验注解：**

| 注解 | 说明 |
|------|------|
| `@NotBlank` | 字符串不为空且长度 > 0 |
| `@NotNull` | 值不为 null |
| `@NotEmpty` | 集合/数组不为空 |
| `@Min/@Max` | 数值范围 |
| `@Size` | 字符串/集合长度 |
| `@Email` | 邮箱格式 |
| `@Pattern` | 正则表达式匹配 |

#### 任务 3：添加分页支持

```java
// 分页请求 DTO
public class PageRequest {
    @Min(value = 0, message = "页码不能为负数")
    private int page = 0;
    
    @Min(value = 1, message = "每页数量至少为1")
    @Max(value = 100, message = "每页数量最多为100")
    private int size = 10;
    
    // Getters and Setters
}

// 分页响应
public class PageResponse<T> {
    private List<T> content;      // 当前页数据
    private long totalElements;    // 总记录数
    private int totalPages;        // 总页数
    private int currentPage;       // 当前页码
    private int pageSize;          // 每页大小
    
    public PageResponse(List<T> content, long totalElements, int currentPage, int pageSize) {
        this.content = content;
        this.totalElements = totalElements;
        this.currentPage = currentPage;
        this.pageSize = pageSize;
        this.totalPages = (int) Math.ceil((double) totalElements / pageSize);
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

1. **Lambda**：简化匿名内部类，语法 `(参数) -> { 代码 }`，只能用于函数式接口
2. **Stream API**：声明式数据处理，支持 filter/map/collect/groupingBy/sorted
3. `@RestControllerAdvice` + `@ExceptionHandler` 实现全局异常处理，统一响应格式
4. `@Valid` 配合 Jakarta Validation 注解实现参数校验，需添加 validation 依赖
5. 分页响应标准结构：content（数据）、totalElements（总数）、totalPages（总页）、currentPage（当前页）
