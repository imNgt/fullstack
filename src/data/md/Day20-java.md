# Day 20：综合实战补充知识

### 📚 性能优化与监控（30 分钟）

#### 1. 数据库优化

**数据库性能优化策略：**

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

// 4. 查询优化（使用 JOIN FETCH 避免 N+1 查询）
@Query("SELECT u FROM User u JOIN FETCH u.roles WHERE u.id = :id")
User findByIdWithRoles(@Param("id") Long id);
```

**索引使用注意事项：**

| 注意事项 | 说明 |
|-----|------|
| **索引不是越多越好** | 过多索引会影响写入性能 |
| **覆盖索引** | 查询只需要访问索引，不需要回表 |
| **复合索引顺序** | 遵循最左前缀原则 |
| **索引选择性** | 高选择性列适合作为索引 |
| **定期重建索引** | 维护索引性能 |

**查询优化技巧：**

| 技巧 | 说明 |
|-----|------|
| **避免 SELECT * | 只查询需要的列 |
| **使用 LIMIT** | 限制返回行数 |
| **避免子查询** | 使用 JOIN 替代 |
| **使用 EXISTS** | 判断存在性时更高效 |
| **分析执行计划** | 使用 EXPLAIN 分析 |

#### 2. 缓存优化

**多级缓存策略：**

```java
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

// 缓存配置
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

**缓存策略对比：**

| 策略 | 说明 | 优点 | 缺点 |
|-----|------|-----|-----|
| **Cache Aside** | 读缓存，写删缓存 | 简单 | 可能出现脏读 |
| **Write Through** | 写缓存同步写数据库 | 数据一致 | 写性能低 |
| **Write Back** | 写缓存异步写数据库 | 写性能高 | 可能丢失数据 |

**缓存问题解决方案：**

| 问题 | 解决方案 |
|-----|---------|
| **缓存击穿** | 热点数据永不过期 或 使用互斥锁 |
| **缓存穿透** | 缓存空值 或 使用布隆过滤器 |
| **缓存雪崩** | 设置随机过期时间 或 多级缓存 |

#### 3. Spring Boot Actuator

**Spring Boot Actuator 提供监控端点：**

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

**常用端点：**

| 端点 | 说明 |
|-----|------|
| `/actuator/health` | 健康检查 |
| `/actuator/info` | 应用信息 |
| `/actuator/metrics` | 指标信息 |
| `/actuator/prometheus` | Prometheus 指标 |
| `/actuator/beans` | Bean 信息 |
| `/actuator/env` | 环境变量 |
| `/actuator/loggers` | 日志配置 |

**自定义健康检查：**

```java
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
```

**自定义指标：**

```java
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

#### 4. JVM 监控

**JVM 监控工具：**

| 工具 | 说明 |
|-----|------|
| **jps** | 列出 Java 进程 |
| **jstat** | 统计 JVM 信息 |
| **jmap** | 生成堆转储快照 |
| **jstack** | 生成线程转储 |
| **jinfo** | 查看 JVM 参数 |
| **VisualVM** | 可视化监控工具 |

**常用监控命令：**

```bash
# 查看 Java 进程
jps

# 查看 GC 统计
jstat -gc <pid> 1000 10

# 生成堆转储
jmap -dump:format=b,file=heap.hprof <pid>

# 生成线程转储
jstack <pid> > threads.txt

# 查看 JVM 参数
jinfo <pid>
```

**监控指标：**

| 指标 | 说明 | 阈值 |
|-----|------|------|
| **CPU** | 处理器使用率 | < 70% |
| **Memory** | 内存使用率 | < 80% |
| **Response Time** | 响应时间 | < 500ms |
| **Error Rate** | 错误率 | < 1% |
| **GC Pause** | GC 停顿时间 | < 100ms |