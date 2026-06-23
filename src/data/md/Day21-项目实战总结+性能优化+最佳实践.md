# Day 21：项目实战总结 + 性能优化 + 最佳实践

### 📚 Java 补充（30 分钟）

#### 1. 设计模式回顾

```java
// 单例模式
public class Singleton {
    private static volatile Singleton instance;
    
    private Singleton() {}
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}

// 工厂模式
public interface Product {
    void use();
}

public class ConcreteProduct implements Product {
    @Override
    public void use() {
        System.out.println("使用产品");
    }
}

public class Factory {
    public static Product createProduct() {
        return new ConcreteProduct();
    }
}
```

#### 2. 代码规范示例

```java
/**
 * 用户服务
 * 
 * <p>提供用户的增删改查功能</p>
 */
@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    
    /**
     * 构造函数注入
     * @param userRepository 用户仓储
     */
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * 根据 ID 获取用户
     * @param id 用户 ID
     * @return 用户信息
     * @throws BusinessException 当用户不存在时抛出
     */
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        
        logger.info("获取用户成功: userId={}", id);
        return UserResponse.fromEntity(user);
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：性能优化策略

**数据库优化：**

```java
// 使用批量操作
@Transactional
public void batchSaveUsers(List<User> users) {
    // 分批插入，每批 1000 条
    int batchSize = 1000;
    for (int i = 0; i < users.size(); i += batchSize) {
        int end = Math.min(i + batchSize, users.size());
        userRepository.saveAll(users.subList(i, end));
    }
}

// 使用 FetchType.LAZY 延迟加载
@Entity
public class User {
    @OneToMany(fetch = FetchType.LAZY)
    private List<Order> orders;
}

// 使用索引
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_username", columnList = "username")
})
public class User {
    // ...
}
```

**缓存优化：**

```java
@Service
public class UserCacheService {
    
    private static final String CACHE_KEY_PREFIX = "user:";
    private static final long CACHE_EXPIRE = 3600; // 1小时
    
    @Cacheable(value = "users", key = "#id")
    public UserResponse getUserById(Long id) {
        return userRepository.findById(id)
            .map(UserResponse::fromEntity)
            .orElseThrow(() -> new BusinessException(404, "用户不存在"));
    }
    
    @CachePut(value = "users", key = "#user.id")
    public UserResponse updateUser(User user) {
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }
    
    @CacheEvict(value = "users", key = "#id")
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
```

#### 任务 2：连接池优化

**配置 HikariCP：**

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000
      max-lifetime: 1200000
      validation-timeout: 5000
      leak-detection-threshold: 60000
```

**配置 Redis 连接池：**

```yaml
spring:
  redis:
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 2
        max-wait: 10000ms
```

#### 任务 3：异步处理优化

```java
@Service
public class AsyncOptimizedService {
    
    @Async("taskExecutor")
    public CompletableFuture<List<User>> fetchUsersAsync() {
        List<User> users = userRepository.findAll();
        return CompletableFuture.completedFuture(users);
    }
    
    @Async("taskExecutor")
    public CompletableFuture<List<Order>> fetchOrdersAsync() {
        List<Order> orders = orderRepository.findAll();
        return CompletableFuture.completedFuture(orders);
    }
    
    /**
     * 并行获取数据
     */
    public Map<String, Object> fetchDataParallel() throws ExecutionException, InterruptedException {
        CompletableFuture<List<User>> usersFuture = fetchUsersAsync();
        CompletableFuture<List<Order>> ordersFuture = fetchOrdersAsync();
        
        // 等待所有任务完成
        CompletableFuture.allOf(usersFuture, ordersFuture).get();
        
        return Map.of(
            "users", usersFuture.get(),
            "orders", ordersFuture.get()
        );
    }
}
```

#### 任务 4：代码质量保障

**使用 Lombok 简化代码：**

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private Integer age;
    
    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .age(user.getAge())
            .build();
    }
}
```

**使用 DTO 隔离实体：**

```java
// 请求 DTO
public record CreateUserRequest(String username, String email, Integer age) {}

// 响应 DTO
public record UserResponse(Long id, String username, String email) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail());
    }
}
```

#### 任务 5：API 文档

**Swagger/OpenAPI 配置：**

```java
@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "示例 API",
        version = "1.0.0",
        description = "示例项目 API 文档"
    )
)
public class OpenApiConfig {
    
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("示例 API")
                .version("1.0.0")
                .description("示例项目 API 文档"));
    }
}
```

**控制器注解：**

```java
@RestController
@RequestMapping("/api/users")
@Tag(name = "用户管理", description = "用户相关操作")
public class UserController {
    
    @GetMapping("/{id}")
    @Operation(summary = "获取用户", description = "根据 ID 获取用户信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "成功"),
        @ApiResponse(responseCode = "404", description = "用户不存在")
    })
    public ResponseEntity<UserResponse> getUserById(
            @Parameter(description = "用户 ID") @PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }
}
```

#### 任务 6：安全最佳实践

```java
// 密码加密
@Service
public class PasswordService {
    
    private final PasswordEncoder passwordEncoder;
    
    public PasswordService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }
    
    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
    
    public boolean matches(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
}

// XSS 防护
@Component
public class XssFilter implements Filter {
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        XssHttpServletRequestWrapper wrapper = new XssHttpServletRequestWrapper((HttpServletRequest) request);
        chain.doFilter(wrapper, response);
    }
}

// SQL 注入防护（使用参数化查询）
@Query("SELECT u FROM User u WHERE u.email = :email")
User findByEmail(@Param("email") String email);
```

---

### 📝 今日笔记（5 行）

1. **性能优化**：包括数据库索引、缓存策略、批量操作、异步处理等
2. **连接池配置**：合理配置 HikariCP 和 Redis 连接池参数
3. **代码质量**：使用 Lombok 简化代码，DTO 模式隔离实体
4. **API 文档**：使用 OpenAPI/Swagger 自动生成文档
5. **安全防护**：密码加密、XSS 防护、SQL 注入防护