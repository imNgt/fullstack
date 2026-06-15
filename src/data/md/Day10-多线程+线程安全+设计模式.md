# Day 10：多线程 + 线程安全 + 设计模式

### 📚 Java 补充（30 分钟）

#### 1. 多线程基础

```java
// 方式一：继承 Thread
public class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Thread running");
    }
}

// 方式二：实现 Runnable
public class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("Runnable running");
    }
}

// 方式三：Callable（有返回值）
public class MyCallable implements Callable<String> {
    @Override
    public String call() throws Exception {
        return "Callable result";
    }
}

// 使用
Thread t1 = new MyThread();
Thread t2 = new Thread(new MyRunnable());
ExecutorService executor = Executors.newFixedThreadPool(5);
Future<String> future = executor.submit(new MyCallable());
```

#### 2. 线程安全

```java
// 同步方法
public synchronized void increment() {
    count++;
}

// 同步代码块
public void increment() {
    synchronized (this) {
        count++;
    }
}

// ThreadLocal（每个线程独立）
private static ThreadLocal<User> userContext = new ThreadLocal<>();

public static void setUser(User user) {
    userContext.set(user);
}

public static User getUser() {
    return userContext.get();
}

public static void clear() {
    userContext.remove(); // 防止内存泄漏
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：Spring 异步处理

```java
// 配置类
@Configuration
@EnableAsync
public class AsyncConfig {
    
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(25);
        executor.setThreadNamePrefix("Async-");
        executor.initialize();
        return executor;
    }
}

// Service 使用异步
@Service
public class AsyncService {
    
    @Async("taskExecutor")
    public CompletableFuture<String> processAsync(String input) {
        // 模拟耗时操作
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return CompletableFuture.completedFuture("Processed: " + input);
    }
    
    @Async
    public void sendEmail(String to, String subject, String content) {
        // 发送邮件逻辑
        System.out.println("Sending email to: " + to);
    }
}

// Controller
@RestController
@RequestMapping("/api")
public class AsyncController {
    
    @Autowired
    private AsyncService asyncService;
    
    @GetMapping("/async")
    public Result<String> asyncTest() throws Exception {
        CompletableFuture<String> future = asyncService.processAsync("test");
        return Result.success("Async task started. Result: " + future.get());
    }
}
```

#### 任务 2：设计模式实战

```java
// 单例模式（饿汉式）
public class Singleton {
    private static final Singleton instance = new Singleton();
    
    private Singleton() {}
    
    public static Singleton getInstance() {
        return instance;
    }
}

// 工厂模式
public interface Payment {
    void pay(double amount);
}

public class AliPay implements Payment {
    @Override
    public void pay(double amount) {
        System.out.println("支付宝支付: " + amount);
    }
}

public class WeChatPay implements Payment {
    @Override
    public void pay(double amount) {
        System.out.println("微信支付: " + amount);
    }
}

public class PaymentFactory {
    public static Payment createPayment(String type) {
        return switch (type.toLowerCase()) {
            case "alipay" -> new AliPay();
            case "wechat" -> new WeChatPay();
            default -> throw new BusinessException("不支持的支付方式");
        };
    }
}

// 策略模式
public interface DiscountStrategy {
    double calculate(double price);
}

public class NormalDiscount implements DiscountStrategy {
    @Override
    public double calculate(double price) {
        return price;
    }
}

public class VIPDiscount implements DiscountStrategy {
    @Override
    public double calculate(double price) {
        return price * 0.8;
    }
}

@Service
public class OrderService {
    
    private final Map<String, DiscountStrategy> strategies;
    
    @Autowired
    public OrderService(Map<String, DiscountStrategy> strategies) {
        this.strategies = strategies;
    }
    
    public double calculatePrice(double price, String userType) {
        DiscountStrategy strategy = strategies.getOrDefault(userType, new NormalDiscount());
        return strategy.calculate(price);
    }
}
```

---

### 📝 今日笔记（5 行）

1. **线程创建**：继承 Thread、实现 Runnable、使用 Callable
2. **线程安全**：synchronized、Lock、ThreadLocal
3. **Spring 异步**：`@EnableAsync` + `@Async` + 线程池配置
4. **单例模式**：私有构造器 + 静态实例
5. **策略模式**：将算法封装成独立策略，运行时动态切换
