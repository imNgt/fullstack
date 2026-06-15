# Day 13：Spring Security + JWT 认证

### 📚 Java 补充（30 分钟）

#### 1. JWT 结构

```
JWT = Header.Payload.Signature

Header: {"alg": "HS256", "typ": "JWT"}
Payload: {"sub": "1234567890", "name": "John Doe", "exp": 1699999999}
Signature: HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

#### 2. 认证流程

```
1. 用户登录 → 服务端验证 → 生成 JWT → 返回给客户端
2. 客户端存储 JWT（localStorage/cookie）
3. 后续请求在 Header 中携带 JWT: Authorization: Bearer xxx
4. 服务端验证 JWT → 解析用户信息 → 处理请求
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：JWT 工具类

```java
@Component
public class JwtUtils {
    
    @Value("${jwt.secret:your-secret-key}")
    private String secret;
    
    @Value("${jwt.expiration:86400000}")
    private long expiration;  // 24小时
    
    public String generateToken(Long userId, String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
            .setSubject(String.valueOf(userId))
            .claim("username", username)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(SignatureAlgorithm.HS512, secret)
            .compact();
    }
    
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
            .setSigningKey(secret)
            .parseClaimsJws(token)
            .getBody();
        
        return Long.parseLong(claims.getSubject());
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(secret).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

#### 任务 2：JWT 过滤器

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private UserService userService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        
        try {
            String jwt = getJwtFromRequest(request);
            
            if (StringUtils.hasText(jwt) && jwtUtils.validateToken(jwt)) {
                Long userId = jwtUtils.getUserIdFromToken(jwt);
                User user = userService.getUserById(userId);
                
                UserDetails userDetails = new UserPrincipal(user);
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

// UserPrincipal
public class UserPrincipal implements UserDetails {
    
    private Long id;
    private String username;
    private Collection<? extends GrantedAuthority> authorities;
    
    public UserPrincipal(User user) {
        this.id = user.getId();
        this.username = user.getEmail();
        this.authorities = user.getRoles().stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
            .collect(Collectors.toList());
    }
    
    // UserDetails 接口方法实现...
}
```

#### 任务 3：Security 配置

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Autowired
    private JwtAuthenticationFilter jwtFilter;
    
    @Autowired
    private JwtAuthenticationEntryPoint jwtEntryPoint;
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .exceptionHandling().authenticationEntryPoint(jwtEntryPoint).and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
            .authorizeHttpRequests()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/doc.html", "/v3/api-docs/**", "/swagger-ui/**").permitAll()
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

#### 任务 4：登录接口

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginRequest request) {
        // 验证用户
        User user = userService.findByEmail(request.getEmail())
            .orElseThrow(() -> new BusinessException("邮箱或密码错误"));
        
        // 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("邮箱或密码错误");
        }
        
        // 生成 Token
        String token = jwtUtils.generateToken(user.getId(), user.getEmail());
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", UserResponse.fromEntity(user));
        
        return Result.success(response);
    }
    
    @PostMapping("/register")
    public Result<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        // 检查邮箱是否已注册
        if (userService.existsByEmail(request.getEmail())) {
            throw new BusinessException("邮箱已被注册");
        }
        
        // 创建用户
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        User saved = userService.save(user);
        return Result.success("注册成功", UserResponse.fromEntity(saved));
    }
}
```

---

### 📝 今日笔记（5 行）

1. **JWT**：无状态认证，服务端无需存储 session
2. **JwtUtils**：工具类封装 Token 的生成、解析、验证
3. **JwtAuthenticationFilter**：拦截请求，解析并验证 Token
4. **SecurityConfig**：配置放行路径和认证规则
5. **PasswordEncoder**：使用 BCrypt 加密密码，不要明文存储
