# Day 07：JDBC + 数据库连接池 + JPA 实体

### 📚 Java 补充（30 分钟）

#### 1. JDBC 基础

**JDBC（Java Database Connectivity）** 是 Java 访问数据库的标准接口：

```java
// 传统 JDBC 操作步骤
String url = "jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=UTC";
String username = "root";
String password = "password";

// 使用 try-with-resources 自动关闭资源
try (Connection conn = DriverManager.getConnection(url, username, password);
     PreparedStatement stmt = conn.prepareStatement(
         "SELECT id, name, age FROM users WHERE age > ?")) {

    // 设置参数（索引从 1 开始）
    stmt.setInt(1, 18);
    
    // 执行查询
    try (ResultSet rs = stmt.executeQuery()) {
        while (rs.next()) {
            Long id = rs.getLong("id");
            String name = rs.getString("name");
            int age = rs.getInt("age");
            System.out.printf("ID: %d, Name: %s, Age: %d%n", id, name, age);
        }
    }
} catch (SQLException e) {
    e.printStackTrace();
}
```

**JDBC 核心组件：**

| 组件 | 作用 |
|------|------|
| `DriverManager` | 管理 JDBC 驱动，获取数据库连接 |
| `Connection` | 代表数据库连接 |
| `PreparedStatement` | 预编译 SQL 语句，防止 SQL 注入 |
| `ResultSet` | 存储查询结果集 |

**PreparedStatement 优势：**
- 防止 SQL 注入攻击
- 预编译 SQL，重复执行效率更高
- 自动处理特殊字符转义

#### 2. 数据库连接池原理

**连接池** 是一种数据库连接管理技术，核心思想是复用连接：

```java
// 连接池工作原理
public class SimpleConnectionPool {
    
    private final Queue<Connection> pool = new LinkedList<>();
    private final int maxSize;
    private final String url;
    private final String username;
    private final String password;
    
    public SimpleConnectionPool(int maxSize, String url, String username, String password) {
        this.maxSize = maxSize;
        this.url = url;
        this.username = username;
        this.password = password;
        // 初始化连接
        for (int i = 0; i < maxSize; i++) {
            pool.add(createConnection());
        }
    }
    
    public Connection getConnection() {
        if (pool.isEmpty()) {
            throw new RuntimeException("连接池已满");
        }
        return pool.poll();
    }
    
    public void releaseConnection(Connection conn) {
        if (pool.size() < maxSize) {
            pool.add(conn);
        }
    }
    
    private Connection createConnection() {
        try {
            return DriverManager.getConnection(url, username, password);
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
```

**主流连接池对比：**

| 连接池 | 特点 | 适用场景 |
|--------|------|----------|
| **HikariCP** | Spring Boot 默认，高性能 | 通用场景 |
| **Druid** | 监控功能强，SQL 防火墙 | 需要监控的场景 |
| **Tomcat JDBC** | Tomcat 内置，轻量 | Tomcat 环境 |

**HikariCP 配置（Spring Boot 默认）：**

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20        # 最大连接数
      minimum-idle: 5              # 最小空闲连接
      idle-timeout: 30000          # 空闲连接超时时间
      connection-timeout: 20000    # 获取连接超时时间
      max-lifetime: 1800000        # 连接最大生命周期
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：配置 JPA 和数据库

**添加依赖：**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
```

**application.yml 配置：**

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/example_db?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5

  jpa:
    hibernate:
      ddl-auto: update              # 自动更新表结构
    show-sql: true                  # 显示 SQL 语句
    properties:
      hibernate:
        format_sql: true            # 格式化 SQL
        dialect: org.hibernate.dialect.MySQLDialect
    open-in-view: false             # 关闭 Open Session in View
```

**ddl-auto 选项说明：**

| 选项 | 说明 |
|------|------|
| `create` | 每次启动删除并重建表 |
| `create-drop` | 启动创建，关闭删除 |
| `update` | 更新表结构（不删除数据） |
| `validate` | 验证表结构，不修改 |
| `none` | 不做任何操作 |

#### 任务 2：创建 JPA 实体

```java
package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 用户实体类
 */
@Entity
@Table(name = "users", 
       indexes = {
           @Index(name = "idx_name", columnList = "name"),
           @Index(name = "idx_created_at", columnList = "created_at")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_email", columnNames = {"email"})
       })
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

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 创建前自动设置时间
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }

    // 更新前自动设置时间
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
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

**常用 JPA 注解：**

| 注解 | 作用 |
|------|------|
| `@Entity` | 标记为 JPA 实体 |
| `@Table` | 指定数据库表名和约束 |
| `@Id` | 标记主键 |
| `@GeneratedValue` | 主键生成策略 |
| `@Column` | 映射数据库列 |
| `@PrePersist` | 持久化前执行 |
| `@PreUpdate` | 更新前执行 |

**主键生成策略：**

| 策略 | 说明 |
|------|------|
| `IDENTITY` | 数据库自增（MySQL） |
| `SEQUENCE` | 使用序列（Oracle） |
| `TABLE` | 使用中间表生成主键 |
| `AUTO` | 自动选择策略 |

#### 任务 3：创建 Repository

```java
package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 用户数据访问层
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ========== 方法命名查询 ==========
    
    /**
     * 根据用户名查找
     */
    Optional<User> findByName(String name);

    /**
     * 根据邮箱查找
     */
    Optional<User> findByEmail(String email);

    /**
     * 查找年龄大于指定值的用户
     */
    List<User> findByAgeGreaterThan(Integer age);

    /**
     * 查找活跃用户
     */
    List<User> findByIsActiveTrue();

    /**
     * 按创建时间降序排序
     */
    List<User> findAllByOrderByCreatedAtDesc();

    /**
     * 检查邮箱是否存在
     */
    boolean existsByEmail(String email);

    /**
     * 根据名字模糊查询
     */
    List<User> findByNameContaining(String keyword);

    /**
     * 根据名字和活跃状态查询
     */
    List<User> findByNameContainingAndIsActive(String keyword, Boolean isActive);

    // ========== 分页查询 ==========
    
    /**
     * 分页查询活跃用户
     */
    Page<User> findByIsActiveTrue(Pageable pageable);

    // ========== @Query 查询 ==========
    
    /**
     * 使用 JPQL 查询
     */
    @Query("SELECT u FROM User u WHERE u.age BETWEEN :minAge AND :maxAge ORDER BY u.createdAt DESC")
    List<User> findByAgeRange(
        @Param("minAge") Integer minAge, 
        @Param("maxAge") Integer maxAge);

    /**
     * 使用原生 SQL 查询
     */
    @Query(value = "SELECT * FROM users WHERE age > :age AND is_active = 1", nativeQuery = true)
    List<User> findActiveUsersByAge(@Param("age") Integer age);

    /**
     * 查询用户数量
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true")
    long countActiveUsers();
}
```

**Spring Data JPA 查询方法命名规则：**

| 关键字 | 说明 | 示例 |
|--------|------|------|
| `findBy` | 查询 | `findByName` |
| `findAllBy` | 查询所有 | `findAllByAge` |
| `existsBy` | 存在检查 | `existsByEmail` |
| `countBy` | 计数 | `countByIsActive` |
| `deleteBy` | 删除 | `deleteByIsActiveFalse` |
| `And` | 条件 AND | `findByNameAndAge` |
| `Or` | 条件 OR | `findByNameOrEmail` |
| `Between` | 范围 | `findByAgeBetween` |
| `GreaterThan` | 大于 | `findByAgeGreaterThan` |
| `LessThan` | 小于 | `findByAgeLessThan` |
| `Containing` | 模糊查询 | `findByNameContaining` |
| `OrderBy` | 排序 | `findAllByOrderByCreatedAtDesc` |

#### 任务 4：修改 Service 使用 Repository

```java
package com.example.demo.service.impl;

import com.example.demo.common.BusinessException;
import com.example.demo.dto.request.CreateUserRequest;
import com.example.demo.dto.request.UpdateUserRequest;
import com.example.demo.dto.response.PageResponse;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)  // 只读事务
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
    @Transactional  // 写事务
    public UserResponse createUser(CreateUserRequest request) {
        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("邮箱已被注册");
        }

        User user = new User();
        user.setName(request.getName());
        user.setAge(request.getAge());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException(404, "用户不存在"));

        // 更新非空字段
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getAge() != null) {
            user.setAge(request.getAge());
        }
        if (request.getEmail() != null) {
            // 检查新邮箱是否被其他用户使用
            userRepository.findByEmail(request.getEmail())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new BusinessException("邮箱已被注册");
                    }
                });
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new BusinessException(404, "用户不存在");
        }
        userRepository.deleteById(id);
    }

    @Override
    public PageResponse<UserResponse> getUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage = userRepository.findByIsActiveTrue(pageable);
        
        List<UserResponse> content = userPage.getContent()
            .stream()
            .map(UserResponse::fromEntity)
            .collect(Collectors.toList());
        
        return new PageResponse<>(
            content,
            userPage.getTotalElements(),
            page,
            size
        );
    }
}
```

#### 任务 5：使用 @Query 实现复杂查询

```java
// Repository 中添加复杂查询方法

/**
 * 查询指定年龄范围内的用户数量
 */
@Query("SELECT COUNT(u) FROM User u WHERE u.age >= :minAge AND u.age <= :maxAge")
long countByAgeRange(@Param("minAge") Integer minAge, @Param("maxAge") Integer maxAge);

/**
 * 查询最近注册的用户
 */
@Query("SELECT u FROM User u WHERE u.createdAt >= :since ORDER BY u.createdAt DESC")
List<User> findRecentUsers(@Param("since") LocalDateTime since);

/**
 * 统计每个年龄的用户数量
 */
@Query("SELECT u.age, COUNT(u) FROM User u GROUP BY u.age")
List<Object[]> countByAgeGroup();

/**
 * 使用 JOIN 查询（假设有关联关系）
 */
@Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
List<User> findUsersByRole(@Param("roleName") String roleName);
```

---

### 📝 今日笔记（5 行）

1. **JDBC**：使用 `PreparedStatement` 防止 SQL 注入，`try-with-resources` 自动关闭资源
2. **连接池**：HikariCP 是 Spring Boot 默认连接池，配置通过 `spring.datasource.hikari.*`
3. **JPA 实体**：`@Entity` 标记实体，`@Id` + `@GeneratedValue` 定义主键，`@PrePersist/@PreUpdate` 自动设置时间
4. **Repository**：继承 `JpaRepository` 自动获得 CRUD 方法，支持方法命名查询和 `@Query` 注解查询
5. **事务**：`@Transactional` 注解管理事务，`readOnly = true` 优化只读操作
