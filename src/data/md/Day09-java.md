# Day 09：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. 静态代理

**静态代理需要手动编写代理类，在编译时确定代理关系：**

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
    private UserService target;  // 持有真实对象引用
    
    public UserServiceProxy(UserService target) {
        this.target = target;
    }
    
    @Override
    public void createUser(String name) {
        // 前置增强
        System.out.println("[代理] 开始创建用户");
        
        // 调用真实对象方法
        target.createUser(name);
        
        // 后置增强
        System.out.println("[代理] 创建用户完成");
    }
}

// 使用
UserService service = new UserServiceProxy(new UserServiceImpl());
service.createUser("张三");
```

**静态代理特点：**

| 优点 | 缺点 |
|-----|------|
| 简单直观 | 需要为每个接口编写代理类 |
| 编译时检查 | 不灵活，难以扩展 |
| 性能较好 | 代码冗余 |

#### 2. JDK 动态代理

**JDK 动态代理基于接口，运行时动态生成代理类：**

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
                    // 前置增强
                    System.out.println("[JDK代理] 方法执行前: " + method.getName());
                    
                    // 调用真实对象方法
                    Object result = method.invoke(target, args);
                    
                    // 后置增强
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

**JDK 动态代理原理：**

```
1. 获取目标对象的所有接口
2. 动态生成实现这些接口的代理类字节码
3. 使用 InvocationHandler 处理所有方法调用
4. 在调用真实方法前后添加增强逻辑
```

**JDK 动态代理特点：**

| 优点 | 缺点 |
|-----|------|
| 无需手动编写代理类 | 只能代理实现了接口的类 |
| 灵活性高 | 性能略低于静态代理 |
| 易于扩展 | 生成的代理类继承自 Proxy，无法再继承其他类 |

#### 3. CGLIB 代理

**CGLIB（Code Generation Library）基于继承，可代理没有接口的类：**

```java
public class CglibProxyFactory {
    
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(Class<T> targetClass) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(targetClass);  // 设置父类
        enhancer.setCallback(new MethodInterceptor() {
            @Override
            public Object intercept(Object proxy, Method method, Object[] args, 
                                   MethodProxy proxyMethod) throws Throwable {
                // 前置增强
                System.out.println("[CGLIB] 方法执行前: " + method.getName());
                
                // 调用父类方法
                Object result = proxyMethod.invokeSuper(proxy, args);
                
                // 后置增强
                System.out.println("[CGLIB] 方法执行后");
                
                return result;
            }
        });
        return (T) enhancer.create();
    }
}

// 使用（不需要接口）
UserServiceImpl service = CglibProxyFactory.createProxy(UserServiceImpl.class);
service.createUser("王五");
```

**CGLIB 代理原理：**

```
1. 使用 ASM 字节码框架生成目标类的子类
2. 重写所有非 final 方法
3. 在重写的方法中添加增强逻辑
4. 通过 MethodProxy 调用父类方法
```

**CGLIB vs JDK 动态代理：**

| 特性 | JDK 动态代理 | CGLIB |
|-----|-------------|-------|
| 代理方式 | 基于接口 | 基于继承 |
| 适用范围 | 实现了接口的类 | 任意类（非 final） |
| 性能 | 调用快，创建慢 | 创建快，调用慢 |
| 继承限制 | 无 | 无法代理 final 类/方法 |
| Spring 默认 | CGLIB（Spring Boot 2.x+） | - |

#### 4. 代理模式应用场景

**代理模式在框架中的应用：**

```java
// Spring AOP 底层就是代理模式
@Aspect
@Component
public class LogAspect {
    
    @Around("execution(* com.example.service..*.*(..))")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        try {
            // 执行目标方法
            return joinPoint.proceed();
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            String methodName = joinPoint.getSignature().getName();
            System.out.printf("[性能监控] %s 执行耗时: %dms%n", methodName, duration);
        }
    }
}
```

**代理模式的典型应用：**

| 应用场景 | 说明 |
|-----|------|
| **AOP** | 日志记录、性能监控、事务管理 |
| **远程代理** | RPC 调用（如 Dubbo） |
| **缓存代理** | 缓存方法返回值 |
| **安全代理** | 权限检查 |
| **虚拟代理** | 延迟加载大对象 |