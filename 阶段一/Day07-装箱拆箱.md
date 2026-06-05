# Day 7：装箱拆箱 + 配置文件

### 📚 Java 补充（40 分钟）

#### 1. 基本类型 vs 包装类型

```java
// 基本类型（8 个）
byte, short, int, long, float, double, char, boolean

// 包装类型
Byte, Short, Integer, Long, Float, Double, Character, Boolean
```

#### 2. 自动装箱和拆箱

```java
// 装箱：基本类型 → 包装类型
Integer a = 10;  // 等价于 Integer.valueOf(10)

// 拆箱：包装类型 → 基本类型
int b = a;       // 等价于 a.intValue()

// 在集合中必须用包装类型
List<Integer> list = new ArrayList<>();  // 不能用 List<int>
list.add(10);  // 自动装箱
int value = list.get(0);  // 自动拆箱
```

#### 3. 装箱拆箱的坑

```java
// 坑 1：空指针
Integer x = null;
int y = x;  // NullPointerException

// 坑 2：比较
Integer a = 100;
Integer b = 100;
System.out.println(a == b);  // true（缓存 -128~127）

Integer c = 200;
Integer d = 200;
System.out.println(c == d);  // false（超出缓存范围）

// 正确比较方式
System.out.println(c.equals(d));  // true
```

#### 4. 什么时候用包装类型？

```java
// 用包装类型：可能为 null
private Integer age;  // 年龄可能未知

// 用基本类型：必须有值
private int count;    // 计数器，默认 0
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建配置文件

```yaml
# src/main/resources/application.yml
server:
  port: 8081  # 修改端口

spring:
  application:
    name: demo

# 自定义配置
app:
  name: Spring Boot Demo
  version: 1.0.0
  author: 张三
  max-users: 1000
```

#### 任务 2：读取配置

```java
// src/main/java/com/example/demo/config/AppConfig.java
package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")  // 读取 app.* 配置
public class AppConfig {
    private String name;
    private String version;
    private String author;
    private Integer maxUsers;
    
    // Getter 和 Setter
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    
    public Integer getMaxUsers() { return maxUsers; }
    public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }
}
```

#### 任务 3：使用配置

```java
@RestController
@RequestMapping("/config")
public class ConfigController {
    
    @Autowired
    private AppConfig appConfig;
    
    @GetMapping
    public Map<String, Object> getConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("name", appConfig.getName());
        config.put("version", appConfig.getVersion());
        config.put("author", appConfig.getAuthor());
        config.put("maxUsers", appConfig.getMaxUsers());
        return config;
    }
}
```

#### 任务 4：测试配置

```bash
# 重启应用后测试
curl http://localhost:8081/config
```

#### 任务 5：配置多环境

```yaml
# application-dev.yml（开发环境）
server:
  port: 8081
app:
  name: Spring Boot Demo (Dev)

# application-prod.yml（生产环境）
server:
  port: 80
app:
  name: Spring Boot Demo (Prod)

# application.yml（激活环境）
spring:
  profiles:
    active: dev  # 激活 dev 环境
```

---

### 📝 今日笔记

1. `Integer` 和 `int` 的区别？
2. 为什么 `Integer a = 200; Integer b = 200; a == b` 是 false？
3. `@ConfigurationProperties` 的作用？
4. 遇到的问题：______
5. 今天的收获：______