# Day 20：综合实战 - 性能优化 + 监控

### 📚 性能优化（30 分钟）

#### 1. 优化策略

| 层次 | 优化点 | 方案 |
|-----|-------|------|
| 数据库 | 查询慢 | 索引、分页、缓存 |
| 代码 | 重复计算 | 缓存、懒加载 |
| JVM | 内存溢出 | 调整堆大小、GC 调优 |
| 网络 | 请求频繁 | 合并请求、CDN |
| 并发 | 线程阻塞 | 异步处理、线程池 |

#### 2. 监控指标

| 指标 | 说明 | 阈值 |
|-----|------|------|
| CPU | 处理器使用率 | < 70% |
| Memory | 内存使用率 | < 80% |
| Response Time | 响应时间 | < 500ms |
| Error Rate | 错误率 | < 1% |
| QPS | 每秒请求数 | 根据业务 |

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：数据库优化

```java
// 1. 添加索引
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_created_at", columnList = "created_at")
})
public class User {
    // ...
}

// 2. 延迟加载（只在需要时加载关联数据）
@Entity
public class User {
    @ManyToMany(fetch = FetchType.LAZY)  // 默认 LAZY
    @JoinTable(name = "user_role", ...)
    private Set<Role> roles = new HashSet<>();
}

// 3. 批量操作
@Service
public class BatchService {
    
    @Autowired
    private EntityManager entityManager;
    
    @Transactional
    public <T> void batchSave(List<T> entities, int batchSize) {
        for (int i = 0; i < entities.size(); i++) {
            entityManager.persist(entities.get(i));
            if ((i + 1) % batchSize == 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
        entityManager.flush();
        entityManager.clear();
    }
}

// 4. 查询优化
@Query("SELECT u FROM User u JOIN FETCH u.roles WHERE u.id = :id")
User findByIdWithRoles(@Param("id") Long id);
```

#### 任务 2：缓存优化

```java
// 1. 多级缓存策略
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CacheManager cacheManager;
    
    private static final String CACHE_NAME = "users";
    
    @Cacheable(value = CACHE_NAME, key = "#id")
    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
    
    @CachePut(value = CACHE_NAME, key = "#user.id")
    public User saveUser(User user) {
        return userRepository.save(user);
    }
    
    @CacheEvict(value = CACHE_NAME, key = "#id")
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    
    // 手动管理缓存
    public void evictUserCache(Long id) {
        cacheManager.getCache(CACHE_NAME).evict(id);
    }
}

// 2. 缓存配置
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))  // 默认过期时间
            .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new Jackson2JsonRedisSerializer<>(Object.class)));
        
        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .build();
    }
}
```

#### 任务 3：监控集成（Spring Boot Actuator）

```yaml
# pom.xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always
  metrics:
    export:
      prometheus:
        enabled: true
```

```java
// 自定义健康检查
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    
    @Autowired
    private DataSource dataSource;
    
    @Override
    public Health health() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(1)) {
                return Health.up().withDetail("database", "MySQL is running").build();
            }
            return Health.down().withDetail("database", "Connection invalid").build();
        } catch (SQLException e) {
            return Health.down(e).build();
        }
    }
}

// 自定义指标
@Component
public class UserMetrics {
    
    private final Counter userCreatedCounter;
    private final Counter userDeletedCounter;
    
    public UserMetrics(MeterRegistry registry) {
        this.userCreatedCounter = Counter.builder("user.created.total")
            .description("Total number of users created")
            .register(registry);
        
        this.userDeletedCounter = Counter.builder("user.deleted.total")
            .description("Total number of users deleted")
            .register(registry);
    }
    
    public void recordUserCreated() {
        userCreatedCounter.increment();
    }
    
    public void recordUserDeleted() {
        userDeletedCounter.increment();
    }
}
```

---

### 📝 今日笔记（5 行）

1. **索引优化**：合理添加索引，避免全表扫描
2. **缓存策略**：Spring Cache + Redis 实现数据缓存
3. **批量操作**：使用 `EntityManager` 分批提交，避免内存溢出
4. **Actuator**：提供健康检查、指标监控等端点
5. **自定义指标**：使用 Micrometer 收集业务指标
