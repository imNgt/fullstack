# Day 12：Redis 集成 + Spring Cache

### 📚 Java 补充（30 分钟）

#### 1. Redis 数据类型

| 类型 | 说明 | 常用命令 |
|-----|------|---------|
| String | 字符串 | SET, GET, INCR, DECR |
| Hash | 哈希表 | HSET, HGET, HGETALL |
| List | 列表 | LPUSH, LPOP, LRANGE |
| Set | 无序集合 | SADD, SMEMBERS, SINTER |
| ZSet | 有序集合 | ZADD, ZRANGE, ZRANK |

#### 2. Jedis vs Lettuce

```java
// Jedis (同步阻塞)
Jedis jedis = new Jedis("localhost", 6379);
jedis.set("key", "value");
String value = jedis.get("key");

// Lettuce (异步响应式，Spring 默认)
RedisClient client = RedisClient.create("redis://localhost:6379");
StatefulRedisConnection<String, String> connection = client.connect();
RedisCommands<String, String> commands = connection.sync();
commands.set("key", "value");
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：配置 Redis

```yaml
# pom.xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

# application.yml
spring:
  redis:
    host: localhost
    port: 6379
    password:
    database: 0
    timeout: 3000ms
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
```

#### 任务 2：RedisTemplate 配置

```java
@Configuration
public class RedisConfig {
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        
        // JSON 序列化配置
        Jackson2JsonRedisSerializer<Object> serializer = new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        serializer.setObjectMapper(mapper);
        
        // Key 序列化
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Value 序列化
        template.setValueSerializer(serializer);
        template.setHashValueSerializer(serializer);
        
        template.afterPropertiesSet();
        return template;
    }
}
```

#### 任务 3：使用 Spring Cache

```java
// 启用缓存
@SpringBootApplication
@EnableCaching
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

// Service 使用缓存
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RedisTemplate<String, User> redisTemplate;
    
    private static final String CACHE_KEY_PREFIX = "user:";
    
    @Cacheable(value = "users", key = "#id")
    public User getUserById(Long id) {
        // 缓存不存在时执行，结果自动存入缓存
        return userRepository.findById(id).orElse(null);
    }
    
    @CachePut(value = "users", key = "#user.id")
    public User updateUser(User user) {
        // 更新数据后同步更新缓存
        return userRepository.save(user);
    }
    
    @CacheEvict(value = "users", key = "#id")
    public void deleteUser(Long id) {
        // 删除数据时清除缓存
        userRepository.deleteById(id);
    }
    
    @CacheEvict(value = "users", allEntries = true)
    public void clearCache() {
        // 清除所有缓存
    }
}

// 手动操作缓存
public class CacheService {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    public void set(String key, Object value, long seconds) {
        redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(seconds));
    }
    
    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }
    
    public void delete(String key) {
        redisTemplate.delete(key);
    }
    
    // Hash 操作
    public void hSet(String key, String field, Object value) {
        redisTemplate.opsForHash().put(key, field, value);
    }
    
    public Object hGet(String key, String field) {
        return redisTemplate.opsForHash().get(key, field);
    }
}
```

---

### 📝 今日笔记（5 行）

1. **RedisTemplate**：Spring 封装的 Redis 操作模板，支持多种数据类型
2. **Spring Cache**：`@Cacheable`/`@CachePut`/`@CacheEvict` 简化缓存操作
3. **缓存策略**：Cache Aside 模式（读时缓存，写时删除）
4. **序列化**：使用 Jackson 序列化对象，支持 Java 8 日期
5. **过期时间**：设置合理的过期时间防止缓存无限增长
