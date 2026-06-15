# Day 06：HashMap + ArrayList + 自定义注解

### 📚 Java 补充（30 分钟）

#### 1. HashMap 原理

```java
// 底层结构：数组 + 链表/红黑树
HashMap<String, Integer> map = new HashMap<>();
map.put("key", 1);

// 重要方法
V put(K key, V value)      // 添加元素
V get(Object key)          // 获取元素
boolean containsKey(Object key)
Set<K> keySet()
Collection<V> values()
Set<Map.Entry<K,V>> entrySet()
```

**HashMap 特性**：
- 初始容量 16，负载因子 0.75
- 线程不安全，多线程用 ConcurrentHashMap
- key 可为 null，value 可为 null

#### 2. ArrayList vs LinkedList

| 特性 | ArrayList | LinkedList |
|-----|-----------|------------|
| 底层实现 | 动态数组 | 双向链表 |
| 随机访问 | O(1) | O(n) |
| 插入删除 | O(n) | O(1) |
| 内存占用 | 连续内存 | 每个节点额外开销 |
| 适用场景 | 频繁读取 | 频繁插入删除 |

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建自定义注解

```java
package com.example.demo.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Log {
    String value() default "";
    String action() default "";
}
```

#### 任务 2：创建切面处理注解

```java
package com.example.demo.aspect;

import com.example.demo.annotation.Log;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Aspect
@Component
public class LogAspect {
    
    @Pointcut("@annotation(com.example.demo.annotation.Log)")
    public void logPointcut() {}
    
    @Around("logPointcut()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        // 获取注解信息
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Log logAnnotation = signature.getMethod().getAnnotation(Log.class);
        
        // 获取请求信息
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        String ip = request.getRemoteAddr();
        String method = request.getMethod();
        String url = request.getRequestURI();
        
        // 执行方法
        Object result = joinPoint.proceed();
        
        // 记录日志
        long duration = System.currentTimeMillis() - startTime;
        System.out.printf("[%s] IP: %s, Method: %s, URL: %s, Action: %s, Duration: %dms%n",
            LocalDateTime.now(), ip, method, url, logAnnotation.action(), duration);
        
        return result;
    }
}
```

#### 任务 3：使用自定义注解

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @Log(action = "查询用户列表")
    @GetMapping
    public Result<List<UserResponse>> getAllUsers() {
        return Result.success(userService.getAllUsers());
    }
    
    @Log(action = "查询用户详情")
    @GetMapping("/{id}")
    public Result<UserResponse> getUserById(@PathVariable Long id) {
        return Result.success(userService.getUserById(id));
    }
    
    @Log(action = "创建用户")
    @PostMapping
    public Result<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return Result.success("创建成功", userService.createUser(request));
    }
}
```

---

### 📝 今日笔记（5 行）

1. **HashMap**：数组 + 链表/红黑树，初始容量 16，负载因子 0.75
2. **ArrayList**：动态数组，随机访问快；**LinkedList**：双向链表，插入删除快
3. **自定义注解**：`@interface` 定义，`@Target` 指定作用位置，`@Retention` 指定生命周期
4. **AOP 切面**：`@Aspect` + `@Around` 实现方法增强
5. `RequestContextHolder` 可在非 Controller 层获取请求信息
