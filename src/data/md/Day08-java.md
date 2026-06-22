# Day 08：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. equals 和 hashCode

**`equals()` 和 `hashCode()` 是 Object 类的核心方法，必须同时重写：**

```java
public class User {
    private Long id;
    private String email;  // 业务唯一标识

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        // 使用业务唯一标识进行比较
        return email != null ? email.equals(user.email) : user.email == null;
    }

    @Override
    public int hashCode() {
        return email != null ? email.hashCode() : 0;
    }
}
```

**重要原则：**

| 原则 | 说明 |
|-----|------|
| 相等的对象必须有相等的 hashCode | `a.equals(b)` → `a.hashCode() == b.hashCode()` |
| hashCode 相等的对象不一定相等 | 哈希冲突允许 |
| 只重写 equals 不重写 hashCode 会出问题 | 放入 HashSet/HashMap 时无法正确工作 |
| 使用业务唯一标识 | 避免使用自动生成的 id（可能为 null） |

**HashMap 中 equals/hashCode 的作用：**

```
1. 调用 hashCode() 计算桶位置
2. 在对应桶中遍历链表/红黑树
3. 调用 equals() 比较 key 是否相等
```

#### 2. 事务管理

**Spring 提供声明式事务管理，简化事务操作：**

```java
@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserServiceImpl(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional  // 默认传播行为 REQUIRED
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

**@Transactional 属性：**

| 属性 | 说明 | 默认值 |
|-----|------|-------|
| `propagation` | 事务传播行为 | `REQUIRED` |
| `isolation` | 事务隔离级别 | 数据库默认 |
| `readOnly` | 是否只读 | `false` |
| `rollbackFor` | 指定回滚的异常类型 | 运行时异常 |
| `noRollbackFor` | 指定不回滚的异常类型 | - |

**事务传播行为：**

| 传播行为 | 说明 |
|---------|------|
| `REQUIRED` | 默认，如果当前没有事务，创建新事务；如果有，加入当前事务 |
| `REQUIRES_NEW` | 总是创建新事务，挂起当前事务 |
| `SUPPORTS` | 如果有事务则加入，否则以非事务方式执行 |
| `NOT_SUPPORTED` | 以非事务方式执行，挂起当前事务 |
| `MANDATORY` | 必须在事务中执行，否则抛出异常 |
| `NEVER` | 必须在非事务中执行，否则抛出异常 |
| `NESTED` | 嵌套事务，如果外层事务回滚，内层也回滚 |

#### 3. 并发修改异常

**在多线程环境下修改共享数据需要注意线程安全：**

```java
// 线程不安全的示例
public class Counter {
    private int count = 0;
    
    public void increment() {
        count++;  // 不是原子操作：read -> increment -> write
    }
    
    public int getCount() {
        return count;
    }
}

// 线程安全的实现
public class SafeCounter {
    private AtomicInteger count = new AtomicInteger(0);
    
    public void increment() {
        count.incrementAndGet();  // 原子操作
    }
    
    public int getCount() {
        return count.get();
    }
}
```

**线程安全的集合：**

```java
// 同步包装器（性能较差）
List<String> syncList = Collections.synchronizedList(new ArrayList<>());

// 并发集合（推荐）
List<String> concurrentList = new CopyOnWriteArrayList<>();
Map<String, String> concurrentMap = new ConcurrentHashMap<>();
Set<String> concurrentSet = new CopyOnWriteArraySet<>();
```

#### 4. 乐观锁 vs 悲观锁

**并发场景下的数据更新策略：**

```java
// 悲观锁：假设会发生冲突，先加锁
@Transactional
public void updateUserBalance(Long userId, Double amount) {
    // 加锁查询
    User user = userRepository.findByIdForUpdate(userId);
    user.setBalance(user.getBalance() + amount);
    userRepository.save(user);
}

// 乐观锁：假设不会发生冲突，更新时检查版本
@Transactional
public void updateUserBalanceOptimistic(Long userId, Double amount, int version) {
    User user = userRepository.findById(userId).orElseThrow();
    
    // 检查版本
    if (user.getVersion() != version) {
        throw new BusinessException("数据已被其他用户修改");
    }
    
    user.setBalance(user.getBalance() + amount);
    user.setVersion(user.getVersion() + 1);  // 版本自增
    userRepository.save(user);
}
```

**两种锁的对比：**

| 特性 | 悲观锁 | 乐观锁 |
|-----|------|------|
| 策略 | 先加锁再操作 | 先操作再检查 |
| 适用场景 | 写操作频繁 | 读操作频繁 |
| 性能 | 较低（锁开销） | 较高（无锁） |
| 实现方式 | `SELECT ... FOR UPDATE` | 版本号/时间戳 |
| 冲突处理 | 阻塞等待 | 抛异常重试 |