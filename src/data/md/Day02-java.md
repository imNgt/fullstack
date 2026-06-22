# Day 02：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. 包结构规范

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

#### 2. 反射基础

```java
// 获取 Class 对象的三种方式
Class<?> clazz1 = User.class;
Class<?> clazz2 = userInstance.getClass();
Class<?> clazz3 = Class.forName("com.example.entity.User");

// 获取构造器
Constructor<?> constructor = clazz.getConstructor(String.class);
Object instance = constructor.newInstance("张三");

// 获取方法并调用
Method method = clazz.getMethod("getName");
String name = (String) method.invoke(instance);
```

##### 反射常用方法

| 方法                        | 作用                       |
| --------------------------- | -------------------------- |
| `getDeclaredConstructors()` | 获取所有构造器（包括私有） |
| `getDeclaredMethods()`      | 获取所有方法（包括私有）   |
| `getDeclaredFields()`       | 获取所有字段（包括私有）   |
| `setAccessible(true)`       | 突破访问限制               |

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
