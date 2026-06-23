# Day 11：分布式缓存 Redis + Session 共享

### 📚 Java 补充（30 分钟）

#### 1. 缓存基础概念

**缓存分类：**
- **本地缓存**：应用内存中（如 Guava Cache、Caffeine）
- **分布式缓存**：独立服务（如 Redis、Memcached）
- **多级缓存**：本地缓存 + 分布式缓存

**缓存策略：**
- **LRU（最近最少使用）**：淘汰最久未使用的数据
- **LFU（最不经常使用）**：淘汰使用次数最少的数据
- **FIFO（先进先出）**：按顺序淘汰最早进入的数据

```java
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import java.util.concurrent.TimeUnit;

/**
 * Caffeine 本地缓存示例
 */
public class CaffeineCacheExample {
    
    private static final Cache<String, String> cache = Caffeine.newBuilder()
        .maximumSize(1000)           // 最大缓存条数
        .expireAfterWrite(5, TimeUnit.MINUTES)  // 写入后过期时间
        .expireAfterAccess(2, TimeUnit.MINUTES) // 访问后过期时间
        .recordStats()               // 记录统计信息
        .build();
    
    public static void main(String[] args) {
        // 写入缓存
        cache.put("user:1", "张三");
        
        // 读取缓存
        String user = cache.getIfPresent("user:1");
        
        // 带默认值读取
        String defaultValue = cache.get("user:2", key -> loadFromDB(key));
        
        // 移除缓存
        cache.invalidate("user:1");
        
        // 批量移除
        cache.invalidateAll();
    }
    
    private static String loadFromDB(String key) {
        // 模拟从数据库加载
        return "从DB加载的数据";
    }
}
```

#### 2. 分布式锁基础

```java
import redis.clients.jedis.Jedis;

public class RedisLock {
    
    private static final String LOCK_PREFIX = "lock:";
    private static final int LOCK_EXPIRE = 30; // 锁过期时间（秒）
    
    private final Jedis jedis;
    
    public RedisLock(Jedis jedis) {
        this.jedis = jedis;
    }
    
    /**
     * 获取锁
     */
    public boolean acquire(String lockKey, String requestId) {
        String key = LOCK_PREFIX + lockKey;
        // SET key value NX EX seconds
        String result = jedis.set(key, requestId, "NX", "EX", LOCK_EXPIRE);
        return "OK".equals(result);
    }
    
    /**
     * 释放锁（需要校验请求ID，防止误删）
     */
    public boolean release(String lockKey, String requestId) {
        String key = LOCK_PREFIX + lockKey;
        String value = jedis.get(key);
        
        if (requestId.equals(value)) {
            jedis.del(key);
            return true;
        }
        return false;
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：集成 Redis

**添加依赖：**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

**配置 application.yml：**

```yaml
spring:
  redis:
    host: localhost
    port: 6379
    password: 
    database: 0
    timeout: 10000ms
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 2
        max-wait: 10000ms
```

**配置类：**

```java
package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        
        // Key 序列化
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Value 序列化（使用 JSON）
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        
        template.afterPropertiesSet();
        return template;
    }
}
```

#### 任务 2：Redis 基本操作

```java
package com.example.demo.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class RedisService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    
    public RedisService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    /**
     * String 操作
     */
    public void setString(String key, Object value, long timeout) {
        redisTemplate.opsForValue().set(key, value, timeout, TimeUnit.SECONDS);
    }
    
    public Object getString(String key) {
        return redisTemplate.opsForValue().get(key);
    }
    
    public Long increment(String key) {
        return redisTemplate.opsForValue().increment(key);
    }
    
    /**
     * Hash 操作
     */
    public void putHash(String key, String hashKey, Object value) {
        redisTemplate.opsForHash().put(key, hashKey, value);
    }
    
    public Object getHash(String key, String hashKey) {
        return redisTemplate.opsForHash().get(key, hashKey);
    }
    
    public Map<Object, Object> getAllHash(String key) {
        return redisTemplate.opsForHash().entries(key);
    }
    
    /**
     * List 操作
     */
    public void leftPushList(String key, Object value) {
        redisTemplate.opsForList().leftPush(key, value);
    }
    
    public Object rightPopList(String key) {
        return redisTemplate.opsForList().rightPop(key);
    }
    
    public List<Object> rangeList(String key, long start, long end) {
        return redisTemplate.opsForList().range(key, start, end);
    }
    
    /**
     * Set 操作
     */
    public void addSet(String key, Object... values) {
        redisTemplate.opsForSet().add(key, values);
    }
    
    public boolean isMember(String key, Object value) {
        return Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(key, value));
    }
    
    /**
     * ZSet 操作
     */
    public void addZSet(String key, Object value, double score) {
        redisTemplate.opsForZSet().add(key, value, score);
    }
    
    public List<Object> rangeZSet(String key, long start, long end) {
        return redisTemplate.opsForZSet().range(key, start, end);
    }
    
    /**
     * 通用操作
     */
    public boolean exists(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
    
    public void delete(String key) {
        redisTemplate.delete(key);
    }
    
    public void expire(String key, long timeout) {
        redisTemplate.expire(key, timeout, TimeUnit.SECONDS);
    }
}
```

#### 任务 3：Spring Cache 注解

**启用缓存：**

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching  // 启用缓存
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

**缓存注解示例：**

```java
package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.cache.annotation.*;
import org.springframework.stereotype.Service;

@Service
@CacheConfig(cacheNames = "users")
public class UserService {
    
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * 查询用户，缓存结果
     */
    @Cacheable(key = "#id", unless = "#result == null")
    public User getUserById(Long id) {
        System.out.println("从数据库查询用户: " + id);
        return userRepository.findById(id).orElse(null);
    }
    
    /**
     * 更新用户，更新缓存
     */
    @CachePut(key = "#user.id")
    public User updateUser(User user) {
        System.out.println("更新用户: " + user.getId());
        return userRepository.save(user);
    }
    
    /**
     * 删除用户，清除缓存
     */
    @CacheEvict(key = "#id")
    public void deleteUser(Long id) {
        System.out.println("删除用户: " + id);
        userRepository.deleteById(id);
    }
    
    /**
     * 清除所有缓存
     */
    @CacheEvict(allEntries = true)
    public void clearAllCache() {
        System.out.println("清除所有用户缓存");
    }
    
    /**
     * 条件缓存
     */
    @Cacheable(key = "#name", condition = "#name.length() > 2")
    public User getUserByName(String name) {
        System.out.println("从数据库查询用户名称: " + name);
        return userRepository.findByName(name).orElse(null);
    }
}
```

**自定义缓存 Key：**

```java
package com.example.demo.config;

import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.lang.reflect.Method;
import java.util.Arrays;

@Configuration
public class CacheKeyConfig {
    
    @Bean
    @Primary
    public KeyGenerator customKeyGenerator() {
        return (Object target, Method method, Object... params) -> {
            String className = target.getClass().getSimpleName();
            String methodName = method.getName();
            String paramsStr = Arrays.toString(params);
            return className + ":" + methodName + ":" + paramsStr;
        };
    }
}
```

#### 任务 4：分布式 Session 共享

**添加依赖：**

```xml
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
</dependency>
```

**配置 Session：**

```java
package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800) // Session 超时时间（秒）
public class SessionConfig {
    
    /**
     * 配置 Cookie 序列化器
     */
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("SESSION");
        serializer.setCookiePath("/");
        serializer.setDomainNamePattern("^.+?\\.(\\w+\\.[a-z]+)$");
        return serializer;
    }
}
```

**Session 控制器：**

```java
package com.example.demo.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/session")
public class SessionController {
    
    /**
     * 设置 Session
     */
    @PostMapping("/set")
    public Map<String, String> setSession(HttpSession session, 
                                          @RequestParam String key, 
                                          @RequestParam String value) {
        session.setAttribute(key, value);
        
        Map<String, String> result = new HashMap<>();
        result.put("sessionId", session.getId());
        result.put("message", "Session 设置成功");
        return result;
    }
    
    /**
     * 获取 Session
     */
    @GetMapping("/get")
    public Map<String, Object> getSession(HttpSession session, 
                                          @RequestParam String key) {
        Object value = session.getAttribute(key);
        
        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", session.getId());
        result.put("value", value);
        return result;
    }
    
    /**
     * 获取所有 Session 属性
     */
    @GetMapping("/all")
    public Map<String, Object> getAllSession(HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", session.getId());
        result.put("creationTime", session.getCreationTime());
        result.put("lastAccessedTime", session.getLastAccessedTime());
        result.put("maxInactiveInterval", session.getMaxInactiveInterval());
        
        // 获取所有属性
        Map<String, Object> attributes = new HashMap<>();
        session.getAttributeNames().asIterator().forEachRemaining(name -> 
            attributes.put(name, session.getAttribute(name))
        );
        result.put("attributes", attributes);
        
        return result;
    }
    
    /**
     * 销毁 Session
     */
    @DeleteMapping("/invalidate")
    public Map<String, String> invalidateSession(HttpSession session) {
        String sessionId = session.getId();
        session.invalidate();
        
        Map<String, String> result = new HashMap<>();
        result.put("sessionId", sessionId);
        result.put("message", "Session 已销毁");
        return result;
    }
}
```

#### 任务 5：Redis 分布式锁

**分布式锁工具类：**

```java
package com.example.demo.util;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class RedisLockUtil {
    
    private static final String LOCK_PREFIX = "lock:";
    private static final int DEFAULT_EXPIRE = 30; // 默认过期时间（秒）
    
    private final RedisTemplate<String, String> stringRedisTemplate;
    
    public RedisLockUtil(RedisTemplate<String, String> stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }
    
    /**
     * 获取锁
     * @param lockKey 锁的 key
     * @return 锁的标识（用于释放锁）
     */
    public String acquireLock(String lockKey) {
        return acquireLock(lockKey, DEFAULT_EXPIRE);
    }
    
    /**
     * 获取锁
     * @param lockKey 锁的 key
     * @param expireSeconds 过期时间（秒）
     * @return 锁的标识（用于释放锁）
     */
    public String acquireLock(String lockKey, int expireSeconds) {
        String requestId = UUID.randomUUID().toString();
        String key = LOCK_PREFIX + lockKey;
        
        // SET key value NX EX seconds
        Boolean result = stringRedisTemplate.opsForValue()
            .setIfAbsent(key, requestId, expireSeconds, TimeUnit.SECONDS);
        
        return Boolean.TRUE.equals(result) ? requestId : null;
    }
    
    /**
     * 释放锁
     * @param lockKey 锁的 key
     * @param requestId 锁的标识
     * @return 是否释放成功
     */
    public boolean releaseLock(String lockKey, String requestId) {
        String key = LOCK_PREFIX + lockKey;
        String value = stringRedisTemplate.opsForValue().get(key);
        
        if (requestId.equals(value)) {
            stringRedisTemplate.delete(key);
            return true;
        }
        return false;
    }
    
    /**
     * 尝试获取锁（带重试）
     * @param lockKey 锁的 key
     * @param maxRetries 最大重试次数
     * @param retryDelayMs 重试间隔（毫秒）
     * @return 锁的标识
     */
    public String tryAcquireLock(String lockKey, int maxRetries, long retryDelayMs) {
        String lockId = acquireLock(lockKey);
        if (lockId != null) {
            return lockId;
        }
        
        for (int i = 0; i < maxRetries; i++) {
            try {
                Thread.sleep(retryDelayMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return null;
            }
            
            lockId = acquireLock(lockKey);
            if (lockId != null) {
                return lockId;
            }
        }
        
        return null;
    }
}
```

**使用分布式锁：**

```java
package com.example.demo.service;

import com.example.demo.util.RedisLockUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class StockService {
    
    private static final Logger logger = LoggerFactory.getLogger(StockService.class);
    private static final String STOCK_LOCK_KEY = "stock:lock:product:";
    
    private final RedisLockUtil redisLockUtil;
    
    public StockService(RedisLockUtil redisLockUtil) {
        this.redisLockUtil = redisLockUtil;
    }
    
    /**
     * 扣减库存（使用分布式锁）
     */
    public boolean decreaseStock(Long productId, int quantity) {
        String lockKey = STOCK_LOCK_KEY + productId;
        String lockId = null;
        
        try {
            // 获取锁
            lockId = redisLockUtil.acquireLock(lockKey);
            if (lockId == null) {
                logger.warn("获取锁失败，产品ID: {}", productId);
                return false;
            }
            
            // 业务逻辑：查询库存、扣减库存
            logger.info("获取锁成功，开始扣减库存，产品ID: {}", productId);
            
            // 模拟库存扣减
            Thread.sleep(100);
            
            logger.info("库存扣减成功，产品ID: {}", productId);
            return true;
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("扣减库存中断，产品ID: {}", productId);
            return false;
        } finally {
            // 释放锁
            if (lockId != null) {
                redisLockUtil.releaseLock(lockKey, lockId);
                logger.info("释放锁成功，产品ID: {}", productId);
            }
        }
    }
}
```

#### 任务 6：缓存与数据库一致性

**解决方案：**

1. **双写一致性**：更新数据库后更新缓存
2. **失效优先**：更新数据库后删除缓存（推荐）
3. **读写分离**：读缓存，写数据库 + 删除缓存
4. **延迟双删**：写数据库 → 删除缓存 → 延迟再删一次

**缓存失效策略示例：**

```java
package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.RedisService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserCacheService {
    
    private static final String USER_CACHE_PREFIX = "user:";
    
    private final UserRepository userRepository;
    private final RedisService redisService;
    
    public UserCacheService(UserRepository userRepository, RedisService redisService) {
        this.userRepository = userRepository;
        this.redisService = redisService;
    }
    
    /**
     * 获取用户（缓存优先）
     */
    public User getUser(Long id) {
        String cacheKey = USER_CACHE_PREFIX + id;
        
        // 先从缓存获取
        Object cached = redisService.getString(cacheKey);
        if (cached != null) {
            return (User) cached;
        }
        
        // 缓存未命中，从数据库获取
        User user = userRepository.findById(id).orElse(null);
        
        // 写入缓存
        if (user != null) {
            redisService.setString(cacheKey, user, 3600); // 1小时过期
        }
        
        return user;
    }
    
    /**
     * 更新用户（更新数据库后删除缓存）
     */
    @Transactional
    public User updateUser(User user) {
        User updated = userRepository.save(user);
        
        // 更新数据库后删除缓存（下次查询会重新加载）
        String cacheKey = USER_CACHE_PREFIX + user.getId();
        redisService.delete(cacheKey);
        
        return updated;
    }
    
    /**
     * 删除用户（删除数据库后删除缓存）
     */
    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
        
        // 删除缓存
        String cacheKey = USER_CACHE_PREFIX + id;
        redisService.delete(cacheKey);
    }
}
```

---

### 📝 今日笔记（5 行）

1. **Redis**：高性能分布式缓存，支持多种数据结构（String、Hash、List、Set、ZSet）
2. **Spring Cache**：通过注解（@Cacheable、@CachePut、@CacheEvict）简化缓存操作
3. **分布式 Session**：使用 Redis 存储 Session，实现多实例 Session 共享
4. **分布式锁**：使用 Redis 的 SET NX 命令实现，需要注意锁的过期和释放
5. **缓存一致性**：推荐使用"更新数据库 + 删除缓存"策略，避免缓存脏数据