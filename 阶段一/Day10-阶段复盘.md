# Day 10：阶段复盘 + 项目重构

### 📚 复习要点（40 分钟）

#### 1. IoC 容器加载流程

```
1. 扫描 @SpringBootApplication 所在包及子包
2. 找到带 @Component、@Service、@Controller 等注解的类
3. 创建这些类的实例（Bean）
4. 处理依赖注入（@Autowired）
5. 执行初始化方法（@PostConstruct）
6. 应用启动完成
```

#### 2. 手画流程图

```
┌─────────────────────────────────────────┐
│  SpringApplication.run()               │
│  1. 创建 ApplicationContext            │
│         │                              │
│         ▼                              │
│  2. 扫描 @ComponentScan                │
│     ├─ 找到 @Controller                │
│     ├─ 找到 @Service                   │
│     └─ 找到 @Component                 │
│         │                              │
│         ▼                              │
│  3. 实例化 Bean                        │
│     ├─ 调用构造方法                    │
│     ├─ 依赖注入                        │
│     └─ @PostConstruct                  │
│         │                              │
│         ▼                              │
│  4. 启动 Web 服务器                    │
│     └─ Tomcat 监听 8081 端口           │
│         │                              │
│         ▼                              │
│  5. 应用就绪                            │
└─────────────────────────────────────────┘
```

#### 3. 关键注解总结

| 注解 | 作用 | 使用位置 |
|---|---|---|
| `@SpringBootApplication` | 启动类 | 类 |
| `@RestController` | Web 控制器 | 类 |
| `@GetMapping` | GET 请求映射 | 方法 |
| `@Service` | 服务层 Bean | 类 |
| `@Autowired` | 依赖注入 | 字段/构造方法 |
| `@ConfigurationProperties` | 读取配置 | 类 |
| `@RestControllerAdvice` | 全局异常处理 | 类 |
| `@ExceptionHandler` | 异常处理方法 | 方法 |

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：重构项目结构

```
src/main/java/com/example/demo/
├── DemoApplication.java           # 启动类
├── common/
│   └── Result.java                # 统一返回结果
├── config/
│   └── AppConfig.java             # 配置类
├── controller/
│   └── UserController.java        # 用户控制器
├── service/
│   ├── UserService.java           # 用户服务接口
│   └── impl/
│       └── UserServiceImpl.java   # 用户服务实现
├── model/
│   └── User.java                  # 用户实体
├── repository/
│   └── UserRepository.java        # 用户仓库（预留）
└── exception/
    ├── UserNotFoundException.java # 用户不存在异常
    ├── BusinessException.java     # 业务异常
    └── GlobalExceptionHandler.java # 全局异常处理
```

#### 任务 2：完善 UserRepository

```java
// src/main/java/com/example/demo/repository/UserRepository.java
package com.example.demo.repository;

import com.example.demo.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository {
    Optional<User> findById(Long id);
    List<User> findAll();
    User save(User user);
    void deleteById(Long id);
}
```

```java
// src/main/java/com/example/demo/repository/impl/UserRepositoryImpl.java
package com.example.demo.repository.impl;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class UserRepositoryImpl implements UserRepository {
    
    private final ConcurrentHashMap<Long, User> userMap = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);
    
    public UserRepositoryImpl() {
        // 初始化测试数据
        userMap.put(1L, new User(1L, "张三", 25));
        userMap.put(2L, new User(2L, "李四", 30));
    }
    
    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(userMap.get(id));
    }
    
    @Override
    public List<User> findAll() {
        return new ArrayList<>(userMap.values());
    }
    
    @Override
    public User save(User user) {
        if (user.getId() == null) {
            Long id = idGenerator.getAndIncrement();
            user.setId(id);
        }
        userMap.put(user.getId(), user);
        return user;
    }
    
    @Override
    public void deleteById(Long id) {
        userMap.remove(id);
    }
}
```

#### 任务 3：重构 UserService

```java
// UserServiceImpl.java
@Service
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }
    
    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    @Override
    public User createUser(User user) {
        if (user.getName() == null || user.getName().isEmpty()) {
            throw new BusinessException("用户名不能为空");
        }
        return userRepository.save(user);
    }
    
    @Override
    public void deleteUser(Long id) {
        if (!userRepository.findById(id).isPresent()) {
            throw new UserNotFoundException(id);
        }
        userRepository.deleteById(id);
    }
}
```

#### 任务 4：完善 UserController

```java
// UserController.java
@RestController
@RequestMapping("/users")
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    // 查询单个用户
    @GetMapping("/{id}")
    public Result<User> getUserById(@PathVariable Long id) {
        return Result.success(userService.getUserById(id));
    }
    
    // 查询所有用户
    @GetMapping
    public Result<List<User>> getAllUsers() {
        return Result.success(userService.getAllUsers());
    }
    
    // 创建用户
    @PostMapping
    public Result<User> createUser(@RequestBody User user) {
        return Result.success(userService.createUser(user));
    }
    
    // 删除用户
    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return Result.success();
    }
}
```

#### 任务 5：完整测试

```bash
# 查询所有
curl http://localhost:8081/users

# 查询单个
curl http://localhost:8081/users/1

# 创建用户
curl -X POST http://localhost:8081/users \
  -H "Content-Type: application/json" \
  -d '{"name":"王五","age":28}'

# 删除用户
curl -X DELETE http://localhost:8081/users/3

# 测试异常
curl http://localhost:8081/users/999
```

---

### 📝 阶段总结

#### ✅ 完成的里程碑

1. ✅ 能独立搭建 Spring Boot 项目
2. ✅ 能编写 RESTful CRUD 接口
3. ✅ 理解依赖注入（IoC/DI）
4. ✅ 掌握分层架构（Controller/Service/Repository）
5. ✅ 会用统一返回结果和全局异常处理

#### 📚 掌握的 Java 知识点

1. 包、类路径、import
2. 反射基础
3. 接口与实现
4. 构造方法、this 关键字
5. 泛型、集合
6. 装箱拆箱
7. Lambda 表达式
8. 异常处理

#### 🎯 下一步预告

阶段二将深入学习：
- 抽象类、static、final
- 日期 API、Optional
- 集合进阶（HashMap、ArrayList）
- Stream API 完整链
- 自定义注解

---

**🎉 恭喜完成阶段一！你现在已经能够独立开发一个简单的 Spring Boot Web 应用了！**