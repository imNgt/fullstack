# Day 2：包结构 + 路径参数

### 📚 Java 补充（40 分钟）

#### 1. 包（Package）概念
```java
// 文件路径：src/main/java/com/example/demo/User.java
package com.example.demo;  // 声明包，必须与目录结构一致

public class User {
    private String name;
}
```

**包的作用**：
- 避免类名冲突
- 组织代码结构
- 访问控制

#### 2. import 导入类
```java
package com.example.demo.controller;

import com.example.demo.model.User;  // 导入其他包的类
import org.springframework.web.bind.annotation.*;  // 通配符导入
import java.util.List;  // 导入 JDK 类
```

#### 3. 类路径（Classpath）
```
项目结构：
demo/
├── src/
│   ├── main/
│   │   ├── java/           ← 类路径根目录
│   │   │   └── com/example/demo/
│   │   ├── resources/      ← 配置文件、静态资源
│   │   └── webapp/         ← Web 资源（传统项目）
│   └── test/               ← 测试代码
```

**类路径**：JVM 查找 `.class` 文件的路径

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建 User 模型类

```java
// src/main/java/com/example/demo/model/User.java
package com.example.demo.model;

public class User {
    private Long id;
    private String name;
    private Integer age;
    
    // 构造方法
    public User() {}
    
    public User(Long id, String name, Integer age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }
    
    // Getter 和 Setter（IDEA 快捷键：Alt+Insert）
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}
```

#### 任务 2：路径参数接口

```java
// src/main/java/com/example/demo/controller/UserController.java
package com.example.demo.controller;

import com.example.demo.model.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")  // 统一前缀
public class UserController {
    
    // 路径参数：/users/1
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        // 模拟从数据库查询
        return new User(id, "张三", 25);
    }
    
    // 多个路径参数：/users/1/info
    @GetMapping("/{id}/info")
    public String getUserInfo(@PathVariable Long id) {
        return "用户 ID：" + id + "，详细信息...";
    }
}
```

#### 任务 3：测试接口

```bash
# 测试 1
curl http://localhost:8080/users/1

# 测试 2
curl http://localhost:8080/users/2/info
```

**预期输出**：
```json
{"id":1,"name":"张三","age":25}
```

#### 任务 4：添加查询参数

```java
// 查询参数：/users?name=李四&age=30
@GetMapping
public User getUserByQuery(
    @RequestParam(required = false) String name,
    @RequestParam(required = false) Integer age
) {
    return new User(3L, name, age);
}
```

---

### 📝 今日笔记

1. `@PathVariable` 和 `@RequestParam` 的区别？
2. 包名为什么要倒序域名（如 com.example）？
3. 如何让参数可选？
4. 遇到的问题：______
5. 今天的收获：______