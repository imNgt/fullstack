# Day 01：环境搭建 + 第一个 Spring Boot 项目

### Spring 实战（1.5 小时）

#### 任务 1：使用 start.spring.io 初始化项目

访问 [start.spring.io](https://start.spring.io/)，选择：

- Project: Maven
- Language: Java
- Spring Boot: 3.2.x
- Dependencies: Spring Web

下载并解压项目。

#### 任务 2：创建 HelloController

```java
@RestController
@RequestMapping("/api")
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello, Spring Boot!";
    }

    @GetMapping("/hello/{name}")
    public String helloWithName(@PathVariable String name) {
        return "Hello, " + name + "!";
    }
}
```

#### 任务 3：启动项目

```bash
mvn spring-boot:run
# 或打包后运行
mvn clean package
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

访问 http://localhost:8080/api/hello

---

### 📝 今日笔记（5 行）

1. `@RestController` = `@Controller` + `@ResponseBody`，返回 JSON
2. `@RequestMapping` 定义路由，支持 GET/POST/PUT/DELETE
3. `@PathVariable` 获取 URL 路径参数
4. Maven 依赖版本由 parent 统一管理
5. Spring Boot 内置 Tomcat，无需额外配置
