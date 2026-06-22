# Day 17：综合实战补充知识

### 📚 RBAC 权限管理（30 分钟）

#### 1. RBAC 模型

**RBAC（Role-Based Access Control）基于角色的访问控制：**

```
用户 ── 拥有 ── 角色 ── 拥有 ── 权限

数据库表结构：
├── users          # 用户表
├── roles          # 角色表
├── permissions    # 权限表
├── user_role      # 用户角色关系（多对多）
└── role_permission # 角色权限关系（多对多）
```

**权限设计原则：**

| 原则 | 说明 |
|-----|------|
| **最小权限** | 用户只拥有完成工作所需的最小权限 |
| **职责分离** | 不同职责的权限分离 |
| **继承性** | 角色可以继承其他角色的权限 |
| **动态管理** | 支持动态调整权限 |

**权限类型：**

| 类型 | 示例 | 说明 |
|-----|------|------|
| **模块权限** | `user:read` | 用户模块只读 |
| **操作权限** | `user:create` | 创建用户 |
| **字段权限** | `user:update:name` | 只允许修改姓名 |
| **数据权限** | 行级/列级权限 | 基于数据的细粒度控制 |

#### 2. Spring Security 权限

**Spring Security 的权限控制：**

```java
// 配置安全规则
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeHttpRequests()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/users").hasAuthority("user:read")
                .requestMatchers(HttpMethod.POST, "/api/users").hasAuthority("user:create")
                .anyRequest().authenticated();
        
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

**权限注解：**

```java
// 在方法上使用权限注解
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping
    @PreAuthorize("hasAuthority('user:read')")
    public Result<List<UserResponse>> getUsers() {
        return Result.success(userService.getAllUsers());
    }
    
    @PostMapping
    @PreAuthorize("hasAuthority('user:create')")
    public Result<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return Result.success("创建成功", userService.createUser(request));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return Result.success("删除成功", null);
    }
}
```

**UserDetails 实现：**

```java
public class UserPrincipal implements UserDetails {
    
    private Long id;
    private String username;
    private String password;
    private Collection<? extends GrantedAuthority> authorities;
    
    public UserPrincipal(User user) {
        this.id = user.getId();
        this.username = user.getEmail();
        this.password = user.getPassword();
        this.authorities = user.getRoles().stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
            .collect(Collectors.toList());
        
        // 添加权限
        user.getRoles().forEach(role -> 
            role.getPermissions().forEach(permission -> 
                authorities.add(new SimpleGrantedAuthority(permission.getCode()))
            )
        );
    }
    
    // UserDetails 接口方法实现
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }
    
    @Override
    public String getPassword() {
        return password;
    }
    
    @Override
    public String getUsername() {
        return username;
    }
    
    // 其他方法...
}
```

#### 3. 自定义权限注解

**创建自定义权限注解：**

```java
// 自定义权限注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String value();  // 权限代码，如 user:read
}

// 权限拦截器
@Component
public class PermissionInterceptor implements HandlerInterceptor {
    
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
        boolean hasPermission = principal.getAuthorities().stream()
            .anyMatch(auth -> auth.getAuthority().equals(requiredPermission));
        
        if (!hasPermission) {
            throw new BusinessException(403, "无权访问");
        }
        
        return true;
    }
}

// 注册拦截器
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

#### 4. 权限数据库设计

**数据库表设计：**

```sql
-- 权限表
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 用户角色关系表
CREATE TABLE user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 角色权限关系表
CREATE TABLE role_permission (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);
```

**初始化数据：**

```sql
-- 初始化权限
INSERT INTO permissions (code, name, description) VALUES
('user:read', '用户只读', '查看用户列表和详情'),
('user:create', '创建用户', '创建新用户'),
('user:update', '更新用户', '更新用户信息'),
('user:delete', '删除用户', '删除用户'),
('role:manage', '角色管理', '管理角色和权限');

-- 初始化角色
INSERT INTO roles (name, description) VALUES
('ADMIN', '管理员', '拥有所有权限'),
('USER', '普通用户', '拥有基本权限');

-- 管理员拥有所有权限
INSERT INTO role_permission (role_id, permission_id) 
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'ADMIN';

-- 普通用户只有只读权限
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'USER' AND p.code = 'user:read';
```