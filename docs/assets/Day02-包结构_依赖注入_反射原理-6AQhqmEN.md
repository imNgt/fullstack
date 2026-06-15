# Day 02：包结构 + 依赖注入 + 反射原理

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

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建 User 模型类

```java
package com.example.demo.entity;

public class User {
    private Long id;
    private String name;
    private Integer age;
    
    public User() {}
    
    public User(Long id, String name, Integer age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}
```

#### 任务 2：创建 UserService

```java
package com.example.demo.service;

import com.example.demo.entity.User;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserService {
    
    private final ConcurrentHashMap<Long, User> userMap = new ConcurrentHashMap<>();
    private Long nextId = 1L;
    
    public List<User> getAllUsers() {
        return new ArrayList<>(userMap.values());
    }
    
    public User getUserById(Long id) {
        return userMap.get(id);
    }
    
    public User createUser(User user) {
        user.setId(nextId++);
        userMap.put(user.getId(), user);
        return user;
    }
    
    public User updateUser(Long id, User user) {
        User existing = userMap.get(id);
        if (existing != null) {
            existing.setName(user.getName());
            existing.setAge(user.getAge());
        }
        return existing;
    }
    
    public void deleteUser(Long id) {
        userMap.remove(id);
    }
}
```

#### 任务 3：创建 UserController

```java
package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    
    // 构造器注入（推荐）
    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }
    
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
    
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }
    
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        return userService.updateUser(id, user);
    }
    
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }
}
```

---

### 📝 今日笔记（5 行）

1. **三层架构**：Controller → Service → Repository
2. `@Autowired` 实现依赖注入，Spring 自动装配 Bean
3. 构造器注入优于字段注入，更易测试
4. `ConcurrentHashMap` 保证线程安全
5. `@RequestBody` 将 JSON 转为对象
