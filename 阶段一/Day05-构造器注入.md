# Day 5：构造方法 + 构造器注入

### 📚 Java 补充（40 分钟）

#### 1. 构造方法基础

```java
public class User {
    private Long id;
    private String name;
    
    // 无参构造
    public User() {
        System.out.println("无参构造被调用");
    }
    
    // 有参构造
    public User(Long id, String name) {
        this.id = id;
        this.name = name;
        System.out.println("有参构造被调用");
    }
    
    // 如果不写构造方法，Java 会自动生成无参构造
}
```

#### 2. this 关键字

```java
public class User {
    private String name;
    
    // this.name 指成员变量，name 指参数
    public User(String name) {
        this.name = name;  // 区分成员变量和局部变量
    }
    
    // this() 调用其他构造方法
    public User() {
        this("默认名字");  // 调用有参构造
    }
    
    // this 指当前对象
    public User setName(String name) {
        this.name = name;
        return this;  // 链式调用
    }
}
```

#### 3. 构造方法 vs Setter

```java
// 构造方法：创建对象时必须初始化
User user1 = new User(1L, "张三");

// Setter：可以分步设置
User user2 = new User();
user2.setId(1L);
user2.setName("张三");
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：理解构造器注入

```java
// UserController.java
@RestController
@RequestMapping("/users")
public class UserController {
    
    private final UserService userService;  // final 表示不可变
    
    // 构造器注入（推荐）
    public UserController(UserService userService) {
        this.userService = userService;
        System.out.println("UserController 构造方法被调用");
        System.out.println("注入的 UserService：" + userService.getClass().getName());
    }
    
    // 如果只有一个构造方法，@Autowired 可以省略（Spring 4.3+）
    
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
}
```

#### 任务 2：对比字段注入

```java
// 字段注入（不推荐）
@RestController
public class UserController {
    
    @Autowired
    private UserService userService;  // 直接在字段上注入
}
```

**为什么推荐构造器注入？**
- 保证依赖不可变（final）
- 保证依赖不为空（构造时必须提供）
- 便于单元测试（直接 new 对象传参）
- 避免 Spring 特定注解侵入代码

#### 任务 3：多依赖注入

```java
@Service
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    // 多个依赖通过构造方法注入
    public UserServiceImpl(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
}
```

#### 任务 4：验证注入时机

```java
@Component
public class BeanLifecycleDemo implements InitializingBean {
    
    public BeanLifecycleDemo() {
        System.out.println("1. 构造方法被调用");
    }
    
    @Autowired
    private UserService userService;
    
    @PostConstruct  // 依赖注入后执行
    public void init() {
        System.out.println("3. @PostConstruct 方法被调用");
        System.out.println("   UserService 是否为空：" + (userService != null));
    }
    
    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("4. InitializingBean.afterPropertiesSet 被调用");
    }
}
```

---

### 📝 今日笔记

1. 构造器注入 vs 字段注入 vs Setter 注入，哪个最好？
2. `final` 字段必须在什么时候初始化？
3. `@PostConstruct` 什么时候执行？
4. 遇到的问题：______
5. 今天的收获：______