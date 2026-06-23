# Day 18：Spring Data JPA + REST + GraphQL

### 📚 Java 补充（30 分钟）

#### 1. 泛型仓库模式

```java
import java.util.List;
import java.util.Optional;

public interface GenericRepository<T, ID> {
    T save(T entity);
    Optional<T> findById(ID id);
    List<T> findAll();
    void deleteById(ID id);
    boolean existsById(ID id);
    long count();
}
```

#### 2. 方法引用与 Lambda

```java
import java.util.List;
import java.util.stream.Collectors;

public class StreamExample {
    
    public List<String> getUsernames(List<User> users) {
        return users.stream()
            .map(User::getUsername)  // 方法引用
            .filter(name -> name != null)  // Lambda
            .collect(Collectors.toList());
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：Spring Data JPA 高级查询

**自定义 Repository：**

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

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 方法命名查询
    List<User> findByUsername(String username);
    
    List<User> findByEmailContaining(String email);
    
    List<User> findByAgeBetween(Integer minAge, Integer maxAge);
    
    List<User> findByUsernameAndEmail(String username, String email);
    
    // 分页查询
    Page<User> findByAgeGreaterThan(Integer age, Pageable pageable);
    
    // JPQL 查询
    @Query("SELECT u FROM User u WHERE u.username = :username")
    User findByUsernameJpql(@Param("username") String username);
    
    // 原生 SQL 查询
    @Query(value = "SELECT * FROM users WHERE email LIKE %:keyword%", nativeQuery = true)
    List<User> findByEmailLikeNative(@Param("keyword") String keyword);
    
    // 聚合查询
    @Query("SELECT COUNT(u) FROM User u WHERE u.age > :age")
    Long countByAgeGreaterThan(@Param("age") Integer age);
    
    // 自定义字段查询
    @Query("SELECT u.username, u.email FROM User u WHERE u.id = :id")
    Object[] findUserInfoById(@Param("id") Long id);
}
```

#### 任务 2：自定义 Repository 实现

```java
package com.example.demo.repository.impl;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepositoryCustom;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;

public class UserRepositoryImpl implements UserRepositoryCustom {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Override
    public List<User> findUsersWithComplexCondition(String keyword, Integer minAge) {
        StringBuilder jpql = new StringBuilder("SELECT u FROM User u WHERE 1=1");
        
        if (keyword != null && !keyword.isEmpty()) {
            jpql.append(" AND (u.username LIKE :keyword OR u.email LIKE :keyword)");
        }
        
        if (minAge != null) {
            jpql.append(" AND u.age >= :minAge");
        }
        
        var query = entityManager.createQuery(jpql.toString(), User.class);
        
        if (keyword != null && !keyword.isEmpty()) {
            query.setParameter("keyword", "%" + keyword + "%");
        }
        
        if (minAge != null) {
            query.setParameter("minAge", minAge);
        }
        
        return query.getResultList();
    }
}
```

**自定义接口：**

```java
public interface UserRepositoryCustom {
    List<User> findUsersWithComplexCondition(String keyword, Integer minAge);
}
```

**更新主 Repository：**

```java
public interface UserRepository extends JpaRepository<User, Long>, UserRepositoryCustom {
    // ...
}
```

#### 任务 3：Spring Data REST

**添加依赖：**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-rest</artifactId>
</dependency>
```

**配置 application.yml：**

```yaml
spring:
  data:
    rest:
      base-path: /api
      default-page-size: 20
      max-page-size: 100
```

**Repository：**

```java
package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource(collectionResourceRel = "users", path = "users")
public interface UserRepository extends JpaRepository<User, Long> {
}
```

**自定义控制器：**

```java
package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RepositoryRestController
public class UserRestController {
    
    private final UserRepository userRepository;
    
    public UserRestController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @PostMapping("/users/custom")
    public ResponseEntity<User> createUserWithCustomLogic(@RequestBody User user) {
        // 自定义逻辑
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }
}
```

#### 任务 4：GraphQL 集成

**添加依赖：**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-graphql</artifactId>
</dependency>
```

**创建 Schema：**

```graphql
# src/main/resources/graphql/schema.graphqls
type User {
    id: ID!
    username: String!
    email: String!
    age: Int
    createdAt: String
}

type Query {
    getUser(id: ID!): User
    getAllUsers: [User]
    searchUsers(keyword: String): [User]
}

type Mutation {
    createUser(username: String!, email: String!, age: Int): User
    updateUser(id: ID!, username: String, email: String): User
    deleteUser(id: ID!): Boolean
}
```

**创建 Resolver：**

```java
package com.example.demo.graphql;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Optional;

@Controller
public class UserGraphQLController {
    
    private final UserRepository userRepository;
    
    public UserGraphQLController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @QueryMapping
    public Optional<User> getUser(@Argument Long id) {
        return userRepository.findById(id);
    }
    
    @QueryMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    @QueryMapping
    public List<User> searchUsers(@Argument String keyword) {
        return userRepository.findByEmailContaining(keyword);
    }
    
    @MutationMapping
    public User createUser(@Argument String username, 
                           @Argument String email, 
                           @Argument Integer age) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setAge(age);
        return userRepository.save(user);
    }
    
    @MutationMapping
    public User updateUser(@Argument Long id, 
                           @Argument String username, 
                           @Argument String email) {
        return userRepository.findById(id)
            .map(user -> {
                if (username != null) user.setUsername(username);
                if (email != null) user.setEmail(email);
                return userRepository.save(user);
            })
            .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
    
    @MutationMapping
    public Boolean deleteUser(@Argument Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
```

#### 任务 5：GraphQL 查询示例

**查询单个用户：**

```graphql
query {
    getUser(id: 1) {
        id
        username
        email
    }
}
```

**查询所有用户：**

```graphql
query {
    getAllUsers {
        id
        username
        age
    }
}
```

**创建用户：**

```graphql
mutation {
    createUser(username: "张三", email: "zhangsan@example.com", age: 25) {
        id
        username
        email
    }
}
```

#### 任务 6：Spring Data 审计

**启用审计：**

```java
@SpringBootApplication
@EnableJpaAuditing
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

**实体类：**

```java
package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@Entity
@EntityListeners(AuditingEntityListener.class)
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    
    private String email;
    
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

---

### 📝 今日笔记（5 行）

1. **Spring Data JPA**：提供 Repository 抽象，支持方法命名查询、JPQL、原生 SQL
2. **自定义 Repository**：通过继承 `RepositoryCustom` 接口并实现来扩展功能
3. **Spring Data REST**：自动将 Repository 暴露为 REST API
4. **GraphQL**：声明式 API 查询语言，支持灵活的数据获取
5. **JPA 审计**：通过 `@CreatedDate`、`@LastModifiedDate` 自动记录创建和更新时间