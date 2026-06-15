# Day 17：综合实战 - 权限管理 + RBAC

### 📚 RBAC 概述（30 分钟）

#### 1. RBAC 模型

```
RBAC（Role-Based Access Control）基于角色的访问控制

用户 ── 拥有 ── 角色 ── 拥有 ── 权限

用户表：users
角色表：roles
权限表：permissions
用户角色关系：user_role
角色权限关系：role_permission
```

#### 2. 权限设计

| 权限类型 | 示例 | 说明 |
|---------|------|------|
| 模块权限 | user:read | 用户模块只读 |
| 操作权限 | user:create | 创建用户 |
| 字段权限 | user:update:name | 只允许修改姓名 |

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：创建权限相关实体

```java
// Permission 实体
@Entity
@Table(name = "permissions")
public class Permission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String code;  // 权限标识，如 user:read
    
    @Column(length = 255)
    private String description;
    
    // Getters and Setters
}

// Role 实体（修改）
@Entity
@Table(name = "roles")
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String name;  // 角色名称
    
    @Column(length = 255)
    private String description;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permission",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions = new HashSet<>();
    
    // Getters and Setters
}

// User 实体（修改）
@Entity
@Table(name = "users")
public class User {
    
    // ... 已有字段
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_role",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
    
    // 获取所有权限
    public Set<Permission> getAllPermissions() {
        return roles.stream()
            .flatMap(role -> role.getPermissions().stream())
            .collect(Collectors.toSet());
    }
    
    // 获取所有权限代码
    public Set<String> getAllPermissionCodes() {
        return getAllPermissions().stream()
            .map(Permission::getCode)
            .collect(Collectors.toSet());
    }
}
```

#### 任务 2：自定义权限注解

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String value();  // 权限代码，如 user:read
}
```

#### 任务 3：权限拦截器

```java
@Component
public class PermissionInterceptor implements HandlerInterceptor {
    
    @Autowired
    private HttpServletRequest request;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, 
                            Object handler) throws Exception {
        
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }
        
        HandlerMethod handlerMethod = (HandlerMethod) handler;
        RequirePermission annotation = handlerMethod.getMethodAnnotation(RequirePermission.class);
        
        if (annotation == null) {
            return true;
        }
        
        // 获取当前用户
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
        
        // 检查权限
        String requiredPermission = annotation.value();
        if (!principal.hasPermission(requiredPermission)) {
            throw new BusinessException(403, "无权访问");
        }
        
        return true;
    }
}

// 更新 UserPrincipal
public class UserPrincipal implements UserDetails {
    
    private Long id;
    private String username;
    private Set<String> permissions;
    
    public UserPrincipal(User user) {
        this.id = user.getId();
        this.username = user.getEmail();
        this.permissions = user.getAllPermissionCodes();
    }
    
    public boolean hasPermission(String permission) {
        return permissions.contains(permission);
    }
    
    // UserDetails 接口方法...
}
```

#### 任务 4：使用权限注解

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @RequirePermission("user:read")
    @GetMapping
    public Result<PageResponse<UserResponse>> getUsers(...) {
        return Result.success(userService.getUsers(page, size));
    }
    
    @RequirePermission("user:read")
    @GetMapping("/{id}")
    public Result<UserResponse> getUserById(@PathVariable Long id) {
        return Result.success(userService.getUserById(id));
    }
    
    @RequirePermission("user:create")
    @PostMapping
    public Result<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return Result.success("创建成功", userService.createUser(request));
    }
    
    @RequirePermission("user:update")
    @PutMapping("/{id}")
    public Result<UserResponse> updateUser(@PathVariable Long id, ...) {
        return Result.success("更新成功", userService.updateUser(id, request));
    }
    
    @RequirePermission("user:delete")
    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return Result.success("删除成功", null);
    }
}
```

#### 任务 5：权限配置

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    @Autowired
    private PermissionInterceptor permissionInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(permissionInterceptor)
            .addPathPatterns("/api/**")
            .excludePathPatterns("/api/auth/**");
    }
}
```

---

### 📝 今日笔记（5 行）

1. **RBAC**：用户-角色-权限的三层架构
2. **权限注解**：`@RequirePermission` 标记需要权限的方法
3. **权限拦截器**：在请求处理前检查权限
4. **UserPrincipal**：封装用户信息和权限集合
5. **SecurityContextHolder**：Spring Security 的上下文，存储当前用户信息
