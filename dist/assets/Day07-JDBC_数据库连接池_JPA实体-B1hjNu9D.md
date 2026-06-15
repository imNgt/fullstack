# Day 07：JDBC + 数据库连接池 + JPA 实体

### 📚 Java 补充（30 分钟）

#### 1. JDBC 基础

```java
// 传统 JDBC 步骤
String url = "jdbc:mysql://localhost:3306/mydb";
String username = "root";
String password = "password";

try (Connection conn = DriverManager.getConnection(url, username, password);
     PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
     ResultSet rs = stmt.executeQuery()) {

    stmt.setLong(1, 1L);
    while (rs.next()) {
        String name = rs.getString("name");
        int age = rs.getInt("age");
    }
} catch (SQLException e) {
    e.printStackTrace();
}
```

#### 2. 连接池原理

```java
// 连接池优势：
// 1. 复用连接，减少创建开销
// 2. 控制连接数量，防止资源耗尽
// 3. 统一管理连接生命周期

// Druid 配置示例
@Configuration
public class DruidConfig {

    @Bean
    public DataSource dataSource() {
        DruidDataSource ds = new DruidDataSource();
        ds.setUrl("jdbc:mysql://localhost:3306/mydb");
        ds.setUsername("root");
        ds.setPassword("password");
        ds.setInitialSize(5);
        ds.setMaxActive(20);
        ds.setMinIdle(5);
        return ds;
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：配置 JPA

```yaml
# pom.xml 添加依赖
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>

# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQLDialect
```

#### 任务 2：创建 JPA 实体

```java
package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private Integer age;

    @Column(name = "email", unique = true, length = 255)
    private String email;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

#### 任务 3：创建 Repository

```java
package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // 根据用户名查找
    Optional<User> findByName(String name);

    // 根据邮箱查找
    Optional<User> findByEmail(String email);

    // 查找年龄大于指定值的用户
    List<User> findByAgeGreaterThan(Integer age);

    // 按创建时间降序排序
    List<User> findAllByOrderByCreatedAtDesc();

    // 检查邮箱是否存在
    boolean existsByEmail(String email);

    // 根据名字模糊查询
    List<User> findByNameContaining(String keyword);
}
```

#### 任务 4：修改 Service 使用 Repository

```java
@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(UserResponse::fromEntity)
            .collect(Collectors.toList());
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        return UserResponse.fromEntity(user);
    }

    @Override
    public UserResponse createUser(CreateUserRequest request) {
        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("邮箱已被注册");
        }

        User user = new User();
        user.setName(request.getName());
        user.setAge(request.getAge());
        user.setEmail(request.getEmail());

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }
}
```

---

### 📝 今日笔记（5 行）

1. **JPA**：`@Entity` 标记实体，`@Table` 指定表名，`@Id` 标记主键
2. **Repository**：继承 `JpaRepository` 自动获得 CRUD 方法
3. **查询方法命名**：Spring Data JPA 支持方法名解析查询
4. `@PrePersist`/`@PreUpdate`：自动设置创建/更新时间
5. **连接池**：Druid/HikariCP 管理连接，避免频繁创建销毁
