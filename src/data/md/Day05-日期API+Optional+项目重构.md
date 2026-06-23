# Day 05：日期 API + Optional + 项目重构

### 📚 Java 补充（30 分钟）

#### 1. Java 8 日期时间 API

**Java 8 引入了全新的日期时间 API**，解决了传统 `Date` 和 `Calendar` 的线程安全问题：

```java
// 创建日期时间
LocalDate today = LocalDate.now();                      // 日期（不含时间）
LocalTime now = LocalTime.now();                        // 时间（不含日期）
LocalDateTime dateTime = LocalDateTime.now();           // 日期时间
LocalDateTime specific = LocalDateTime.of(2024, 1, 15, 10, 30);

// 格式化
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
String formatted = dateTime.format(formatter);

// 解析
LocalDateTime parsed = LocalDateTime.parse("2024-01-15 10:30:00", formatter);

// 时间运算（不可变对象）
LocalDateTime tomorrow = today.atStartOfDay().plusDays(1);
LocalDateTime nextWeek = dateTime.plusWeeks(1);
LocalDateTime minusDays = dateTime.minusDays(3);

// 计算时间差
Duration duration = Duration.between(start, end);      // 精确到纳秒
Period period = Period.between(startDate, endDate);    // 精确到年月日

// 获取时间组件
int year = dateTime.getYear();
Month month = dateTime.getMonth();
int dayOfMonth = dateTime.getDayOfMonth();
```

**常用日期时间类对比：**

| 类 | 说明 | 示例 |
|----|------|------|
| `LocalDate` | 日期（不含时间） | 2024-01-15 |
| `LocalTime` | 时间（不含日期） | 10:30:00 |
| `LocalDateTime` | 日期时间 | 2024-01-15T10:30:00 |
| `Instant` | 时间戳（UTC） | 2024-01-15T02:30:00Z |
| `Duration` | 时间段（秒/纳秒） | PT2H30M |
| `Period` | 时间段（年/月/日） | P1Y2M3D |

#### 2. Optional 防空指针

**Optional** 是一个容器对象，可以包含或不包含非 null 值：

```java
// 创建 Optional
Optional<String> empty = Optional.empty();                     // 空
Optional<String> present = Optional.of("value");               // 非空值
Optional<String> nullable = Optional.ofNullable(nullableValue); // 可空

// 安全取值
String result = optional.orElse("default");                    // 默认值
String result2 = optional.orElseGet(() -> computeDefault());    // 延迟计算
String result3 = optional.orElseThrow(() -> new RuntimeException("值不存在"));

// 链式调用（避免嵌套 null 检查）
String name = Optional.ofNullable(user)
    .map(User::getName)
    .orElse("Unknown");

// 条件处理
optional.ifPresent(value -> process(value));                    // 有值时处理
optional.ifPresentOrElse(
    value -> process(value),
    () -> handleEmpty()                                         // 空值时处理
);

// 过滤和映射
Optional<User> adult = optionalUser.filter(u -> u.getAge() >= 18);
Optional<String> upperName = optionalUser.map(User::getName)
    .map(String::toUpperCase);
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：添加创建时间字段

使用 JPA 生命周期注解自动管理时间：

```java
package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private Integer age;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
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
    
    // Getters and Setters
}
```

#### 任务 2：Jackson 日期配置

配置全局日期格式和序列化行为：

```java
package com.example.demo.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class JacksonConfig {
    
    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // 注册 Java 8 日期时间模块
        mapper.registerModule(new JavaTimeModule());
        
        // 禁用将日期写为时间戳
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // 设置全局日期格式
        mapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));
        
        // 序列化时忽略 null 字段
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        
        // 序列化时忽略空集合
        mapper.setSerializationInclusion(JsonInclude.Include.NON_EMPTY);
        
        // 允许空对象序列化
        mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        
        return mapper;
    }
}
```

**通过 application.yml 配置（推荐）：**

```yaml
spring:
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai
    serialization:
      write-dates-as-timestamps: false
      write-null-map-values: false
    default-property-inclusion: non_null
```

#### 任务 3：项目重构 - 三层架构优化

**标准的 Spring Boot 项目结构：**

```
src/main/java/com/example/demo
├── controller/              # REST API 控制层
│   └── UserController.java
├── service/                 # 业务逻辑层
│   ├── UserService.java     # 接口定义
│   └── impl/
│       └── UserServiceImpl.java  # 接口实现
├── repository/              # 数据访问层
│   └── UserRepository.java
├── entity/                  # 数据库实体
│   └── User.java
├── dto/                     # 数据传输对象
│   ├── request/
│   │   ├── CreateUserRequest.java
│   │   └── UpdateUserRequest.java
│   └── response/
│       ├── UserResponse.java
│       └── PageResponse.java
├── config/                  # 配置类
│   ├── JacksonConfig.java
│   └── WebConfig.java
├── common/                  # 公共组件
│   ├── Result.java              # 统一返回结果
│   ├── BusinessException.java   # 业务异常
│   └── GlobalExceptionHandler.java  # 全局异常处理
└── DemoApplication.java     # 启动类
```

**各层职责：**

| 层级 | 职责 | 特点 |
|------|------|------|
| Controller | 处理 HTTP 请求，参数校验 | 不包含业务逻辑 |
| Service | 业务逻辑处理 | 可被多个 Controller 调用 |
| Repository | 数据访问，与数据库交互 | 单表操作为主 |

#### 任务 4：DTO 转换

**请求 DTO（Input DTO）：**

```java
package com.example.demo.dto.request;

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

public class UpdateUserRequest {
    
    @Size(min = 2, max = 50, message = "用户名长度必须在2-50之间")
    private String name;
    
    @Min(value = 1, message = "年龄最小为1")
    @Max(value = 150, message = "年龄最大为150")
    private Integer age;
    
    // Getters and Setters
}
```

**响应 DTO（Output DTO）：**

```java
package com.example.demo.dto.response;

import java.time.LocalDateTime;

public class UserResponse {
    
    private Long id;
    private String name;
    private Integer age;
    private String email;
    private LocalDateTime createdAt;
    
    // 静态工厂方法转换实体
    public static UserResponse fromEntity(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setAge(user.getAge());
        response.setEmail(user.getEmail());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }
    
    // Getters and Setters
}
```

**Service 实现：**

```java
package com.example.demo.service.impl;

import com.example.demo.dto.request.CreateUserRequest;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    
    // 构造器注入（Spring 4.3+ 可省略 @Autowired）
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Override
    public UserResponse createUser(CreateUserRequest request) {
        User user = new User();
        user.setName(request.getName());
        user.setAge(request.getAge());
        user.setEmail(request.getEmail());
        
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }
    
    @Override
    public UserResponse getUserById(Long id) {
        return userRepository.findById(id)
            .map(UserResponse::fromEntity)
            .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }
}
```

#### 任务 5：使用 MapStruct 简化 DTO 转换

**添加依赖：**

```xml
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-processor</artifactId>
    <version>1.5.5.Final</version>
    <scope>provided</scope>
</dependency>
```

**创建 Mapper 接口：**

```java
package com.example.demo.mapper;

import com.example.demo.dto.request.CreateUserRequest;
import com.example.demo.dto.request.UpdateUserRequest;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    
    // 实体转响应 DTO
    UserResponse toResponse(User user);
    
    // 请求 DTO 转实体
    User toEntity(CreateUserRequest request);
    
    // 更新实体（忽略 null 字段）
    void updateEntityFromRequest(UpdateUserRequest request, @MappingTarget User user);
}
```

**使用 Mapper：**

```java
@Service
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    
    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }
    
    @Override
    public UserResponse createUser(CreateUserRequest request) {
        User user = userMapper.toEntity(request);
        User saved = userRepository.save(user);
        return userMapper.toResponse(saved);
    }
    
    @Override
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        
        userMapper.updateEntityFromRequest(request, user);
        User updated = userRepository.save(user);
        return userMapper.toResponse(updated);
    }
}
```

---

### 📝 今日笔记（5 行）

1. **Java 8 日期 API**：`LocalDateTime` 替代 `Date`，线程安全且不可变
2. **Optional**：优雅处理 null，避免空指针异常，推荐用于返回值
3. **DTO**：隔离内部实体，只暴露必要字段，保护数据隐私
4. **三层架构**：Controller（请求处理）→ Service（业务逻辑）→ Repository（数据访问）
5. **MapStruct**：编译时生成 DTO 转换代码，性能优于反射，推荐用于复杂项目
