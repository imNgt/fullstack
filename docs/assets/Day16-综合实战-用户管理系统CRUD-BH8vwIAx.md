# Day 16：综合实战 - 用户管理系统（CRUD）

### 📚 项目概述（30 分钟）

#### 1. 需求分析

| 功能模块 | 需求描述 | 优先级 |
|---------|---------|--------|
| 用户注册 | 用户通过邮箱和密码注册 | 高 |
| 用户登录 | 邮箱密码登录，返回 JWT Token | 高 |
| 用户列表 | 分页查询所有用户 | 高 |
| 用户详情 | 根据 ID 获取用户信息 | 高 |
| 更新用户 | 修改用户基本信息 | 高 |
| 删除用户 | 删除指定用户 | 高 |
| 角色管理 | 用户角色分配 | 中 |

#### 2. 技术选型

| 分类 | 技术 | 版本 |
|-----|------|------|
| 语言 | Java | 17 |
| 框架 | Spring Boot | 3.2.x |
| 数据库 | MySQL | 8.0+ |
| ORM | Spring Data JPA | 3.2.x |
| 认证 | JWT | - |
| 缓存 | Redis | 7.0+ |
| 文档 | Knife4j | 4.4.x |

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：完整项目结构

```
backend/
├── src/main/java/com/example/app
│   ├── controller/           # REST API
│   │   ├── AuthController.java
│   │   └── UserController.java
│   ├── service/              # 业务逻辑
│   │   ├── UserService.java
│   │   └── impl/
│   │       └── UserServiceImpl.java
│   ├── repository/           # 数据访问
│   │   └── UserRepository.java
│   ├── entity/               # 实体类
│   │   ├── User.java
│   │   └── Role.java
│   ├── dto/                  # 数据传输对象
│   │   ├── request/
│   │   │   ├── LoginRequest.java
│   │   │   ├── RegisterRequest.java
│   │   │   ├── CreateUserRequest.java
│   │   │   └── UpdateUserRequest.java
│   │   └── response/
│   │       ├── UserResponse.java
│   │       └── PageResponse.java
│   ├── config/               # 配置类
│   │   ├── SecurityConfig.java
│   │   └── RedisConfig.java
│   ├── security/             # 安全相关
│   │   ├── JwtUtils.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── UserPrincipal.java
│   ├── common/               # 公共类
│   │   ├── Result.java
│   │   └── BusinessException.java
│   └── Application.java      # 启动类
├── src/main/resources
│   ├── application.yml       # 配置文件
│   └── init.sql              # 初始化脚本
└── pom.xml                   # Maven 配置
```

#### 任务 2：完整 Controller 实现

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping
    public Result<PageResponse<UserResponse>> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        return Result.success(userService.getUsers(page, size));
    }
    
    @GetMapping("/{id}")
    public Result<UserResponse> getUserById(@PathVariable Long id) {
        return Result.success(userService.getUserById(id));
    }
    
    @PostMapping
    public Result<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return Result.success("创建成功", userService.createUser(request));
    }
    
    @PutMapping("/{id}")
    public Result<UserResponse> updateUser(
        @PathVariable Long id, 
        @Valid @RequestBody UpdateUserRequest request) {
        return Result.success("更新成功", userService.updateUser(id, request));
    }
    
    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return Result.success("删除成功", null);
    }
}
```

#### 任务 3：完整 Service 实现

```java
@Service
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage = userRepository.findAll(pageable);
        
        List<UserResponse> content = userPage.getContent().stream()
            .map(UserResponse::fromEntity)
            .collect(Collectors.toList());
        
        return new PageResponse<>(content, (int) userPage.getTotalElements(), page, size);
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        return UserResponse.fromEntity(user);
    }
    
    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        // 检查邮箱
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("邮箱已被注册");
        }
        
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAge(request.getAge());
        
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }
    
    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        
        // 更新字段
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getAge() != null) {
            user.setAge(request.getAge());
        }
        
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }
    
    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new BusinessException(404, "用户不存在");
        }
        userRepository.deleteById(id);
    }
}
```

---

### 📝 今日笔记（5 行）

1. **三层架构**：Controller → Service → Repository 的标准分层
2. **DTO 隔离**：请求和响应使用独立的 DTO，不暴露内部实体
3. **事务管理**：`@Transactional` 注解控制事务边界
4. **异常处理**：统一的业务异常处理，返回标准化错误信息
5. **密码安全**：使用 `PasswordEncoder` 加密密码，不存储明文
