# Day 08：JPA 关联关系 + equals/hashCode + 事务

### 📚 Java 补充（30 分钟）

#### 1. equals 和 hashCode 详解

**equals 和 hashCode** 是 Java 对象的基础方法，用于对象比较和哈希表操作：

```java
public class User {
    private Long id;
    private String email;  // 业务唯一标识

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;                    // 引用相等
        if (o == null || getClass() != o.getClass()) return false;  // 类型检查
        User user = (User) o;
        
        // 使用业务唯一标识进行比较（避免使用可能为 null 的 id）
        return email != null ? email.equals(user.email) : user.email == null;
    }

    @Override
    public int hashCode() {
        // 与 equals 保持一致
        return email != null ? email.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "User{" +
            "id=" + id +
            ", email='" + email + '\'' +
            '}';
    }
}
```

**重要原则：**

| 原则 | 说明 |
|------|------|
| **一致性** | equals 返回 true 的两个对象，hashCode 必须相等 |
| **非空性** | 重写时要考虑字段为 null 的情况 |
| **稳定性** | 对象在集合中时，用于比较的字段不应改变 |
| **业务标识** | 使用业务唯一标识（如 email），而非自动生成的 id |

**为什么不能用 id 比较？**

```java
// 错误示例：使用 id 比较
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    User user = (User) o;
    return Objects.equals(id, user.id);  // ❌ 新建对象 id 为 null
}
```

**正确做法：**

```java
// 正确示例：同时考虑 id 和业务标识
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    User user = (User) o;
    
    // 如果 id 都不为 null，使用 id 比较
    if (id != null && user.id != null) {
        return id.equals(user.id);
    }
    
    // 否则使用业务唯一标识
    return email != null ? email.equals(user.email) : user.email == null;
}

@Override
public int hashCode() {
    return id != null ? id.hashCode() : (email != null ? email.hashCode() : 0);
}
```

#### 2. JPA 实体中的 equals/hashCode 最佳实践

```java
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    // equals 和 hashCode 只基于业务键（email）
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        User user = (User) o;
        return email != null && email.equals(user.email);
    }
    
    @Override
    public int hashCode() {
        return email != null ? email.hashCode() : 0;
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：JPA 关联关系详解

**一对一关系（One-to-One）：**

```java
// 用户实体
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 一对一关联用户详情
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserProfile profile;
    
    // 级联创建/更新用户详情
    public void setProfile(UserProfile profile) {
        this.profile = profile;
        if (profile != null) {
            profile.setUser(this);
        }
    }
}

// 用户详情实体
@Entity
@Table(name = "user_profiles")
public class UserProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String address;
    private String phone;
    
    // 一对一关联用户（拥有外键）
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;
    
    // Getters and Setters
}
```

**一对多关系（One-to-Many）：**

```java
// 部门实体（一方）
@Entity
@Table(name = "departments")
public class Department {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    // 一对多关联员工
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL)
    private List<Employee> employees = new ArrayList<>();
    
    public void addEmployee(Employee employee) {
        employees.add(employee);
        employee.setDepartment(this);
    }
    
    public void removeEmployee(Employee employee) {
        employees.remove(employee);
        employee.setDepartment(null);
    }
}

// 员工实体（多方）
@Entity
@Table(name = "employees")
public class Employee {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    // 多对一关联部门
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;
    
    // Getters and Setters
}
```

**多对多关系（Many-to-Many）：**

```java
// 角色实体
@Entity
@Table(name = "roles")
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String name;
    
    @Column(length = 255)
    private String description;
    
    // 多对多关系（被维护方）
    @ManyToMany(mappedBy = "roles")
    private Set<User> users = new HashSet<>();
    
    // Getters and Setters
}

// 用户实体
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String email;
    
    // 多对多关系（维护方）
    @ManyToMany(fetch = FetchType.EAGER, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "user_role",                    // 中间表名
        joinColumns = @JoinColumn(name = "user_id"),       // 当前实体外键
        inverseJoinColumns = @JoinColumn(name = "role_id") // 关联实体外键
    )
    private Set<Role> roles = new HashSet<>();
    
    // 添加角色（维护双向关系）
    public void addRole(Role role) {
        roles.add(role);
        role.getUsers().add(this);
    }
    
    // 移除角色（维护双向关系）
    public void removeRole(Role role) {
        roles.remove(role);
        role.getUsers().remove(this);
    }
    
    // Getters and Setters
}
```

**关联关系对比：**

| 关系类型 | 注解 | 说明 |
|----------|------|------|
| **一对一** | `@OneToOne` | 实体间一对一映射 |
| **一对多** | `@OneToMany` + `@ManyToOne` | 一方维护关系，多方拥有外键 |
| **多对多** | `@ManyToMany` | 需要中间表，使用 `@JoinTable` 定义 |

#### 任务 2：事务管理基础

**@Transactional 注解使用：**

```java
@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserServiceImpl(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    /**
     * 创建用户并关联角色
     */
    @Transactional  // 默认传播行为 REQUIRED
    @Override
    public UserResponse createUserWithRole(CreateUserRequest request, Long roleId) {
        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("邮箱已被注册");
        }

        // 创建用户
        User user = new User();
        user.setName(request.getName());
        user.setAge(request.getAge());
        user.setEmail(request.getEmail());

        // 获取角色
        Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> new BusinessException(404, "角色不存在"));

        // 关联角色（维护双向关系）
        user.addRole(role);

        // 保存用户（级联保存关联关系）
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    /**
     * 查询所有用户（只读）
     */
    @Transactional(readOnly = true)  // 只读事务，优化性能
    @Override
    public List<UserResponse> getAllUsersWithRoles() {
        return userRepository.findAll()
            .stream()
            .map(UserResponse::fromEntity)
            .collect(Collectors.toList());
    }
}
```

**事务属性说明：**

| 属性 | 说明 | 默认值 |
|------|------|--------|
| `propagation` | 事务传播行为 | `REQUIRED` |
| `isolation` | 事务隔离级别 | `DEFAULT`（数据库默认） |
| `readOnly` | 是否只读 | `false` |
| `timeout` | 超时时间（秒） | `-1`（无限制） |
| `rollbackFor` | 回滚异常类型 | 运行时异常 |
| `noRollbackFor` | 不回滚异常类型 | 无 |

#### 任务 3：事务传播行为

**事务传播行为定义了事务如何在方法间传播：**

```java
@Service
public class OrderService {

    private final UserService userService;
    private final OrderRepository orderRepository;
    private final OrderLogRepository logRepository;

    public OrderService(UserService userService, 
                        OrderRepository orderRepository,
                        OrderLogRepository logRepository) {
        this.userService = userService;
        this.orderRepository = orderRepository;
        this.logRepository = logRepository;
    }

    /**
     * 默认传播行为：REQUIRED
     * - 如果当前没有事务，创建新事务
     * - 如果已有事务，加入当前事务
     */
    @Transactional
    public void createOrder(Long userId, OrderRequest request) {
        // 更新用户积分（同一会话）
        userService.updateUserPoints(userId, 100);

        // 创建订单
        Order order = new Order();
        order.setUserId(userId);
        order.setAmount(request.getAmount());
        orderRepository.save(order);

        // 记录日志（新事务）
        logOrder(order.getId());
    }

    /**
     * 传播行为：REQUIRES_NEW
     * - 总是开启新事务
     * - 独立提交或回滚
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logOrder(Long orderId) {
        OrderLog log = new OrderLog();
        log.setOrderId(orderId);
        log.setStatus("CREATED");
        log.setCreatedAt(LocalDateTime.now());
        logRepository.save(log);
    }

    /**
     * 传播行为：SUPPORTS
     * - 如果有事务则加入，否则非事务执行
     */
    @Transactional(propagation = Propagation.SUPPORTS)
    public Order getOrder(Long orderId) {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new BusinessException(404, "订单不存在"));
    }

    /**
     * 传播行为：NOT_SUPPORTED
     * - 以非事务方式执行
     * - 如果有事务则挂起
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendNotification(Long orderId) {
        // 发送通知，不参与事务
    }
}
```

**常用事务传播行为：**

| 传播行为 | 说明 |
|----------|------|
| `REQUIRED` | 默认，需要事务，不存在则创建 |
| `REQUIRES_NEW` | 总是创建新事务 |
| `SUPPORTS` | 支持事务，不存在则非事务执行 |
| `NOT_SUPPORTED` | 不支持事务，存在则挂起 |
| `MANDATORY` | 必须在事务中执行，否则抛出异常 |
| `NEVER` | 必须在非事务中执行，否则抛出异常 |
| `NESTED` | 嵌套事务，失败只回滚当前嵌套部分 |

#### 任务 4：事务隔离级别

**隔离级别定义了事务间的隔离程度：**

```java
@Service
public class TransactionService {

    /**
     * 读未提交（READ_UNCOMMITTED）
     * - 允许读取未提交的数据
     * - 最低隔离级别，可能产生脏读
     */
    @Transactional(isolation = Isolation.READ_UNCOMMITTED)
    public void readUncommitted() { /* ... */ }

    /**
     * 读已提交（READ_COMMITTED）
     * - 只能读取已提交的数据
     * - 防止脏读，可能产生不可重复读和幻读
     * - Oracle 默认级别
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void readCommitted() { /* ... */ }

    /**
     * 可重复读（REPEATABLE_READ）
     * - 同一事务中多次读取相同数据结果一致
     * - 防止脏读和不可重复读，可能产生幻读
     * - MySQL InnoDB 默认级别
     */
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public void repeatableRead() { /* ... */ }

    /**
     * 串行化（SERIALIZABLE）
     * - 最高隔离级别，事务串行执行
     * - 防止所有并发问题
     * - 性能最差
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void serializable() { /* ... */ }
}
```

**隔离级别对比：**

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 性能 |
|----------|------|------------|------|------|
| `READ_UNCOMMITTED` | ✅ | ✅ | ✅ | 最高 |
| `READ_COMMITTED` | ❌ | ✅ | ✅ | 较高 |
| `REPEATABLE_READ` | ❌ | ❌ | ✅ | 中等 |
| `SERIALIZABLE` | ❌ | ❌ | ❌ | 最低 |

**并发问题说明：**

| 问题 | 说明 |
|------|------|
| **脏读** | 读取到其他事务未提交的数据 |
| **不可重复读** | 同一事务中多次读取同一数据，结果不同 |
| **幻读** | 同一事务中多次执行同一查询，返回的行数不同 |

#### 任务 5：事务回滚控制

```java
@Service
public class TransactionService {

    /**
     * 指定回滚异常类型
     */
    @Transactional(rollbackFor = {BusinessException.class, RuntimeException.class})
    public void createOrder(Long userId, OrderRequest request) {
        // 业务逻辑
    }

    /**
     * 指定不回滚异常类型
     */
    @Transactional(noRollbackFor = {ValidationException.class})
    public void updateUser(Long userId, UpdateUserRequest request) {
        // 更新逻辑，ValidationException 不回滚
    }

    /**
     * 编程式事务回滚
     */
    @Transactional
    public void processOrder(Long orderId) {
        try {
            // 业务逻辑
        } catch (Exception e) {
            // 手动回滚
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            throw e;
        }
    }
}
```

---

### 📝 今日笔记（5 行）

1. **equals/hashCode**：使用业务唯一标识（如 email）进行比较，避免使用可能为 null 的 id
2. **JPA 关联关系**：一对一用 `@OneToOne`，一对多用 `@OneToMany`+`@ManyToOne`，多对多用 `@ManyToMany`+`@JoinTable`
3. **事务传播**：`REQUIRED`（默认）加入或创建事务，`REQUIRES_NEW` 总是新事务，`SUPPORTS` 可选事务
4. **隔离级别**：`READ_COMMITTED` 是常用选择，`REPEATABLE_READ` 是 MySQL 默认，`SERIALIZABLE` 性能最差但最安全
5. **@Transactional**：只读操作加 `readOnly = true` 优化性能，`rollbackFor` 指定回滚异常类型
