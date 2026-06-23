# Day 02：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. Java 反射机制（对比 JS 动态属性访问）

**反射** 允许程序在运行时获取类的信息并动态操作对象，类似 JS 中的：

```javascript
// JS 动态访问
obj["property"];
obj["method"]();
Object.keys(obj);

// Java 反射
obj.getClass();
method.invoke(obj);
field.get(obj);
```

##### 1.1 反射的核心能力

| 能力       | Java 代码             | JS 等效                |
| ---------- | --------------------- | ---------------------- |
| 获取类信息 | `clazz.getName()`     | `obj.constructor.name` |
| 创建对象   | `clazz.newInstance()` | `new Class()`          |
| 调用方法   | `method.invoke(obj)`  | `obj[methodName]()`    |
| 访问字段   | `field.get(obj)`      | `obj[fieldName]`       |

##### 1.2 反射示例

```java
import java.lang.reflect.Method;

public class ReflectionDemo {
    public static void main(String[] args) throws Exception {
        // 1. 获取类的 Class 对象（三种方式）
        Class<?> clazz = User.class;

        // 2. 动态创建对象（无需 new 关键字）
        Object user = clazz.getDeclaredConstructor().newInstance();

        // 3. 动态调用方法
        Method setName = clazz.getMethod("setName", String.class);
        setName.invoke(user, "张三");

        // 4. 动态访问字段（突破封装）
        java.lang.reflect.Field ageField = clazz.getDeclaredField("age");
        ageField.setAccessible(true);  // 绕过 private 限制
        ageField.set(user, 25);

        // 5. 获取类的所有方法
        Method[] methods = clazz.getMethods();
        for (Method m : methods) {
            System.out.println("方法名: " + m.getName());
        }
    }
}
```

##### 1.3 反射在 Spring 中的应用

Spring 框架就是用反射实现的：

| Spring 特性 | 反射的作用                  | 示例           |
| ----------- | --------------------------- | -------------- |
| 组件扫描    | 扫描带有 `@Component` 的类  | 自动注册 Bean  |
| 依赖注入    | 通过 `@Autowired` 注入依赖  | 自动装配对象   |
| 路由映射    | 通过 `@GetMapping` 绑定 URL | 自动创建路由   |
| 配置绑定    | 通过 `@Value` 读取配置      | 自动注入配置值 |

**为什么前端同学要懂反射？**

就像你用 Vue 的 `ref`、`reactive` 时不需要关心内部实现，但理解 Proxy 能帮你更好地使用 Vue 一样，理解反射能让你：

- 更好地理解 Spring 的工作原理
- 更容易排查依赖注入问题
- 写出更优雅的自定义注解

#### 2. 包结构规范

```
src/main/java/com/example/demo
├── controller/      # REST API 控制层
├── service/         # 业务逻辑层
├── repository/      # 数据访问层（DAO）
├── entity/          # 数据库实体
├── dto/             # 数据传输对象
├── config/          # 配置类
└── DemoApplication.java  # 启动类
```

| 目录         | 职责           | 说明                             |
| ------------ | -------------- | -------------------------------- |
| `controller` | 处理 HTTP 请求 | 接收请求、调用 Service、返回响应 |
| `service`    | 业务逻辑处理   | 核心业务逻辑、事务管理           |
| `repository` | 数据库访问     | 数据查询、更新操作               |
| `entity`     | 数据库实体     | 与数据库表映射                   |
| `dto`        | 数据传输对象   | 请求/响应数据结构                |
| `config`     | 配置类         | Spring 配置、Bean 定义           |

#### 3. 依赖注入原理

**依赖注入（DI）** 是 Spring 的核心机制，通过反射实现：

```java
// Spring 容器内部实现简化版
public class SimpleContainer {
    private Map<String, Object> beans = new HashMap<>();

    public void registerBean(String name, Class<?> clazz) throws Exception {
        // 通过反射创建对象
        Object instance = clazz.getDeclaredConstructor().newInstance();

        // 查找 @Autowired 注解并注入依赖
        for (Field field : clazz.getDeclaredFields()) {
            if (field.isAnnotationPresent(Autowired.class)) {
                field.setAccessible(true);
                // 递归获取依赖的 Bean
                Object dependency = beans.get(field.getType().getSimpleName());
                field.set(instance, dependency);
            }
        }

        beans.put(name, instance);
    }

    public Object getBean(String name) {
        return beans.get(name);
    }
}
```

#### 4. Spring Bean 生命周期

```
┌─────────────────────────────────────────────────────────────┐
│                   Bean 生命周期                             │
├─────────────────────────────────────────────────────────────┤
│  1. 实例化        → 调用构造器创建对象                      │
│       ↓                                                    │
│  2. 属性注入      → @Autowired 注入依赖                    │
│       ↓                                                    │
│  3. BeanNameAware → 设置 Bean 名称                        │
│       ↓                                                    │
│  4. BeanFactoryAware → 设置 BeanFactory                   │
│       ↓                                                    │
│  5. 前置处理      → BeanPostProcessor.postProcessBeforeInitialization│
│       ↓                                                    │
│  6. 初始化        → @PostConstruct / afterPropertiesSet() │
│       ↓                                                    │
│  7. 后置处理      → BeanPostProcessor.postProcessAfterInitialization │
│       ↓                                                    │
│  8. 使用中        → Bean 就绪，可被应用使用                │
│       ↓                                                    │
│  9. 销毁          → @PreDestroy / destroy()               │
└─────────────────────────────────────────────────────────────┘
```

#### 5. 依赖注入方式对比

| 方式            | 优点                     | 缺点               |
| --------------- | ------------------------ | ------------------ |
| **构造器注入**  | 强制依赖、不可变、易测试 | 代码稍长           |
| **字段注入**    | 代码简洁                 | 依赖不可见、难测试 |
| **Setter 注入** | 可选依赖、可重新注入     | 可变状态           |

**推荐使用构造器注入：**

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;  // final 保证不可变

    // 构造器注入（推荐）
    public UserController(UserService userService) {
        this.userService = userService;
    }
}
```
