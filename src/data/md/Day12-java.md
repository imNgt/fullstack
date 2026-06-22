# Day 12：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. Redis 数据类型

**Redis 是一个高性能的键值存储系统，支持多种数据类型：**

| 类型 | 说明 | 常用命令 |
|-----|------|---------|
| **String** | 字符串 | SET, GET, INCR, DECR, APPEND |
| **Hash** | 哈希表 | HSET, HGET, HGETALL, HMSET |
| **List** | 列表 | LPUSH, LPOP, RPUSH, RPOP, LRANGE |
| **Set** | 无序集合 | SADD, SMEMBERS, SINTER, SUNION |
| **ZSet** | 有序集合 | ZADD, ZRANGE, ZRANK, ZSCORE |
| **Stream** | 消息流 | XADD, XREAD, XGROUP |
| **Bitmap** | 位图 | SETBIT, GETBIT, BITCOUNT |
| **HyperLogLog** | 基数统计 | PFADD, PFCOUNT |

**String 类型操作：**

```java
// Jedis（同步阻塞）
Jedis jedis = new Jedis("localhost", 6379);
jedis.set("key", "value");
String value = jedis.get("key");
jedis.incr("counter");  // 原子递增
jedis.expire("key", 60);  // 过期时间 60 秒

// Lettuce（异步响应式，Spring 默认）
RedisClient client = RedisClient.create("redis://localhost:6379");
StatefulRedisConnection<String, String> connection = client.connect();
RedisCommands<String, String> commands = connection.sync();
commands.set("key", "value");
commands.setEx("key", 60, "value");  // 设置值并指定过期时间
```

**Hash 类型操作：**

```java
// 存储对象
Map<String, String> user = new HashMap<>();
user.put("name", "张三");
user.put("age", "25");
jedis.hset("user:1", user);

// 获取对象
Map<String, String> result = jedis.hgetAll("user:1");
String name = jedis.hget("user:1", "name");

// 批量操作
jedis.hmget("user:1", "name", "age");
```

#### 2. 缓存策略

**常见的缓存策略：**

```java
// Cache Aside 模式（读时缓存，写时删除）
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    private static final String CACHE_KEY_PREFIX = "user:";
    
    public User getUserById(Long id) {
        String key = CACHE_KEY_PREFIX + id;
        
        // 先从缓存获取
        User user = (User) redisTemplate.opsForValue().get(key);
        if (user != null) {
            return user;
        }
        
        // 缓存不存在，从数据库获取
        user = userRepository.findById(id).orElse(null);
        
        // 更新缓存
        if (user != null) {
            redisTemplate.opsForValue().set(key, user, Duration.ofMinutes(30));
        }
        
        return user;
    }
    
    public void updateUser(User user) {
        // 更新数据库
        userRepository.save(user);
        
        // 删除缓存
        String key = CACHE_KEY_PREFIX + user.getId();
        redisTemplate.delete(key);
    }
}
```

**缓存策略对比：**

| 策略 | 说明 | 优点 | 缺点 |
|-----|------|-----|-----|
| **Cache Aside** | 读缓存，写删缓存 | 简单 | 可能出现脏读 |
| **Write Through** | 写缓存同步写数据库 | 数据一致 | 写性能低 |
| **Write Back** | 写缓存异步写数据库 | 写性能高 | 可能丢失数据 |
| **Read Through** | 缓存负责读取数据库 | 简化代码 | 实现复杂 |

**缓存击穿、穿透、雪崩：**

```java
// 缓存击穿（热点 key 过期）
// 解决方案：热点数据永不过期 或 使用互斥锁

// 缓存穿透（查询不存在的数据）
// 解决方案：缓存空值 或 使用布隆过滤器

// 缓存雪崩（大量缓存同时过期）
// 解决方案：设置随机过期时间 或 多级缓存
```

#### 3. 分布式锁

**使用 Redis 实现分布式锁：**

```java
public class RedisLock {
    
    private final RedisTemplate<String, String> redisTemplate;
    private static final String LOCK_PREFIX = "lock:";
    private static final long DEFAULT_EXPIRE = 30000;  // 30秒
    
    public RedisLock(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    // 获取锁
    public boolean lock(String key, String requestId) {
        Boolean result = redisTemplate.opsForValue().setIfAbsent(
            LOCK_PREFIX + key, 
            requestId, 
            DEFAULT_EXPIRE, 
            TimeUnit.MILLISECONDS
        );
        return Boolean.TRUE.equals(result);
    }
    
    // 释放锁（防止误删别人的锁）
    public boolean unlock(String key, String requestId) {
        String lockKey = LOCK_PREFIX + key;
        String value = redisTemplate.opsForValue().get(lockKey);
        
        if (requestId.equals(value)) {
            redisTemplate.delete(lockKey);
            return true;
        }
        return false;
    }
    
    // 带超时的锁
    public boolean tryLock(String key, String requestId, long timeout) throws InterruptedException {
        long start = System.currentTimeMillis();
        while (System.currentTimeMillis() - start < timeout) {
            if (lock(key, requestId)) {
                return true;
            }
            Thread.sleep(100);  // 重试间隔
        }
        return false;
    }
}
```

**Redlock 算法（分布式锁的高可用方案）：**

```
1. 获取当前时间
2. 依次向 N 个 Redis 实例请求锁
3. 如果超过 N/2 + 1 个实例成功，且总耗时小于锁过期时间，则锁成功
4. 如果锁失败，释放所有已获取的锁
```

#### 4. 消息队列

**Redis 作为消息队列：**

```java
// 生产者
public void sendMessage(String channel, String message) {
    jedis.publish(channel, message);
}

// 消费者（订阅模式）
public void subscribe(String channel) {
    JedisPubSub subscriber = new JedisPubSub() {
        @Override
        public void onMessage(String channel, String message) {
            System.out.println("收到消息: " + message);
        }
    };
    jedis.subscribe(subscriber, channel);
}

// 使用 List 实现队列
public void pushToQueue(String queue, String message) {
    jedis.rpush(queue, message);
}

public String popFromQueue(String queue) {
    return jedis.lpop(queue);
}

// 阻塞弹出（防止轮询）
public String bpopFromQueue(String queue) {
    List<String> result = jedis.blpop(0, queue);
    return result != null && !result.isEmpty() ? result.get(1) : null;
}
```