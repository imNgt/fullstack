# Day 14：接口文档 + 单元测试

### 📚 Java 补充（30 分钟）

#### 1. 单元测试基础

```java
// JUnit 5 注解
@SpringBootTest  // 启动完整 Spring 上下文
@Test            // 标记测试方法
@BeforeEach      // 每个测试前执行
@AfterEach       // 每个测试后执行
@Disabled        // 跳过测试

// 断言
assertEquals(expected, actual);
assertNotNull(object);
assertTrue(condition);
assertThrows(Exception.class, () -> { /* code */ });

// 参数化测试
@ParameterizedTest
@ValueSource(strings = {"a", "b", "c"})
void testWithParameters(String input) {
    assertNotNull(input);
}
```

#### 2. Mockito 模拟

```java
// Mock 和 InjectMocks
@Mock
private UserRepository userRepository;

@InjectMocks
private UserService userService;

// 模拟返回值
when(userRepository.findById(1L)).thenReturn(Optional.of(user));
when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

// 验证调用
verify(userRepository, times(1)).findById(1L);
verify(userRepository, never()).deleteById(anyLong());
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：集成 Knife4j（Swagger）

```yaml
# pom.xml
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-openapi3-jakarta-spring-boot-starter</artifactId>
    <version>4.4.0</version>
</dependency>

# application.yml
springdoc:
  api-docs:
    enabled: true
    path: /v3/api-docs
  swagger-ui:
    enabled: true
    path: /swagger-ui.html

knife4j:
  enable: true
  setting:
    language: zh_cn
```

#### 任务 2：添加接口文档注解

```java
@Tag(name = "用户管理", description = "用户 CRUD 接口")
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @Operation(summary = "获取用户列表", description = "分页获取所有用户")
    @GetMapping
    public Result<PageResponse<UserResponse>> getUsers(
        @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") int size) {
        return Result.success(userService.getUsers(page, size));
    }
    
    @Operation(summary = "获取用户详情", description = "根据ID获取用户信息")
    @GetMapping("/{id}")
    public Result<UserResponse> getUserById(
        @Parameter(description = "用户ID", required = true) @PathVariable Long id) {
        return Result.success(userService.getUserById(id));
    }
    
    @Operation(summary = "创建用户", description = "创建新用户")
    @PostMapping
    public Result<UserResponse> createUser(
        @Parameter(description = "用户信息", required = true) 
        @Valid @RequestBody CreateUserRequest request) {
        return Result.success("创建成功", userService.createUser(request));
    }
    
    @Operation(summary = "更新用户", description = "更新用户信息")
    @PutMapping("/{id}")
    public Result<UserResponse> updateUser(
        @Parameter(description = "用户ID", required = true) @PathVariable Long id,
        @Parameter(description = "更新信息", required = true) 
        @Valid @RequestBody UpdateUserRequest request) {
        return Result.success("更新成功", userService.updateUser(id, request));
    }
    
    @Operation(summary = "删除用户", description = "删除指定用户")
    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(
        @Parameter(description = "用户ID", required = true) @PathVariable Long id) {
        userService.deleteUser(id);
        return Result.success("删除成功", null);
    }
}

// DTO 注解
@Data
public class CreateUserRequest {
    @Schema(description = "用户名", example = "张三", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "用户名不能为空")
    private String name;
    
    @Schema(description = "邮箱", example = "zhangsan@example.com", requiredMode = Schema.RequiredMode.REQUIRED)
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Schema(description = "年龄", example = "25", minimum = "1", maximum = "150")
    @Min(value = 1, message = "年龄最小为1")
    @Max(value = 150, message = "年龄最大为150")
    private Integer age;
}
```

#### 任务 3：单元测试

```java
@SpringBootTest
class UserServiceTest {
    
    @MockBean
    private UserRepository userRepository;
    
    @Autowired
    private UserService userService;
    
    private User createTestUser() {
        User user = new User();
        user.setId(1L);
        user.setName("张三");
        user.setEmail("zhangsan@example.com");
        user.setAge(25);
        return user;
    }
    
    @Test
    void getUserById_Success() {
        // Given
        User user = createTestUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        
        // When
        UserResponse response = userService.getUserById(1L);
        
        // Then
        assertNotNull(response);
        assertEquals("张三", response.getName());
        assertEquals("zhangsan@example.com", response.getEmail());
        verify(userRepository, times(1)).findById(1L);
    }
    
    @Test
    void getUserById_NotFound() {
        // Given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        
        // When/Then
        assertThrows(BusinessException.class, () -> userService.getUserById(99L));
    }
    
    @Test
    void createUser_Success() {
        // Given
        CreateUserRequest request = new CreateUserRequest();
        request.setName("李四");
        request.setEmail("lisi@example.com");
        request.setAge(30);
        
        User savedUser = new User();
        savedUser.setId(2L);
        savedUser.setName("李四");
        savedUser.setEmail("lisi@example.com");
        savedUser.setAge(30);
        
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        
        // When
        UserResponse response = userService.createUser(request);
        
        // Then
        assertNotNull(response);
        assertEquals(2L, response.getId());
        assertEquals("李四", response.getName());
    }
    
    @Test
    void createUser_EmailExists() {
        // Given
        CreateUserRequest request = new CreateUserRequest();
        request.setEmail("existing@example.com");
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);
        
        // When/Then
        assertThrows(BusinessException.class, () -> userService.createUser(request));
    }
}

// Controller 测试
@WebMvcTest(UserController.class)
class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserService userService;
    
    @Test
    void getAllUsers_ReturnsSuccess() throws Exception {
        // Given
        List<UserResponse> users = Arrays.asList(new UserResponse());
        when(userService.getAllUsers()).thenReturn(users);
        
        // When/Then
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray());
    }
}
```

---

### 📝 今日笔记（5 行）

1. **Knife4j**：自动生成 API 文档，支持在线测试
2. **@Tag/@Operation/@Parameter**：Swagger 注解描述接口
3. **@SpringBootTest**：启动完整 Spring 上下文进行集成测试
4. **@MockBean**：模拟依赖，避免真实数据库操作
5. **MockMvc**：模拟 HTTP 请求，测试 Controller
