# Day 09：MyBatis Plus + AOP 深入 + 代理模式

### 📚 Java 补充（30 分钟）

#### 1. 静态代理

```java
// 接口
public interface UserService {
    void createUser(String name);
}

// 真实对象
public class UserServiceImpl implements UserService {
    @Override
    public void createUser(String name) {
        System.out.println("创建用户: " + name);
    }
}

// 代理对象
public class UserServiceProxy implements UserService {
    private UserService target;
    
    public UserServiceProxy(UserService target) {
        this.target = target;
    }
    
    @Override
    public void createUser(String name) {
        System.out.println("[代理] 开始创建用户");
        target.createUser(name);
        System.out.println("[代理] 创建用户完成");
    }
}

// 使用
UserService service = new UserServiceProxy(new UserServiceImpl());
service.createUser("张三");
```

#### 2. JDK 动态代理

```java
public class JdkProxyFactory {
    
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(T target) {
        return (T) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            new InvocationHandler() {
                @Override
                public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                    System.out.println("[JDK代理] 方法执行前: " + method.getName());
                    Object result = method.invoke(target, args);
                    System.out.println("[JDK代理] 方法执行后");
                    return result;
                }
            }
        );
    }
}

// 使用
UserService service = JdkProxyFactory.createProxy(new UserServiceImpl());
service.createUser("李四");
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：集成 MyBatis Plus

```yaml
# pom.xml
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot3-starter</artifactId>
    <version>3.5.5</version>
</dependency>

# application.yml
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      id-type: auto
```

#### 任务 2：创建 MyBatis Plus 实体和 Mapper

```java
@Data
@TableName("users")
public class User {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("name")
    private String name;
    
    @TableField("age")
    private Integer age;
    
    @TableField("email")
    private String email;
    
    @TableField("created_at")
    private LocalDateTime createdAt;
    
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}

// Mapper
public interface UserMapper extends BaseMapper<User> {
    
    // 自定义查询
    @Select("SELECT * FROM users WHERE age > #{age}")
    List<User> selectByAgeGreaterThan(Integer age);
    
    // 复杂查询
    @Select("SELECT * FROM users WHERE name LIKE CONCAT('%', #{keyword}, '%')")
    List<User> selectByNameLike(String keyword);
}

// Service
@Service
public class UserServiceImpl {
    
    @Autowired
    private UserMapper userMapper;
    
    public List<User> getAllUsers() {
        return userMapper.selectList(null);
    }
    
    public User getUserById(Long id) {
        return userMapper.selectById(id);
    }
    
    public void createUser(User user) {
        userMapper.insert(user);
    }
    
    public void updateUser(User user) {
        userMapper.updateById(user);
    }
    
    public void deleteUser(Long id) {
        userMapper.deleteById(id);
    }
    
    // 使用条件构造器
    public List<User> queryUsers(String name, Integer minAge) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        if (name != null) {
            wrapper.like("name", name);
        }
        if (minAge != null) {
            wrapper.gt("age", minAge);
        }
        wrapper.orderByDesc("created_at");
        return userMapper.selectList(wrapper);
    }
}
```

#### 任务 3：CGLIB 代理（Spring AOP 默认）

```java
public class CglibProxyFactory {
    
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(Class<T> targetClass) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(targetClass);
        enhancer.setCallback(new MethodInterceptor() {
            @Override
            public Object intercept(Object proxy, Method method, Object[] args, 
                                   MethodProxy proxyMethod) throws Throwable {
                System.out.println("[CGLIB] 方法执行前: " + method.getName());
                Object result = proxyMethod.invokeSuper(proxy, args);
                System.out.println("[CGLIB] 方法执行后");
                return result;
            }
        });
        return (T) enhancer.create();
    }
}

// 使用（不需要接口）
UserServiceImpl service = CglibProxyFactory.createProxy(UserServiceImpl.class);
```

#### 任务 4：Spring AOP 性能监控

```java
@Aspect
@Component
public class PerformanceMonitorAspect {
    
    @Pointcut("execution(* com.example.demo.service..*.*(..))")
    public void serviceMethods() {}
    
    @Around("serviceMethods()")
    public Object monitorPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        try {
            return joinPoint.proceed();
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            String methodName = joinPoint.getSignature().getName();
            String className = joinPoint.getTarget().getClass().getSimpleName();
            
            System.out.printf("[性能监控] %s.%s 执行耗时: %dms%n", 
                className, methodName, duration);
            
            // 记录慢查询
            if (duration > 3000) {
                System.err.printf("[慢查询警告] %s.%s 执行耗时超过 3 秒: %dms%n", 
                    className, methodName, duration);
            }
        }
    }
}
```

---

### 📝 今日笔记（5 行）

1. **静态代理**：需要手动编写代理类，不灵活
2. **JDK 动态代理**：基于接口，使用 `Proxy.newProxyInstance`
3. **CGLIB 代理**：基于继承，可代理没有接口的类
4. **MyBatis Plus**：提供条件构造器 `QueryWrapper`，简化 SQL 编写
5. **Spring AOP**：默认使用 CGLIB，通过 `@Aspect` 定义切面
