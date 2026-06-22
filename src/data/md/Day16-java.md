# Day 16：综合实战补充知识

### 📚 项目架构（30 分钟）

#### 1. 三层架构

**标准的 Spring Boot 项目分层：**

```
src/main/java/com/example/app
├── controller/      # REST API 控制层
│   ├── AuthController.java
│   └── UserController.java
├── service/         # 业务逻辑层
│   ├── UserService.java（接口）
│   └── impl/
│       └── UserServiceImpl.java（实现）
├── repository/      # 数据访问层
│   └── UserRepository.java
├── entity/          # 数据库实体
│   ├── User.java
│   └── Role.java
├── dto/             # 数据传输对象
│   ├── request/
│   │   ├── LoginRequest.java
│   │   └── CreateUserRequest.java
│   └── response/
│       ├── UserResponse.java
│       └── PageResponse.java
├── config/          # 配置类
│   ├── SecurityConfig.java
│   └── RedisConfig.java
├── security/        # 安全相关
│   ├── JwtUtils.java
│   └── JwtAuthenticationFilter.java
├── common/          # 公共类
│   ├── Result.java
│   └── BusinessException.java
└── Application.java  # 启动类
```

**各层职责：**

| 层级 | 职责 | 说明 |
|-----|------|------|
| **Controller** | 处理 HTTP 请求 | 接收请求、参数校验、调用 Service、返回响应 |
| **Service** | 业务逻辑处理 | 核心业务逻辑、事务管理、调用 Repository |
| **Repository** | 数据库访问 | 数据查询、更新操作 |
| **Entity** | 数据库映射 | 与数据库表一一对应 |
| **DTO** | 数据传输 | 请求/响应数据结构，隔离内部实体 |

#### 2. DTO 设计

**DTO（Data Transfer Object）用于数据传输：**

```java
// 请求 DTO
public class CreateUserRequest {
    @NotBlank(message = "用户名不能为空")
    @Size(max = 100, message = "用户名长度不能超过100")
    private String name;
    
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @NotNull(message = "年龄不能为空")
    @Min(value = 1, message = "年龄最小为1")
    @Max(value = 150, message = "年龄最大为150")
    private Integer age;
    
    // Getters and Setters
}

// 响应 DTO
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private Integer age;
    private LocalDateTime createdAt;
    
    // 从实体转换
    public static UserResponse fromEntity(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setAge(user.getAge());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }
    
    // Getters and Setters
}

// 分页响应 DTO
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
```

**DTO 设计原则：**

| 原则 | 说明 |
|-----|------|
| **隔离性** | DTO 与 Entity 分离，不暴露内部实现 |
| **单一职责** | 一个 DTO 只用于一种场景 |
| **验证规则** | 在 DTO 上添加验证注解 |
| **转换方法** | 提供 `fromEntity()` 静态方法 |
| **避免循环引用** | 响应 DTO 不包含关联实体 |

#### 3. 统一返回结果

**标准化的 API 响应格式：**

```java
public class Result<T> {
    private int code;
    private String message;
    private T data;
    private long timestamp;
    
    private Result(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }
    
    // 成功响应
    public static <T> Result<T> success() {
        return new Result<>(200, "success", null);
    }
    
    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }
    
    public static <T> Result<T> success(String message, T data) {
        return new Result<>(200, message, data);
    }
    
    // 错误响应
    public static <T> Result<T> error(int code, String message) {
        return new Result<>(code, message, null);
    }
    
    public static <T> Result<T> error(String message) {
        return new Result<>(500, message, null);
    }
    
    // Getters and Setters
}

// 使用示例
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping("/{id}")
    public Result<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return Result.success(user);
    }
    
    @PostMapping
    public Result<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse user = userService.createUser(request);
        return Result.success("创建成功", user);
    }
}
```

**HTTP 状态码：**

| 状态码 | 说明 | 使用场景 |
|-------|------|---------|
| **200** | OK | 成功获取/更新/删除 |
| **201** | Created | 成功创建 |
| **400** | Bad Request | 请求参数错误 |
| **401** | Unauthorized | 未认证 |
| **403** | Forbidden | 无权限 |
| **404** | Not Found | 资源不存在 |
| **500** | Internal Server Error | 服务器内部错误 |

#### 4. 异常处理

**全局异常处理：**

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // 处理业务异常
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<Void>> handleBusinessException(BusinessException e) {
        return ResponseEntity.status(e.getCode() >= 500 ? HttpStatus.INTERNAL_SERVER_ERROR : HttpStatus.BAD_REQUEST)
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
        // 记录日志
        log.error("Unexpected error", e);
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
    
    public int getCode() {
        return code;
    }
}
```