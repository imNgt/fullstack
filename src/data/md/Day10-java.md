# Day 10：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. 多线程基础

**Java 中有三种创建线程的方式：**

```java
// 方式一：继承 Thread 类
public class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Thread running");
    }
}

// 方式二：实现 Runnable 接口（推荐）
public class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("Runnable running");
    }
}

// 方式三：实现 Callable 接口（有返回值）
public class MyCallable implements Callable<String> {
    @Override
    public String call() throws Exception {
        return "Callable result";
    }
}

// 使用示例
Thread t1 = new MyThread();
Thread t2 = new Thread(new MyRunnable());
ExecutorService executor = Executors.newFixedThreadPool(5);
Future<String> future = executor.submit(new MyCallable());
String result = future.get();  // 获取返回值
```

**Thread 类常用方法：**

| 方法 | 说明 |
|-----|------|
| `start()` | 启动线程（不能重复调用） |
| `run()` | 线程执行体（直接调用不会启动新线程） |
| `sleep(long millis)` | 让线程休眠（不会释放锁） |
| `join()` | 等待线程结束 |
| `interrupt()` | 中断线程（设置中断标志） |
| `isInterrupted()` | 检查线程是否被中断 |
| `yield()` | 让出 CPU 执行权 |

#### 2. 线程安全

**线程安全是多线程编程的核心问题：**

```java
// 同步方法
public synchronized void increment() {
    count++;
}

// 同步代码块（更细粒度的锁）
public void increment() {
    synchronized (this) {
        count++;
    }
}

// 使用 Lock（更灵活）
private final Lock lock = new ReentrantLock();

public void increment() {
    lock.lock();
    try {
        count++;
    } finally {
        lock.unlock();  // 确保释放锁
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
    userContext.remove();  // 防止内存泄漏
}
```

**线程安全的实现方式：**

| 方式 | 说明 | 适用场景 |
|-----|------|---------|
| `synchronized` | 内置锁，简单易用 | 一般场景 |
| `Lock` | 显式锁，更灵活 | 需要超时、可中断等高级特性 |
| `Atomic*` | 原子类，无锁编程 | 简单的数值操作 |
| `ThreadLocal` | 线程本地变量 | 上下文传递 |

**Atomic 原子类：**

```java
// 原子整数
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();  // 原子递增
count.addAndGet(5);       // 原子加法

// 原子引用（支持 CAS 操作）
AtomicReference<User> ref = new AtomicReference<>();
User oldUser = new User("张三");
User newUser = new User("李四");
boolean success = ref.compareAndSet(oldUser, newUser);  // CAS
```

#### 3. 线程池

**线程池管理线程的创建和复用：**

```java
// 创建线程池
ExecutorService executor = Executors.newFixedThreadPool(5);
ExecutorService cached = Executors.newCachedThreadPool();  // 弹性线程池
ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(3);

// 提交任务
executor.submit(() -> System.out.println("Task running"));
executor.execute(new MyRunnable());

// 定时任务
scheduler.scheduleAtFixedRate(() -> {
    System.out.println("定时任务");
}, 0, 1000, TimeUnit.MILLISECONDS);

// 关闭线程池
executor.shutdown();  // 优雅关闭
executor.shutdownNow();  // 强制关闭
```

**线程池类型：**

| 类型 | 说明 | 适用场景 |
|-----|------|---------|
| `FixedThreadPool` | 固定大小线程池 | 控制并发数 |
| `CachedThreadPool` | 弹性线程池 | 任务量波动大 |
| `SingleThreadExecutor` | 单线程 | 保证任务顺序执行 |
| `ScheduledThreadPool` | 定时任务线程池 | 定时/周期性任务 |

**ThreadPoolExecutor 构造参数：**

```java
new ThreadPoolExecutor(
    corePoolSize,      // 核心线程数
    maximumPoolSize,   // 最大线程数
    keepAliveTime,     // 空闲线程存活时间
    TimeUnit.SECONDS,  // 时间单位
    new LinkedBlockingQueue<>(),  // 任务队列
    Executors.defaultThreadFactory(),  // 线程工厂
    new AbortPolicy()  // 拒绝策略
);
```

**拒绝策略：**

| 策略 | 说明 |
|-----|------|
| `AbortPolicy` | 抛出异常（默认） |
| `CallerRunsPolicy` | 调用者线程执行 |
| `DiscardPolicy` | 丢弃任务 |
| `DiscardOldestPolicy` | 丢弃队列中最旧的任务 |

#### 4. 设计模式

**常用设计模式：**

```java
// 单例模式（饿汉式）
public class Singleton {
    private static final Singleton instance = new Singleton();
    
    private Singleton() {}  // 私有构造器
    
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

public class VIPDiscount implements DiscountStrategy {
    @Override
    public double calculate(double price) {
        return price * 0.8;
    }
}
```