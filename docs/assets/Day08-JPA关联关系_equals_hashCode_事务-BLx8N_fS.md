# Day 08：JPA 关联关系 + equals/hashCode + 事务

### 📚 Java 补充（30 分钟）

#### 1. equals 和 hashCode

```java
public class User {
    private Long id;
    private String email;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        // 使用业务唯一标识（如 email）进行比较
        return email != null ? email.equals(user.email) : user.email == null;
    }

    @Override
    public int hashCode() {
        return email != null ? email.hashCode() : 0;
    }
}
```

**重要原则**：

- 相等的对象必须有相等的 hashCode
- 如果只重写 equals，不重写 hashCode，放入 HashSet/HashMap 会出问题
- 使用业务唯一标识进行比较，避免使用自动生成的 id（可能为 null）

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建角色实体和关联关系

```java
// Role 实体
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

    @ManyToMany(mappedBy = "roles")
    private Set<User> users = new HashSet<>();

    // Getters and Setters
}

// 修改 User 实体，添加多对多关系
@Entity
@Table(name = "users")
public class User {

    // ... 其他字段

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_role",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    // 添加角色
    public void addRole(Role role) {
        roles.add(role);
        role.getUsers().add(this);
    }

    // 移除角色
    public void removeRole(Role role) {
        roles.remove(role);
        role.getUsers().remove(this);
    }

    // Getters and Setters
}
```

#### 任务 2：事务管理

```java
@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserServiceImpl(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional
    @Override
    public UserResponse createUserWithRole(CreateUserRequest request, Long roleId) {
        // 检查邮箱
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

        // 关联角色
        user.addRole(role);

        // 保存用户（级联保存）
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    @Override
    public List<UserResponse> getAllUsersWithRoles() {
        return userRepository.findAll()
            .stream()
            .map(UserResponse::fromEntity)
            .collect(Collectors.toList());
    }
}
```

#### 任务 3：事务传播行为

```java
@Service
public class OrderService {

    @Autowired
    private UserService userService;

    // 默认传播行为：REQUIRED
    @Transactional
    public void createOrder(Long userId, OrderRequest request) {
        // 如果当前没有事务，创建新事务
        // 如果已有事务，加入当前事务

        // 更新用户积分
        userService.updateUserPoints(userId, 100);

        // 创建订单
        Order order = new Order();
        order.setUserId(userId);
        order.setAmount(request.getAmount());
        orderRepository.save(order);
    }

    // 传播行为：REQUIRES_NEW
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logOrder(Long orderId) {
        // 总是在新事务中执行
        OrderLog log = new OrderLog();
        log.setOrderId(orderId);
        log.setStatus("CREATED");
        logRepository.save(log);
    }
}
```

#### 任务 4：事务隔离级别

```java
@Service
public class TransactionService {

    // 读未提交：允许读取未提交的数据
    @Transactional(isolation = Isolation.READ_UNCOMMITTED)
    public void readUncommitted() { /* ... */ }

    // 读已提交：只能读取已提交的数据（Oracle 默认）
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void readCommitted() { /* ... */ }

    // 可重复读：同一事务中多次读取相同数据结果一致（MySQL 默认）
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public void repeatableRead() { /* ... */ }

    // 串行化：最高隔离级别，事务串行执行
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void serializable() { /* ... */ }
}
```

---

### 📝 今日笔记（5 行）

1. **多对多关系**：`@ManyToMany` + `@JoinTable` 定义中间表
2. **equals/hashCode**：使用业务唯一标识，避免使用可能为 null 的 id
3. **@Transactional**：默认传播行为 `REQUIRED`，只读操作加 `readOnly = true`
4. **事务传播**：`REQUIRES_NEW` 总是开启新事务，`NESTED` 嵌套事务
5. **隔离级别**：`READ_COMMITTED` 是常用选择，平衡性能和数据一致性
