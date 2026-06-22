# Day 06：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. HashMap 原理

**HashMap 是 Java 中最常用的键值对集合，底层采用数组 + 链表/红黑树实现：**

```java
HashMap<String, Integer> map = new HashMap<>();
map.put("key", 1);
Integer value = map.get("key");

// 重要方法
V put(K key, V value)      // 添加或更新元素
V get(Object key)          // 获取元素
boolean containsKey(Object key)
Set<K> keySet()
Collection<V> values()
Set<Map.Entry<K,V>> entrySet()
```

**HashMap 核心特性：**

| 特性 | 说明 |
|-----|------|
| 初始容量 | 默认 16 |
| 负载因子 | 默认 0.75 |
| 扩容阈值 | 容量 × 负载因子 |
| 最大容量 | 2^30 |
| 线程安全 | 不安全（多线程用 ConcurrentHashMap） |
| key/value 可为 null | 是（Hashtable 不允许） |

**HashMap 数据结构演进：**

```
JDK 7: 数组 + 链表
JDK 8: 数组 + 链表/红黑树（链表长度 >= 8 时转为红黑树）

数组索引计算：hash(key) & (length - 1)
```

#### 2. ArrayList vs LinkedList

**两种 List 实现的对比：**

| 特性 | ArrayList | LinkedList |
|-----|-----------|------------|
| 底层实现 | 动态数组 | 双向链表 |
| 随机访问 | O(1) | O(n) |
| 头部插入/删除 | O(n) | O(1) |
| 尾部插入/删除 | O(1)（扩容时 O(n)） | O(1) |
| 内存占用 | 连续内存，有扩容预留 | 每个节点有额外指针开销 |
| 适用场景 | 频繁读取、少量增删 | 频繁插入删除、队列操作 |

**ArrayList 扩容机制：**

```java
// 默认初始容量 10
ArrayList<String> list = new ArrayList<>();

// 扩容时新容量 = 旧容量 × 1.5
// 扩容时会创建新数组并复制元素，成本较高

// 预估容量时指定初始容量，避免频繁扩容
ArrayList<String> list = new ArrayList<>(100);
```

**LinkedList 特有方法：**

```java
LinkedList<String> queue = new LinkedList<>();

// 队列操作
queue.offer("first");  // 尾部添加
String first = queue.poll();  // 头部移除

// 双端队列操作
queue.offerFirst("head");
queue.offerLast("tail");
String head = queue.pollFirst();
String tail = queue.pollLast();
```

#### 3. 自定义注解

**注解是 Java 的元数据机制，用于为代码添加元信息：**

```java
// 定义自定义注解
@Target(ElementType.METHOD)           // 作用在方法上
@Retention(RetentionPolicy.RUNTIME)   // 运行时保留
@Documented                           // 生成文档时包含
public @interface Log {
    String value() default "";        // 默认属性
    String action() default "";       // 自定义属性
    boolean ignore() default false;   // 布尔属性
}

// 使用自定义注解
public class UserController {
    
    @Log(action = "查询用户列表")
    public List<User> getUsers() {
        // ...
    }
    
    @Log(action = "创建用户", ignore = false)
    public User createUser(User user) {
        // ...
    }
}
```

**注解元注解：**

| 元注解 | 说明 |
|-------|------|
| `@Target` | 指定注解作用位置（类、方法、字段等） |
| `@Retention` | 指定注解生命周期（源码/编译/运行时） |
| `@Documented` | 是否包含在 Javadoc 中 |
| `@Inherited` | 是否允许子类继承 |

**注解属性类型：**

```java
public @interface MyAnnotation {
    // 基本类型
    int count() default 0;
    String name() default "";
    boolean enabled() default true;
    
    // 枚举
    Status status() default Status.ACTIVE;
    
    // 数组
    String[] tags() default {};
    
    // 注解
    @AnotherAnnotation nested() default @AnotherAnnotation;
}
```

**反射读取注解：**

```java
public class AnnotationProcessor {
    
    public static void process(Object obj) {
        Class<?> clazz = obj.getClass();
        
        // 读取类上的注解
        if (clazz.isAnnotationPresent(MyAnnotation.class)) {
            MyAnnotation annotation = clazz.getAnnotation(MyAnnotation.class);
            System.out.println(annotation.name());
        }
        
        // 读取方法上的注解
        for (Method method : clazz.getMethods()) {
            if (method.isAnnotationPresent(Log.class)) {
                Log log = method.getAnnotation(Log.class);
                System.out.println("Action: " + log.action());
            }
        }
    }
}
```