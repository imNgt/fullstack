# Day 06：HashMap + ArrayList + 自定义注解

### 📚 Java 补充（30 分钟）

#### 1. HashMap 原理详解

**HashMap** 是 Java 中最常用的键值对集合，底层采用**数组 + 链表/红黑树**的混合结构：

```java
// 创建 HashMap（初始容量 16，负载因子 0.75）
HashMap<String, Integer> map = new HashMap<>();
map.put("key1", 1);
map.put("key2", 2);

// 遍历方式
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}

// Lambda 遍历
map.forEach((key, value) -> System.out.println(key + ": " + value));
```

**HashMap 核心机制：**

| 特性 | 说明 |
|------|------|
| **初始容量** | 默认 16（2^4），必须是 2 的幂 |
| **负载因子** | 默认 0.75，当元素数量达到容量 × 负载因子时扩容 |
| **扩容机制** | 容量翻倍（×2），重新计算所有元素的哈希值 |
| **哈希冲突** | 链地址法解决，链表长度 > 8 转为红黑树 |
| **线程安全** | 非线程安全，多线程使用 `ConcurrentHashMap` |

**哈希冲突解决流程：**

```
1. 计算 key 的 hashCode()
2. 通过哈希函数计算数组下标：(n - 1) & hash
3. 如果下标位置为空，直接插入
4. 如果下标位置已存在：
   - 比较 hashCode 和 equals，相同则替换
   - 不同则追加到链表末尾
   - 链表长度超过 8，转为红黑树
```

#### 2. ArrayList 原理

**ArrayList** 基于动态数组实现，支持快速随机访问：

```java
// 创建 ArrayList
ArrayList<String> list = new ArrayList<>();
list.add("A");
list.add("B");
list.add("C");

// 随机访问（O(1)）
String element = list.get(1);

// 遍历
for (int i = 0; i < list.size(); i++) {
    System.out.println(list.get(i));
}

// 批量操作
list.addAll(Arrays.asList("D", "E", "F"));
list.removeIf(s -> s.startsWith("A"));
```

**ArrayList 扩容机制：**

```java
// 初始容量 10，扩容时变为 1.5 倍
private void grow(int minCapacity) {
    int oldCapacity = elementData.length;
    int newCapacity = oldCapacity + (oldCapacity >> 1);  // 1.5 倍扩容
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;
    elementData = Arrays.copyOf(elementData, newCapacity);
}
```

**ArrayList vs LinkedList 对比：**

| 操作 | ArrayList | LinkedList |
|------|-----------|------------|
| **随机访问** | O(1) | O(n) |
| **头部插入/删除** | O(n) | O(1) |
| **尾部插入/删除** | O(1)（扩容时 O(n)） | O(1) |
| **中间插入/删除** | O(n) | O(n)（需遍历找到位置） |
| **内存占用** | 连续内存，空间利用率高 | 每个节点有前后指针开销 |
| **适用场景** | 频繁读取，少量增删 | 频繁增删，少量读取 |

#### 3. 集合框架概览

```
Collection
├── List（有序可重复）
│   ├── ArrayList（动态数组）
│   ├── LinkedList（双向链表）
│   └── Vector（线程安全，已过时）
├── Set（无序不可重复）
│   ├── HashSet（基于 HashMap）
│   ├── LinkedHashSet（有序 HashSet）
│   └── TreeSet（有序，基于 TreeMap）
└── Queue（队列）
    ├── LinkedList
    └── PriorityQueue（优先队列）

Map
├── HashMap（数组+链表/红黑树）
├── LinkedHashMap（有序 HashMap）
├── TreeMap（红黑树，有序）
└── ConcurrentHashMap（线程安全）
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建自定义注解

**注解定义语法**：

```java
package com.example.demo.annotation;

import java.lang.annotation.*;

/**
 * 日志注解 - 用于记录方法执行日志
 */
@Target({ElementType.METHOD, ElementType.TYPE})  // 可作用于方法和类
@Retention(RetentionPolicy.RUNTIME)              // 运行时保留
@Documented                                      // 生成文档
@Inherited                                       // 可继承
public @interface Log {
    
    /**
     * 日志描述
     */
    String value() default "";
    
    /**
     * 操作类型
     */
    String action() default "";
    
    /**
     * 是否记录请求参数
     */
    boolean logParams() default true;
    
    /**
     * 是否记录返回结果
     */
    boolean logResult() default false;
}
```

**注解元注解说明：**

| 元注解 | 作用 |
|--------|------|
| `@Target` | 指定注解可作用的位置（METHOD/TYPE/FIELD/PARAMETER 等） |
| `@Retention` | 指定注解的生命周期（SOURCE/CLASS/RUNTIME） |
| `@Documented` | 生成 JavaDoc 时包含注解信息 |
| `@Inherited` | 允许子类继承父类的注解 |

#### 任务 2：创建切面处理注解

**使用 AOP 实现日志记录：**

```java
package com.example.demo.aspect;

import com.example.demo.annotation.Log;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 日志切面 - 处理 @Log 注解
 */
@Aspect
@Component
public class LogAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(LogAspect.class);
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    private final ObjectMapper objectMapper;
    
    public LogAspect(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }
    
    /**
     * 定义切点：所有标注 @Log 注解的方法
     */
    @Pointcut("@annotation(com.example.demo.annotation.Log)")
    public void logPointcut() {}
    
    /**
     * 环绕通知：在方法执行前后记录日志
     */
    @Around("logPointcut()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        // 获取方法签名和注解
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Log logAnnotation = signature.getMethod().getAnnotation(Log.class);
        
        // 获取请求信息
        HttpServletRequest request = getRequest();
        String ip = getClientIp(request);
        String method = request.getMethod();
        String url = request.getRequestURI();
        
        // 记录请求参数
        Map<String, Object> params = new HashMap<>();
        if (logAnnotation.logParams()) {
            String[] paramNames = signature.getParameterNames();
            Object[] paramValues = joinPoint.getArgs();
            for (int i = 0; i < paramNames.length; i++) {
                // 过滤敏感参数
                if (!isSensitive(paramNames[i])) {
                    params.put(paramNames[i], paramValues[i]);
                }
            }
        }
        
        logger.info("========== 请求开始 ==========");
        logger.info("时间: {}", LocalDateTime.now().format(FORMATTER));
        logger.info("IP: {}", ip);
        logger.info("请求方法: {}", method);
        logger.info("请求路径: {}", url);
        logger.info("操作描述: {}", logAnnotation.action());
        logger.info("请求参数: {}", objectMapper.writeValueAsString(params));
        
        Object result = null;
        Exception exception = null;
        
        try {
            // 执行目标方法
            result = joinPoint.proceed();
            return result;
        } catch (Exception e) {
            exception = e;
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            
            logger.info("========== 请求结束 ==========");
            logger.info("耗时: {}ms", duration);
            
            if (exception != null) {
                logger.error("异常信息: {}", exception.getMessage(), exception);
            } else if (logAnnotation.logResult()) {
                logger.info("返回结果: {}", objectMapper.writeValueAsString(result));
            }
        }
    }
    
    /**
     * 获取 HttpServletRequest
     */
    private HttpServletRequest getRequest() {
        ServletRequestAttributes attributes = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }
    
    /**
     * 获取客户端真实 IP
     */
    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        
        // 多个代理时，第一个 IP 为真实 IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        
        return ip;
    }
    
    /**
     * 判断是否为敏感参数
     */
    private boolean isSensitive(String paramName) {
        String[] sensitiveParams = {"password", "token", "secret", "credential"};
        for (String sensitive : sensitiveParams) {
            if (paramName.toLowerCase().contains(sensitive)) {
                return true;
            }
        }
        return false;
    }
}
```

#### 任务 3：使用自定义注解

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @Log(action = "查询用户列表", logParams = true, logResult = false)
    @GetMapping
    public Result<List<UserResponse>> getAllUsers() {
        return Result.success(userService.getAllUsers());
    }
    
    @Log(action = "查询用户详情", logParams = true)
    @GetMapping("/{id}")
    public Result<UserResponse> getUserById(@PathVariable Long id) {
        return Result.success(userService.getUserById(id));
    }
    
    @Log(action = "创建用户", logParams = true, logResult = true)
    @PostMapping
    public Result<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return Result.success("创建成功", userService.createUser(request));
    }
    
    @Log(action = "更新用户", logParams = true)
    @PutMapping("/{id}")
    public Result<UserResponse> updateUser(
            @PathVariable Long id, 
            @Valid @RequestBody UpdateUserRequest request) {
        return Result.success("更新成功", userService.updateUser(id, request));
    }
    
    @Log(action = "删除用户", logParams = true)
    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return Result.success("删除成功", null);
    }
}
```

#### 任务 4：创建权限校验注解

**自定义权限注解：**

```java
package com.example.demo.annotation;

import java.lang.annotation.*;

/**
 * 权限校验注解 - 用于方法级别的权限控制
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequirePermission {
    
    /**
     * 需要的权限标识
     */
    String value();
    
    /**
     * 权限描述
     */
    String description() default "";
}
```

**权限切面：**

```java
package com.example.demo.aspect;

import com.example.demo.annotation.RequirePermission;
import com.example.demo.common.BusinessException;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

/**
 * 权限切面 - 处理 @RequirePermission 注解
 */
@Aspect
@Component
public class PermissionAspect {
    
    /**
     * 定义切点
     */
    @Pointcut("@annotation(com.example.demo.annotation.RequirePermission)")
    public void permissionPointcut() {}
    
    /**
     * 前置通知：方法执行前检查权限
     */
    @Before("permissionPointcut() && @annotation(permission)")
    public void checkPermission(RequirePermission permission) {
        String requiredPermission = permission.value();
        
        // 从当前上下文获取用户权限（示例：实际项目中从 SecurityContext 获取）
        // Set<String> userPermissions = getCurrentUserPermissions();
        
        // 模拟权限检查
        boolean hasPermission = checkUserPermission(requiredPermission);
        
        if (!hasPermission) {
            throw new BusinessException(403, "无权访问：" + permission.description());
        }
    }
    
    private boolean checkUserPermission(String permission) {
        // 实际实现：从数据库/缓存中检查用户权限
        return true;
    }
}
```

**使用权限注解：**

```java
@Log(action = "删除用户", logParams = true)
@RequirePermission(value = "user:delete", description = "删除用户")
@DeleteMapping("/{id}")
public Result<Void> deleteUser(@PathVariable Long id) {
    userService.deleteUser(id);
    return Result.success("删除成功", null);
}
```

---

### 📝 今日笔记（5 行）

1. **HashMap**：数组 + 链表/红黑树结构，初始容量 16，负载因子 0.75，链表长度 > 8 转红黑树
2. **ArrayList**：动态数组实现，扩容时容量变为 1.5 倍，随机访问 O(1)，插入删除 O(n)
3. **自定义注解**：使用 `@interface` 定义，配合 `@Target`、`@Retention`、`@Documented` 元注解
4. **AOP 切面**：`@Aspect` 定义切面，`@Pointcut` 定义切点，`@Around/@Before/@After` 定义通知
5. **RequestContextHolder**：在非 Controller 层获取 HttpServletRequest，用于获取请求信息
