# Day 05：日期 API + Optional + 项目重构

### 📚 Java 补充（30 分钟）

#### 1. Java 8 日期时间 API

```java
// 创建日期时间
LocalDate today = LocalDate.now();
LocalDateTime now = LocalDateTime.now();
LocalDateTime specific = LocalDateTime.of(2024, 1, 15, 10, 30);

// 格式化
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
String formatted = now.format(formatter);

// 解析
LocalDateTime parsed = LocalDateTime.parse("2024-01-15 10:30:00", formatter);

// 时间运算
LocalDateTime tomorrow = today.plusDays(1).atStartOfDay();
Duration duration = Duration.between(start, end);
```

#### 2. Optional 防空指针

```java
// 创建 Optional
Optional<String> empty = Optional.empty();
Optional<String> present = Optional.of("value");
Optional<String> nullable = Optional.ofNullable(nullableValue);

// 安全取值
String result = optional.orElse("default");
String result = optional.orElseGet(() -> computeDefault());

// 链式调用
String name = Optional.ofNullable(user)
    .map(User::getName)
    .orElse("Unknown");

// 条件处理
optional.ifPresent(value -> process(value));
optional.ifPresentOrElse(
    value -> process(value),
    () -> handleEmpty()
);
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：添加创建时间字段

```java
public class User {
    private Long id;
    private String name;
    private Integer age;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 创建时自动设置时间
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    // 更新时自动设置时间
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

#### 任务 2：Jackson 日期配置

```java
@Configuration
public class JacksonConfig {
    
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Java 8 日期时间支持
        mapper.registerModule(new JavaTimeModule());
        
        // 禁用将日期写为时间戳
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // 设置日期格式
        mapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));
        
        // 忽略空字段
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        
        return mapper;
    }
}
```

#### 任务 3：项目重构 - 三层架构优化

```
重构后的目录结构：
src/main/java/com/example/demo
├── controller/
│   └── UserController.java
├── service/
│   ├── UserService.java
│   └── impl/
│       └── UserServiceImpl.java
├── repository/
│   └── UserRepository.java
├── entity/
│   └── User.java
├── dto/
│   ├── request/
│   │   ├── CreateUserRequest.java
│   │   └── UpdateUserRequest.java
│   └── response/
│       └── UserResponse.java
├── config/
│   ├── JacksonConfig.java
│   └── WebConfig.java
├── common/
│   ├── Result.java
│   ├── BusinessException.java
│   └── GlobalExceptionHandler.java
└── DemoApplication.java
```

#### 任务 4：DTO 转换

```java
// 请求 DTO
public class CreateUserRequest {
    @NotBlank(message = "用户名不能为空")
    private String name;
    
    @NotNull(message = "年龄不能为空")
    @Min(1) @Max(150)
    private Integer age;
}

// 响应 DTO
public class UserResponse {
    private Long id;
    private String name;
    private Integer age;
    private LocalDateTime createdAt;
    
    public static UserResponse fromEntity(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setAge(user.getAge());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }
}

// Service 实现
@Service
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Override
    public UserResponse createUser(CreateUserRequest request) {
        User user = new User();
        user.setName(request.getName());
        user.setAge(request.getAge());
        
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }
}
```

---

### 📝 今日笔记（5 行）

1. **LocalDateTime**：线程安全的日期时间类，替代 Date
2. **Optional**：优雅处理 null，避免空指针异常
3. **DTO**：隔离内部实体，只暴露必要字段给前端
4. **三层架构**：Controller → Service → Repository
5. Jackson 默认不支持 Java 8 日期，需注册 `JavaTimeModule`
