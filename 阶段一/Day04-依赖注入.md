# Day 4：接口 + 依赖注入

### 📚 Java 补充（40 分钟）

#### 1. 接口 vs 实现类

```java
// 接口：定义规范
public interface UserService {
    User getUserById(Long id);
    List<User> getAllUsers();
}

// 实现类：具体实现
public class UserServiceImpl implements UserService {
    @Override
    public User getUserById(Long id) {
        return new User(id, "实现类返回", 20);
    }
    
    @Override
    public List<User> getAllUsers() {
        return List.of(
            new User(1L, "张三", 25),
            new User(2L, "李四", 30)
        );
    }
}
```

**接口的作用**：
- 解耦：调用者不依赖具体实现
- 多态：一个接口多个实现
- 规范：定义统一的行为契约

#### 2. implements 关键字

```java
// 一个类可以实现多个接口
public class UserServiceImpl implements UserService, Serializable {
    // ...
}
```

#### 3. 为什么用接口？

```java
// 不用接口：强耦合
public class UserController {
    private UserServiceImpl userService = new UserServiceImpl();  // 硬编码
}

// 用接口：松耦合
public class UserController {
    private UserService userService;  // 只依赖接口，具体实现可替换
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建 Service 接口和实现

```java
// src/main/java/com/example/demo/service/UserService.java
package com.example.demo.service;

import com.example.demo.model.User;
import java.util.List;

public interface UserService {
    User getUserById(Long id);
    List<User> getAllUsers();
    User createUser(User user);
}
```

```java
// src/main/java/com/example/demo/service/impl/UserServiceImpl.java
package com.example.demo.service.impl;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service  // 告诉 Spring 这是一个 Service Bean
public class UserServiceImpl implements UserService {
    
    // 模拟数据库
    private final ConcurrentHashMap<Long, User> userMap = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);
    
    public UserServiceImpl() {
        // 初始化一些测试数据
        userMap.put(1L, new User(1L, "张三", 25));
        userMap.put(2L, new User(2L, "李四", 30));
    }
    
    @Override
    public User getUserById(Long id) {
        return userMap.get(id);
    }
    
    @Override
    public List<User> getAllUsers() {
        return new ArrayList<>(userMap.values());
    }
    
    @Override
    public User createUser(User user) {
        Long id = idGenerator.getAndIncrement();
        user.setId(id);
        userMap.put(id, user);
        return user;
    }
}
```

#### 任务 2：在 Controller 中注入 Service

```java
// UserController.java
@RestController
@RequestMapping("/users")
public class UserController {
    
    @Autowired  // 自动注入 UserService 的实现类
    private UserService userService;
    
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
    
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }
}
```

#### 任务 3：测试依赖注入

```bash
# 测试查询
curl http://localhost:8080/users/1

# 测试列表
curl http://localhost:8080/users
```

#### 任务 4：验证注入的是哪个实现类

```java
// DemoApplication.java
public static void main(String[] args) {
    ConfigurableApplicationContext context = SpringApplication.run(DemoApplication.class, args);
    
    // 获取 UserService Bean
    UserService userService = context.getBean(UserService.class);
    System.out.println("UserService 实现类：" + userService.getClass().getName());
    // 输出：com.example.demo.service.impl.UserServiceImpl
}
```

---

### 📝 今日笔记

1. 接口和抽象类的区别？
2. `@Autowired` 的作用是什么？
3. 为什么 Controller 要依赖接口而不是直接依赖实现类？
4. 遇到的问题：______
5. 今天的收获：______