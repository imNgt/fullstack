# Day 09：MyBatis Plus + AOP 深入 + 代理模式

### 📚 Java 补充（30 分钟）

#### 1. 代理模式概述

**代理模式**是一种结构型设计模式，允许通过代理对象控制对真实对象的访问：

```
┌──────────────┐     请求     ┌──────────────┐     转发     ┌──────────────┐
│   Client     │ ──────────> │    Proxy     │ ──────────> │   RealObject │
│   (客户端)   │             │   (代理)     │             │   (真实对象)  │
└──────────────┘             └──────────────┘             └──────────────┘
```

**代理模式的用途：**
- **访问控制**：权限校验、延迟加载
- **日志记录**：记录方法调用日志
- **性能监控**：统计方法执行时间
- **事务管理**：统一事务控制

#### 2. 静态代理

**静态代理**需要手动编写代理类，代理类和真实类实现相同接口：

```java
// 定义接口
public interface UserService {
    void createUser(String name);
    void deleteUser(Long id);
}

// 真实实现类
public class UserServiceImpl implements UserService {
    @Override
    public void createUser(String name) {
        System.out.println("创建用户: " + name);
    }
    
    @Override
    public void deleteUser(Long id) {
        System.out.println("删除用户: " + id);
    }
}

// 代理类
public class UserServiceProxy implements UserService {
    
    private final UserService target;  // 持有真实对象引用
    
    public UserServiceProxy(UserService target) {
        this.target = target;
    }
    
    @Override
    public void createUser(String name) {
        // 前置增强
        System.out.println("[代理] 权限检查通过");
        System.out.println("[代理] 记录日志: 创建用户");
        
        // 调用真实方法
        target.createUser(name);
        
        // 后置增强
        System.out.println("[代理] 操作成功");
    }
    
    @Override
    public void deleteUser(Long id) {
        System.out.println("[代理] 权限检查通过");
        System.out.println("[代理] 记录日志: 删除用户");
        
        target.deleteUser(id);
        
        System.out.println("[代理] 操作成功");
    }
}

// 使用
public class Main {
    public static void main(String[] args) {
        UserService service = new UserServiceProxy(new UserServiceImpl());
        service.createUser("张三");
        service.deleteUser(1L);
    }
}
```

**静态代理缺点：**
- 每个目标类都需要编写代理类，代码冗余
- 接口变更时，代理类也需要同步修改

#### 3. JDK 动态代理

**JDK 动态代理**基于接口，在运行时动态生成代理类：

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

public class JdkProxyFactory {
    
    /**
     * 创建 JDK 动态代理
     * @param target 目标对象（必须实现接口）
     * @return 代理对象
     */
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(T target) {
        return (T) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),      // 类加载器
            target.getClass().getInterfaces(),       // 目标对象实现的接口
            new InvocationHandler() {               // 调用处理器
                @Override
                public Object invoke(Object proxy, Method method, Object[] args) 
                        throws Throwable {
                    // 前置增强
                    System.out.println("[JDK代理] 方法: " + method.getName());
                    System.out.println("[JDK代理] 参数: " + (args != null ? java.util.Arrays.toString(args) : "无"));
                    
                    // 调用目标方法
                    Object result = method.invoke(target, args);
                    
                    // 后置增强
                    System.out.println("[JDK代理] 返回值: " + result);
                    
                    return result;
                }
            }
        );
    }
}

// 使用
public class Main {
    public static void main(String[] args) {
        UserService service = JdkProxyFactory.createProxy(new UserServiceImpl());
        service.createUser("李四");
    }
}
```

**JDK 动态代理特点：**
- 基于接口实现，目标类必须实现接口
- 使用 `java.lang.reflect.Proxy` 类动态生成代理
- 代理类在运行时生成，无需手动编写

#### 4. CGLIB 动态代理

**CGLIB（Code Generation Library）**基于继承，可代理没有实现接口的类：

```java
import net.sf.cglib.proxy.Enhancer;
import net.sf.cglib.proxy.MethodInterceptor;
import net.sf.cglib.proxy.MethodProxy;

import java.lang.reflect.Method;

public class CglibProxyFactory {
    
    /**
     * 创建 CGLIB 动态代理
     * @param targetClass 目标类
     * @return 代理对象
     */
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(Class<T> targetClass) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(targetClass);  // 设置父类
        
        enhancer.setCallback(new MethodInterceptor() {
            @Override
            public Object intercept(Object proxy, Method method, Object[] args, 
                                   MethodProxy methodProxy) throws Throwable {
                // 前置增强
                System.out.println("[CGLIB] 方法: " + method.getName());
                
                // 调用父类方法
                Object result = methodProxy.invokeSuper(proxy, args);
                
                // 后置增强
                System.out.println("[CGLIB] 执行完成");
                
                return result;
            }
        });
        
        return (T) enhancer.create();
    }
}

// 使用（目标类不需要实现接口）
public class Main {
    public static void main(String[] args) {
        // 直接代理没有接口的类
        UserServiceImpl service = CglibProxyFactory.createProxy(UserServiceImpl.class);
        service.createUser("王五");
    }
}
```

**JDK 动态代理 vs CGLIB：**

| 特性 | JDK 动态代理 | CGLIB |
|------|-------------|-------|
| 底层实现 | 基于接口 | 基于继承 |
| 目标类要求 | 必须实现接口 | 无要求 |
| 性能 | 调用效率较高 | 生成代理类较慢，调用略慢 |
| 方法限制 | 只能代理接口方法 | 可代理所有方法（除 final） |

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：集成 MyBatis Plus

**添加依赖：**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot3-starter</artifactId>
    <version>3.5.5</version>
</dependency>
```

**配置 application.yml：**

```yaml
mybatis-plus:
  # 配置文件路径
  config-location: classpath:mybatis/mybatis-config.xml
  # Mapper 文件路径
  mapper-locations: classpath:mybatis/mapper/*.xml
  configuration:
    # 驼峰命名转换
    map-underscore-to-camel-case: true
    # 日志实现
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
    # 懒加载
    lazy-loading-enabled: true
    aggressive-lazy-loading: false
  global-config:
    db-config:
      # 主键类型
      id-type: auto
      # 表名前缀
      table-underline: true
      # 逻辑删除字段名
      logic-delete-field: is_deleted
      # 逻辑删除值
      logic-delete-value: 1
      # 逻辑未删除值
      logic-not-delete-value: 0
```

**启动类添加 Mapper 扫描：**

```java
@SpringBootApplication
@MapperScan("com.example.demo.mapper")
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

#### 任务 2：创建 MyBatis Plus 实体

```java
package com.example.demo.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户实体
 */
@Data
@TableName("users")  // 指定表名
public class User {
    
    /**
     * 主键，自增
     */
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 用户名
     */
    @TableField("name")
    private String name;
    
    /**
     * 年龄
     */
    @TableField("age")
    private Integer age;
    
    /**
     * 邮箱
     */
    @TableField("email")
    private String email;
    
    /**
     * 手机号
     */
    @TableField("phone")
    private String phone;
    
    /**
     * 是否删除（逻辑删除）
     */
    @TableLogic
    @TableField("is_deleted")
    private Integer isDeleted;
    
    /**
     * 创建时间
     */
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

**创建自动填充处理器：**

```java
package com.example.demo.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * MyBatis Plus 自动填充处理器
 */
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {
    
    @Override
    public void insertFill(MetaObject metaObject) {
        // 创建时自动填充
        this.strictInsertFill(metaObject, "createdAt", LocalDateTime::now, LocalDateTime.class);
        this.strictInsertFill(metaObject, "updatedAt", LocalDateTime::now, LocalDateTime.class);
        this.strictInsertFill(metaObject, "isDeleted", () -> 0, Integer.class);
    }
    
    @Override
    public void updateFill(MetaObject metaObject) {
        // 更新时自动填充
        this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime::now, LocalDateTime.class);
    }
}
```

#### 任务 3：创建 Mapper 和 Service

```java
package com.example.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.demo.entity.User;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户 Mapper
 */
public interface UserMapper extends BaseMapper<User> {
    
    /**
     * 根据年龄查询用户
     */
    @Select("SELECT * FROM users WHERE age > #{age} AND is_deleted = 0")
    List<User> selectByAgeGreaterThan(Integer age);
    
    /**
     * 根据姓名模糊查询
     */
    @Select("SELECT * FROM users WHERE name LIKE CONCAT('%', #{keyword}, '%')")
    List<User> selectByNameLike(String keyword);
    
    /**
     * 自定义分页查询
     */
    IPage<User> selectUserPage(IPage<User> page, @Param("ew") Wrapper<User> wrapper);
}
```

**Service 实现：**

```java
package com.example.demo.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.common.BusinessException;
import com.example.demo.dto.request.CreateUserRequest;
import com.example.demo.dto.request.UpdateUserRequest;
import com.example.demo.dto.response.PageResponse;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import com.example.demo.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {
    
    private final UserMapper userMapper;
    
    public UserServiceImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }
    
    @Override
    public List<UserResponse> getAllUsers() {
        return userMapper.selectList(null)
            .stream()
            .map(UserResponse::fromEntity)
            .collect(Collectors.toList());
    }
    
    @Override
    public UserResponse getUserById(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return UserResponse.fromEntity(user);
    }
    
    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        // 检查邮箱是否已存在
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getEmail, request.getEmail());
        if (userMapper.exists(wrapper)) {
            throw new BusinessException("邮箱已被注册");
        }
        
        User user = new User();
        user.setName(request.getName());
        user.setAge(request.getAge());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        
        userMapper.insert(user);
        return UserResponse.fromEntity(user);
    }
    
    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getAge() != null) {
            user.setAge(request.getAge());
        }
        if (request.getEmail() != null) {
            // 检查新邮箱是否被占用
            LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(User::getEmail, request.getEmail())
                   .ne(User::getId, id);
            if (userMapper.exists(wrapper)) {
                throw new BusinessException("邮箱已被注册");
            }
            user.setEmail(request.getEmail());
        }
        
        userMapper.updateById(user);
        return UserResponse.fromEntity(user);
    }
    
    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userMapper.exists(new QueryWrapper<User>().eq("id", id))) {
            throw new BusinessException(404, "用户不存在");
        }
        userMapper.deleteById(id);
    }
    
    @Override
    public PageResponse<UserResponse> getUsers(int page, int size) {
        IPage<User> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(User::getCreatedAt);
        
        IPage<User> userPage = userMapper.selectPage(pageParam, wrapper);
        
        List<UserResponse> content = userPage.getRecords()
            .stream()
            .map(UserResponse::fromEntity)
            .collect(Collectors.toList());
        
        return new PageResponse<>(
            content,
            (int) userPage.getTotal(),
            page,
            size
        );
    }
}
```

#### 任务 4：条件构造器详解

**QueryWrapper 常用方法：**

```java
// 条件构造器示例
public List<User> queryUsers(String name, Integer minAge, Integer maxAge) {
    QueryWrapper<User> wrapper = new QueryWrapper<>();
    
    // 等值条件
    wrapper.eq("name", "张三");           // name = '张三'
    
    // 模糊查询
    wrapper.like("name", "张");           // name LIKE '%张%'
    wrapper.likeLeft("name", "张");       // name LIKE '张%'
    wrapper.likeRight("name", "张");      // name LIKE '%张'
    
    // 范围查询
    wrapper.between("age", 18, 30);       // age BETWEEN 18 AND 30
    wrapper.gt("age", 18);                // age > 18
    wrapper.ge("age", 18);                // age >= 18
    wrapper.lt("age", 30);                // age < 30
    wrapper.le("age", 30);                // age <= 30
    
    // 非空判断
    if (name != null) {
        wrapper.like("name", name);
    }
    if (minAge != null) {
        wrapper.ge("age", minAge);
    }
    if (maxAge != null) {
        wrapper.le("age", maxAge);
    }
    
    // 排序
    wrapper.orderByDesc("created_at");
    
    // 逻辑条件
    wrapper.and(i -> i.eq("status", 1).or().eq("status", 2));
    
    return userMapper.selectList(wrapper);
}
```

**LambdaQueryWrapper（推荐）：**

```java
public List<User> queryUsersLambda(String name, Integer minAge) {
    LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
    
    // 类型安全，编译期检查
    wrapper.eq(User::getName, "张三")
           .gt(User::getAge, 18)
           .orderByDesc(User::getCreatedAt);
    
    return userMapper.selectList(wrapper);
}
```

#### 任务 5：Spring AOP 性能监控

```java
package com.example.demo.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * 性能监控切面
 */
@Aspect
@Component
public class PerformanceMonitorAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(PerformanceMonitorAspect.class);
    
    /**
     * 定义切点：所有 Service 层方法
     */
    @Pointcut("execution(* com.example.demo.service..*.*(..))")
    public void serviceMethods() {}
    
    /**
     * 定义切点：指定注解标记的方法
     */
    @Pointcut("@annotation(com.example.demo.annotation.MonitorPerformance)")
    public void monitorMethods() {}
    
    /**
     * 环绕通知：监控方法执行时间
     */
    @Around("serviceMethods()")
    public Object monitorPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        // 获取方法信息
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = signature.getName();
        String[] paramNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();
        
        // 记录入参
        logger.debug("[性能监控] 开始执行: {}.{}", className, methodName);
        if (args != null && args.length > 0) {
            StringBuilder params = new StringBuilder();
            for (int i = 0; i < args.length; i++) {
                if (i > 0) params.append(", ");
                // 过滤敏感参数
                if (isSensitive(paramNames[i])) {
                    params.append(paramNames[i]).append("=******");
                } else {
                    params.append(paramNames[i]).append("=").append(args[i]);
                }
            }
            logger.debug("[性能监控] 参数: {}", params);
        }
        
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
            
            // 记录耗时
            logger.info("[性能监控] {}.{} 执行耗时: {}ms", 
                className, methodName, duration);
            
            // 慢查询警告
            if (duration > 3000) {
                logger.warn("[慢查询警告] {}.{} 执行耗时超过 3 秒: {}ms", 
                    className, methodName, duration);
            }
            
            // 记录异常
            if (exception != null) {
                logger.error("[性能监控] {}.{} 执行异常: {}", 
                    className, methodName, exception.getMessage());
            }
        }
    }
    
    /**
     * 判断是否为敏感参数
     */
    private boolean isSensitive(String paramName) {
        String[] sensitiveParams = {"password", "token", "secret", "credential"};
        return Arrays.stream(sensitiveParams)
            .anyMatch(sensitive -> paramName.toLowerCase().contains(sensitive));
    }
}
```

**自定义监控注解：**

```java
package com.example.demo.annotation;

import java.lang.annotation.*;

/**
 * 性能监控注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface MonitorPerformance {
    
    /**
     * 是否记录返回结果
     */
    boolean logResult() default false;
    
    /**
     * 慢查询阈值（毫秒）
     */
    long threshold() default 3000;
}
```

---

### 📝 今日笔记（5 行）

1. **静态代理**：手动编写代理类，实现相同接口，代码冗余但直观
2. **JDK 动态代理**：基于接口，使用 `Proxy.newProxyInstance`，运行时生成代理类
3. **CGLIB 代理**：基于继承，可代理无接口类，Spring AOP 默认使用
4. **MyBatis Plus**：提供 `QueryWrapper/LambdaQueryWrapper` 条件构造器，简化 SQL 编写
5. **Spring AOP**：使用 `@Aspect` 定义切面，`@Around` 实现环绕通知，可用于日志、监控、事务等
