# Day 14：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. 单元测试基础

**JUnit 5 是 Java 的主流测试框架：**

```java
// JUnit 5 核心注解
@SpringBootTest  // 启动完整 Spring 上下文
@Test            // 标记测试方法
@BeforeEach      // 每个测试前执行
@AfterEach       // 每个测试后执行
@BeforeAll       // 所有测试前执行（静态方法）
@AfterAll        // 所有测试后执行（静态方法）
@Disabled        // 跳过测试
@DisplayName("测试名称")  // 自定义测试名称

// 断言方法
assertEquals(expected, actual);  // 相等断言
assertNotEquals(expected, actual);  // 不相等断言
assertNotNull(object);  // 非空断言
assertNull(object);     // 空断言
assertTrue(condition);  // 真断言
assertFalse(condition); // 假断言
assertThrows(Exception.class, () -> { /* code */ });  // 异常断言
assertTimeout(Duration.ofSeconds(1), () -> { /* code */ });  // 超时断言
```

**参数化测试：**

```java
@ParameterizedTest
@ValueSource(strings = {"a", "b", "c"})
void testWithParameters(String input) {
    assertNotNull(input);
}

@ParameterizedTest
@CsvSource({
    "1, 2, 3",
    "2, 3, 5",
    "3, 4, 7"
})
void testAddition(int a, int b, int expected) {
    assertEquals(expected, a + b);
}

@ParameterizedTest
@MethodSource("provideTestData")
void testWithMethodSource(int input, int expected) {
    assertEquals(expected, input * 2);
}

static Stream<Arguments> provideTestData() {
    return Stream.of(
        Arguments.of(1, 2),
        Arguments.of(2, 4),
        Arguments.of(3, 6)
    );
}
```

#### 2. Mockito 模拟

**Mockito 用于模拟依赖，隔离被测试代码：**

```java
// Mock 和 InjectMocks
@Mock
private UserRepository userRepository;  // 模拟依赖

@InjectMocks
private UserService userService;       // 注入模拟依赖

// 模拟返回值
when(userRepository.findById(1L)).thenReturn(Optional.of(user));
when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
when(userRepository.count()).thenReturn(10L);

// 模拟异常
when(userRepository.findById(99L)).thenThrow(new RuntimeException("Not found"));

// 验证调用
verify(userRepository, times(1)).findById(1L);
verify(userRepository, never()).deleteById(anyLong());
verify(userRepository, atLeastOnce()).save(any(User.class));
verify(userRepository, timeout(100)).findById(1L);  // 超时验证

// 重置模拟
reset(userRepository);
```

**Mock vs Spy：**

```java
// Mock：创建一个完全模拟的对象
@Mock
UserRepository mockRepository;

// Spy：部分模拟，保留真实对象的行为
@Spy
UserRepository spyRepository = new UserRepositoryImpl();

// Spy 可以模拟特定方法，其他方法使用真实实现
doReturn(Optional.of(user)).when(spyRepository).findById(1L);
```

**BDD 风格测试：**

```java
@Test
void getUserById_Success() {
    // Given（准备）
    User user = createTestUser();
    given(userRepository.findById(1L)).willReturn(Optional.of(user));
    
    // When（执行）
    UserResponse response = userService.getUserById(1L);
    
    // Then（断言）
    then(response).isNotNull();
    then(response.getName()).isEqualTo("张三");
    then(userRepository).should(times(1)).findById(1L);
}
```

#### 3. 测试分类

**不同层次的测试：**

| 测试类型 | 说明 | 范围 |
|-----|------|------|
| **单元测试** | 测试单个方法/类 | 最小单元 |
| **集成测试** | 测试多个组件协作 | 模块间交互 |
| **端到端测试** | 测试完整业务流程 | 整个系统 |
| **性能测试** | 测试系统性能 | 响应时间、吞吐量 |
| **安全测试** | 测试安全漏洞 | 注入攻击、权限绕过 |

**测试覆盖率：**

```java
// JaCoCo 覆盖率配置
// pom.xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

**测试覆盖率指标：**

| 指标 | 说明 |
|-----|------|
| **行覆盖率** | 覆盖的代码行数 / 总代码行数 |
| **分支覆盖率** | 覆盖的分支数 / 总分支数 |
| **方法覆盖率** | 覆盖的方法数 / 总方法数 |
| **类覆盖率** | 覆盖的类数 / 总类数 |

#### 4. 接口测试

**使用 MockMvc 测试 Controller：**

```java
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
    
    @Test
    void getUserById_NotFound() throws Exception {
        // Given
        when(userService.getUserById(99L)).thenThrow(new BusinessException(404, "用户不存在"));
        
        // When/Then
        mockMvc.perform(get("/api/users/99"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("用户不存在"));
    }
    
    @Test
    void createUser_InvalidRequest() throws Exception {
        // When/Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"\"}"))
            .andExpect(status().isBadRequest());
    }
}
```

**REST Assured 测试（更简洁的语法）：**

```java
@Test
void testUserApi() {
    given()
        .baseUri("http://localhost:8080")
    .when()
        .get("/api/users")
    .then()
        .statusCode(200)
        .body("code", is(200))
        .body("data", hasSize(greaterThan(0)));
}
```