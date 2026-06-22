# Day 19：综合实战补充知识

### 📚 异步任务与消息队列（30 分钟）

#### 1. Spring 异步处理

**Spring 提供声明式异步支持：**

```java
// 异步配置类
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {
    
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);        // 核心线程数
        executor.setMaxPoolSize(10);        // 最大线程数
        executor.setQueueCapacity(100);     // 队列容量
        executor.setThreadNamePrefix("AsyncTask-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }
    
    @Bean(name = "emailExecutor")
    public Executor emailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("EmailTask-");
        executor.initialize();
        return executor;
    }
}

// 异步服务
@Service
public class AsyncTaskService {
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private LogService logService;
    
    @Async("emailExecutor")
    public CompletableFuture<Void> sendWelcomeEmail(String email, String name) {
        emailService.sendEmail(email, "欢迎注册", "您好 " + name + "，欢迎加入我们！");
        return CompletableFuture.completedFuture(null);
    }
    
    @Async("taskExecutor")
    public void logUserAction(Long userId, String action, String detail) {
        UserActionLog log = new UserActionLog();
        log.setUserId(userId);
        log.setAction(action);
        log.setDetail(detail);
        log.setCreatedAt(LocalDateTime.now());
        logService.save(log);
    }
    
    @Scheduled(cron = "0 0 2 * * ?")  // 每天凌晨 2 点执行
    public void syncData() {
        System.out.println("开始同步数据...");
        // syncExternalData();
        System.out.println("数据同步完成");
    }
    
    @Scheduled(fixedRate = 300000)  // 每 5 分钟执行
    public void cleanExpiredTokens() {
        tokenRepository.deleteExpiredTokens();
    }
}
```

**异步方法调用：**

```java
@Service
public class UserServiceImpl {
    
    @Autowired
    private AsyncTaskService asyncTaskService;
    
    public UserResponse createUser(CreateUserRequest request) {
        // 创建用户逻辑...
        
        // 异步发送邮件（不等待结果）
        asyncTaskService.sendWelcomeEmail(user.getEmail(), user.getName());
        
        // 异步记录日志
        asyncTaskService.logUserAction(user.getId(), "CREATE_USER", 
            "用户注册: " + user.getName());
        
        return UserResponse.fromEntity(user);
    }
}
```

**@Async 注解属性：**

| 属性 | 说明 |
|-----|------|
| `value` | 指定线程池名称 |
| `asyncResult` | 返回 Future 类型 |

**@Scheduled 注解属性：**

| 属性 | 说明 | 示例 |
|-----|------|------|
| `cron` | cron 表达式 | `"0 0 2 * * ?"` |
| `fixedRate` | 固定间隔执行（毫秒） | `300000` |
| `fixedDelay` | 固定延迟执行（毫秒） | `5000` |
| `initialDelay` | 初始延迟（毫秒） | `1000` |

#### 2. 消息队列基础

**消息队列用于解耦和异步处理：**

```java
// RabbitMQ 配置
@Configuration
public class RabbitMQConfig {
    
    public static final String USER_EXCHANGE = "user.exchange";
    public static final String USER_QUEUE = "user.queue";
    public static final String USER_ROUTING_KEY = "user.#";
    
    @Bean
    public Exchange userExchange() {
        return ExchangeBuilder.topicExchange(USER_EXCHANGE).durable(true).build();
    }
    
    @Bean
    public Queue userQueue() {
        return QueueBuilder.durable(USER_QUEUE).build();
    }
    
    @Bean
    public Binding binding(Exchange userExchange, Queue userQueue) {
        return BindingBuilder.bind(userQueue).to(userExchange).with(USER_ROUTING_KEY).noargs();
    }
    
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}

// 生产者
@Component
public class UserEventProducer {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    public void publishUserCreated(Long userId, String userName) {
        UserCreatedEvent event = new UserCreatedEvent(userId, userName, LocalDateTime.now());
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.USER_EXCHANGE, 
            "user.created", 
            event
        );
    }
}

// 消费者
@Component
public class UserEventListener {
    
    @RabbitListener(queues = RabbitMQConfig.USER_QUEUE)
    public void handleUserCreated(UserCreatedEvent event) {
        System.out.printf("收到用户创建事件: userId=%d, userName=%s%n", 
            event.getUserId(), event.getUserName());
        
        // 处理事件：发送邮件、记录日志等
        // emailService.sendWelcomeEmail(event.getUserName());
    }
}

// 事件类
@Data
public class UserCreatedEvent {
    private Long userId;
    private String userName;
    private LocalDateTime createdAt;
    
    public UserCreatedEvent(Long userId, String userName, LocalDateTime createdAt) {
        this.userId = userId;
        this.userName = userName;
        this.createdAt = createdAt;
    }
}
```

**消息队列对比：**

| 特性 | RabbitMQ | Kafka |
|-----|----------|-------|
| **可靠性** | 高 | 中等 |
| **吞吐量** | 中等 | 高 |
| **延迟** | 低 | 中低 |
| **持久化** | 支持 | 支持 |
| **适用场景** | 企业级消息传递 | 大数据/实时流 |
| **消息顺序** | 单队列保证 | 分区内保证 |

**消息模式：**

| 模式 | 说明 |
|-----|------|
| **点对点** | 一个消息只被一个消费者消费 |
| **发布/订阅** | 一个消息被多个消费者消费 |
| **主题** | 基于模式匹配的发布/订阅 |

#### 3. 异步任务最佳实践

**异步任务的注意事项：**

| 注意事项 | 说明 |
|-----|------|
| **线程池配置** | 根据业务需求配置合适的线程池大小 |
| **异常处理** | 异步方法中的异常需要单独处理 |
| **日志记录** | 记录异步任务的执行情况 |
| **资源清理** | 确保异步任务完成后清理资源 |
| **任务监控** | 监控异步任务的执行状态 |

**异步任务监控：**

```java
// 自定义监控指标
@Component
public class AsyncMetrics {
    
    private final Counter asyncTaskCounter;
    private final Counter asyncTaskErrorCounter;
    
    public AsyncMetrics(MeterRegistry registry) {
        this.asyncTaskCounter = Counter.builder("async.task.total")
            .description("Total number of async tasks executed")
            .register(registry);
        
        this.asyncTaskErrorCounter = Counter.builder("async.task.errors")
            .description("Total number of async task errors")
            .register(registry);
    }
    
    public void recordTask() {
        asyncTaskCounter.increment();
    }
    
    public void recordError() {
        asyncTaskErrorCounter.increment();
    }
}
```