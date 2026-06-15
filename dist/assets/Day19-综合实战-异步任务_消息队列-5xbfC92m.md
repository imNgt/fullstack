# Day 19：综合实战 - 异步任务 + 消息队列

### 📚 异步处理（30 分钟）

#### 1. 异步场景

| 场景 | 描述 | 方案 |
|-----|------|------|
| 发送邮件 | 用户注册后发送欢迎邮件 | @Async |
| 数据同步 | 定时同步外部数据 | @Scheduled |
| 消息通知 | 订单创建后通知相关服务 | RabbitMQ/Kafka |
| 日志处理 | 异步记录操作日志 | 线程池 |

#### 2. 消息队列对比

| 特性 | RabbitMQ | Kafka |
|-----|----------|-------|
| 可靠性 | 高 | 中等 |
| 吞吐量 | 中等 | 高 |
| 延迟 | 低 | 中低 |
| 适用场景 | 企业级消息传递 | 大数据/实时流 |

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：异步任务配置

```java
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {
    
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
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
```

#### 任务 2：异步服务

```java
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
        // 同步外部数据
        System.out.println("开始同步数据...");
        // syncExternalData();
        System.out.println("数据同步完成");
    }
    
    @Scheduled(fixedRate = 300000)  // 每 5 分钟执行
    public void cleanExpiredTokens() {
        // 清理过期的 Token
        tokenRepository.deleteExpiredTokens();
    }
}

// 使用
@Service
public class UserServiceImpl {
    
    @Autowired
    private AsyncTaskService asyncTaskService;
    
    public UserResponse createUser(CreateUserRequest request) {
        // ... 创建用户逻辑
        
        // 异步发送邮件
        asyncTaskService.sendWelcomeEmail(user.getEmail(), user.getName());
        
        // 异步记录日志
        asyncTaskService.logUserAction(user.getId(), "CREATE_USER", 
            "用户注册: " + user.getName());
        
        return UserResponse.fromEntity(user);
    }
}
```

#### 任务 3：RabbitMQ 集成

```yaml
# pom.xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>

# application.yml
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
```

```java
// 配置类
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

---

### 📝 今日笔记（5 行）

1. **@Async**：标记异步方法，Spring 自动提交到线程池执行
2. **@Scheduled**：定时任务，支持 cron 表达式和固定间隔
3. **RabbitMQ**：消息队列，实现服务解耦和异步处理
4. **RabbitTemplate**：Spring AMQP 封装的消息发送模板
5. **@RabbitListener**：标记消息消费者方法
