# Day 19：分布式事务 + Seata + CAP 理论

### 📚 Java 补充（30 分钟）

#### 1. 事务基础

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class TransactionExample {
    
    public void transferMoney(Long fromAccount, Long toAccount, Double amount) 
            throws SQLException {
        
        Connection conn = null;
        
        try {
            conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/example", "user", "password");
            conn.setAutoCommit(false); // 开启事务
            
            // 扣减转出账户
            // updateAccount(conn, fromAccount, -amount);
            
            // 增加转入账户
            // updateAccount(conn, toAccount, amount);
            
            conn.commit(); // 提交事务
            
        } catch (SQLException e) {
            if (conn != null) {
                conn.rollback(); // 回滚事务
            }
            throw e;
        } finally {
            if (conn != null) {
                conn.close();
            }
        }
    }
}
```

#### 2. CAP 理论

```
CAP 理论：分布式系统不可能同时满足以下三点：

┌─────────────────────────────────────────────────────────────┐
│                        CAP 三角                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│      Consistency (一致性)                                   │
│         │                                                   │
│         │                                                   │
│         ├── 分布式事务：确保所有节点数据一致                 │
│         └── ACID：原子性、一致性、隔离性、持久性             │
│                                                             │
│      Availability (可用性)                                  │
│         │                                                   │
│         │                                                   │
│         ├── 快速响应                                        │
│         └── 故障转移                                        │
│                                                             │
│      Partition Tolerance (分区容错)                         │
│         │                                                   │
│         │                                                   │
│         ├── 网络分区                                        │
│         └── 节点故障                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

权衡策略：
- CP：优先保证一致性和分区容错（如银行系统）
- AP：优先保证可用性和分区容错（如电商系统）
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：Seata 集成

**添加依赖：**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>io.seata</groupId>
    <artifactId>seata-spring-boot3-starter</artifactId>
    <version>2.0.0</version>
</dependency>
```

**配置 application.yml：**

```yaml
seata:
  enabled: true
  application-id: ${spring.application.name}
  tx-service-group: my_tx_group
  config:
    type: nacos
    nacos:
      server-addr: localhost:8848
      group: SEATA_GROUP
      namespace:
  registry:
    type: nacos
    nacos:
      server-addr: localhost:8848
      group: SEATA_GROUP
      namespace:
```

**启动类添加注解：**

```java
@SpringBootApplication
@EnableAutoDataSourceProxy
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

#### 任务 2：全局事务示例

```java
package com.example.demo.service;

import io.seata.spring.annotation.GlobalTransactional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final StockService stockService;
    private final PaymentService paymentService;
    
    public OrderService(OrderRepository orderRepository, 
                       StockService stockService, 
                       PaymentService paymentService) {
        this.orderRepository = orderRepository;
        this.stockService = stockService;
        this.paymentService = paymentService;
    }
    
    /**
     * 全局事务：创建订单、扣减库存、扣款
     */
    @GlobalTransactional(name = "create-order-transaction", rollbackFor = Exception.class)
    public void createOrder(Long productId, Long userId, Integer quantity) {
        // 1. 创建订单
        Order order = new Order();
        order.setProductId(productId);
        order.setUserId(userId);
        order.setQuantity(quantity);
        order.setStatus("PENDING");
        orderRepository.save(order);
        
        // 2. 扣减库存（调用库存服务）
        stockService.reduceStock(productId, quantity);
        
        // 3. 扣款（调用支付服务）
        paymentService.deductBalance(userId, calculateAmount(productId, quantity));
    }
    
    private Double calculateAmount(Long productId, Integer quantity) {
        // 计算订单金额
        return 100.0 * quantity;
    }
}
```

**库存服务：**

```java
@Service
public class StockService {
    
    @Transactional
    public void reduceStock(Long productId, Integer quantity) {
        Stock stock = stockRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("商品不存在"));
        
        if (stock.getQuantity() < quantity) {
            throw new RuntimeException("库存不足");
        }
        
        stock.setQuantity(stock.getQuantity() - quantity);
        stockRepository.save(stock);
    }
}
```

**支付服务：**

```java
@Service
public class PaymentService {
    
    @Transactional
    public void deductBalance(Long userId, Double amount) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        if (user.getBalance() < amount) {
            throw new RuntimeException("余额不足");
        }
        
        user.setBalance(user.getBalance() - amount);
        userRepository.save(user);
    }
}
```

#### 任务 3：TCC 事务模式

```java
package com.example.demo.service;

import io.seata.rm.tcc.api.BusinessActionContext;
import io.seata.rm.tcc.api.LocalTCC;
import io.seata.rm.tcc.api.TwoPhaseBusinessAction;
import org.springframework.stereotype.Service;

@LocalTCC
@Service
public interface PaymentTccService {
    
    /**
     * 第一阶段：尝试扣款
     */
    @TwoPhaseBusinessAction(name = "payment-try", commitMethod = "commit", rollbackMethod = "rollback")
    boolean prepare(BusinessActionContext context, Long userId, Double amount);
    
    /**
     * 第二阶段：提交
     */
    boolean commit(BusinessActionContext context);
    
    /**
     * 第二阶段：回滚
     */
    boolean rollback(BusinessActionContext context);
}
```

**TCC 实现：**

```java
@Service
public class PaymentTccServiceImpl implements PaymentTccService {
    
    @Override
    public boolean prepare(BusinessActionContext context, Long userId, Double amount) {
        // 冻结账户余额
        User user = userRepository.findById(userId).orElseThrow();
        user.setFrozenBalance(user.getFrozenBalance() + amount);
        user.setBalance(user.getBalance() - amount);
        userRepository.save(user);
        
        // 保存上下文
        context.setActionContext("userId", userId);
        context.setActionContext("amount", amount);
        
        return true;
    }
    
    @Override
    public boolean commit(BusinessActionContext context) {
        Long userId = context.getActionContext("userId", Long.class);
        Double amount = context.getActionContext("amount", Double.class);
        
        // 扣减冻结余额（完成扣款）
        User user = userRepository.findById(userId).orElseThrow();
        user.setFrozenBalance(user.getFrozenBalance() - amount);
        userRepository.save(user);
        
        return true;
    }
    
    @Override
    public boolean rollback(BusinessActionContext context) {
        Long userId = context.getActionContext("userId", Long.class);
        Double amount = context.getActionContext("amount", Double.class);
        
        // 回滚：恢复余额
        User user = userRepository.findById(userId).orElseThrow();
        user.setBalance(user.getBalance() + amount);
        user.setFrozenBalance(user.getFrozenBalance() - amount);
        userRepository.save(user);
        
        return true;
    }
}
```

#### 任务 4：消息最终一致性

```java
package com.example.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderServiceWithMQ {
    
    private final OrderRepository orderRepository;
    private final MessageProducer messageProducer;
    
    public OrderServiceWithMQ(OrderRepository orderRepository, MessageProducer messageProducer) {
        this.orderRepository = orderRepository;
        this.messageProducer = messageProducer;
    }
    
    /**
     * 使用消息队列实现最终一致性
     */
    @Transactional
    public void createOrder(Long productId, Long userId, Integer quantity) {
        // 1. 创建订单（状态为待处理）
        Order order = new Order();
        order.setProductId(productId);
        order.setUserId(userId);
        order.setQuantity(quantity);
        order.setStatus("PENDING");
        orderRepository.save(order);
        
        // 2. 发送消息到消息队列
        OrderMessage message = new OrderMessage(order.getId(), productId, quantity);
        messageProducer.sendOrderMessage(message);
        
        // 3. 更新订单状态为已发送
        order.setStatus("PROCESSING");
        orderRepository.save(order);
    }
}
```

**消息消费者：**

```java
@Component
public class OrderMessageConsumer {
    
    private final StockService stockService;
    private final PaymentService paymentService;
    private final OrderRepository orderRepository;
    
    @RabbitListener(queues = "order.queue")
    public void handleOrderMessage(OrderMessage message) {
        Long orderId = message.getOrderId();
        
        try {
            // 1. 扣减库存
            stockService.reduceStock(message.getProductId(), message.getQuantity());
            
            // 2. 扣款
            paymentService.deductBalance(findUserIdByOrder(orderId), calculateAmount(message));
            
            // 3. 更新订单状态为成功
            updateOrderStatus(orderId, "SUCCESS");
            
        } catch (Exception e) {
            // 更新订单状态为失败
            updateOrderStatus(orderId, "FAILED");
            throw e;
        }
    }
}
```

#### 任务 5：分布式锁防止重复处理

```java
package com.example.demo.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class DistributedLockService {
    
    private static final String LOCK_PREFIX = "lock:order:";
    private static final int LOCK_EXPIRE = 30; // 秒
    
    private final RedisTemplate<String, String> redisTemplate;
    
    public DistributedLockService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    /**
     * 获取分布式锁
     */
    public String acquireLock(Long orderId) {
        String lockKey = LOCK_PREFIX + orderId;
        String requestId = UUID.randomUUID().toString();
        
        Boolean result = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, requestId, LOCK_EXPIRE, TimeUnit.SECONDS);
        
        return Boolean.TRUE.equals(result) ? requestId : null;
    }
    
    /**
     * 释放分布式锁
     */
    public boolean releaseLock(Long orderId, String requestId) {
        String lockKey = LOCK_PREFIX + orderId;
        String value = redisTemplate.opsForValue().get(lockKey);
        
        if (requestId.equals(value)) {
            redisTemplate.delete(lockKey);
            return true;
        }
        return false;
    }
}
```

---

### 📝 今日笔记（5 行）

1. **CAP 理论**：分布式系统无法同时满足一致性、可用性、分区容错，需要权衡选择
2. **Seata**：阿里开源的分布式事务解决方案，支持 AT、TCC、Saga 等模式
3. **全局事务**：使用 `@GlobalTransactional` 注解标记需要全局事务的方法
4. **TCC 模式**：Try-Confirm-Cancel，适用于需要自定义回滚逻辑的场景
5. **最终一致性**：通过消息队列异步处理，保证数据最终一致