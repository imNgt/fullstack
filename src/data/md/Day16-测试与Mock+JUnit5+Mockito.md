# Day 16：测试与 Mock + JUnit 5 + Mockito

### 📚 Java 补充（30 分钟）

#### 1. JUnit 5 基础

```java
import org.junit.jupiter.api.*;

class BasicTest {
    
    @BeforeAll
    static void setupAll() {
        System.out.println("所有测试前执行一次");
    }
    
    @BeforeEach
    void setup() {
        System.out.println("每个测试前执行");
    }
    
    @Test
    void testAddition() {
        int result = 2 + 2;
        Assertions.assertEquals(4, result);
    }
    
    @Test
    void testException() {
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            throw new IllegalArgumentException("测试异常");
        });
    }
    
    @Test
    @Disabled("暂时禁用")
    void testDisabled() {
        // 不会执行
    }
    
    @AfterEach
    void teardown() {
        System.out.println("每个测试后执行");
    }
    
    @AfterAll
    static void teardownAll() {
        System.out.println("所有测试后执行一次");
    }
}
```

#### 2. 参数化测试

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;

class ParameterizedTests {
    
    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4, 5})
    void testWithValueSource(int number) {
        Assertions.assertTrue(number > 0);
    }
    
    @ParameterizedTest
    @CsvSource({
        "1, 2, 3",
        "2, 3, 5",
        "5, 5, 10"
    })
    void testWithCsvSource(int a, int b, int expected) {
        Assertions.assertEquals(expected, a + b);
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：Spring Boot 测试基础

**添加依赖：**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

**基础测试类：**

```java
package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class DemoApplicationTests {
    
    @Test
    void contextLoads() {
        // 验证 Spring 上下文是否正确加载
    }
}
```

#### 任务 2：单元测试 Service

```java
package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private UserServiceImpl userService;
    
    private User testUser;
    
    @BeforeEach
    void setup() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
    }
    
    @Test
    void getUserById_ShouldReturnUser() {
        // 配置 Mock
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        
        // 执行测试
        User result = userService.getUserById(1L);
        
        // 验证结果
        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        
        // 验证 Mock 调用
        verify(userRepository, times(1)).findById(1L);
    }
    
    @Test
    void getUserById_ShouldThrowExceptionWhenNotFound() {
        // 配置 Mock
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        
        // 验证异常
        assertThrows(RuntimeException.class, () -> {
            userService.getUserById(99L);
        });
    }
    
    @Test
    void createUser_ShouldSaveUser() {
        // 配置 Mock
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // 执行测试
        User result = userService.createUser(testUser);
        
        // 验证
        assertNotNull(result);
        verify(userRepository, times(1)).save(any(User.class));
    }
}
```

#### 任务 3：Mock 静态方法

**添加依赖：**

```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-inline</artifactId>
    <version>4.11.0</version>
    <scope>test</scope>
</dependency>
```

**测试静态方法：**

```java
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

class StaticMethodTest {
    
    @Test
    void testStaticMethod() {
        try (MockedStatic<StaticUtil> mockedStatic = Mockito.mockStatic(StaticUtil.class)) {
            // 配置静态方法返回值
            mockedStatic.when(StaticUtil.generateId()).thenReturn("12345");
            
            // 执行测试
            String result = StaticUtil.generateId();
            
            // 验证
            assertEquals("12345", result);
            mockedStatic.verify(StaticUtil::generateId, times(1));
        }
    }
}

class StaticUtil {
    public static String generateId() {
        return UUID.randomUUID().toString();
    }
}
```

#### 任务 4：集成测试

```java
package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private UserRepository userRepository;
    
    @BeforeEach
    void setup() {
        userRepository.deleteAll();
    }
    
    @Test
    void createUser_ShouldReturnCreatedUser() throws Exception {
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(user)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.username").value("testuser"))
            .andExpect(jsonPath("$.email").value("test@example.com"));
    }
    
    @Test
    void getUserById_ShouldReturnUser() throws Exception {
        User savedUser = userRepository.save(createTestUser());
        
        mockMvc.perform(get("/api/users/{id}", savedUser.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(savedUser.getId()))
            .andExpect(jsonPath("$.username").value("testuser"));
    }
    
    private User createTestUser() {
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        return user;
    }
}
```

#### 任务 5：Mock MVC 测试

```java
package com.example.demo.controller;

import com.example.demo.service.UserService;
import com.example.demo.dto.response.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
class UserControllerMockMvcTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserService userService;
    
    @Test
    void getAllUsers_ShouldReturnUsers() throws Exception {
        // 配置 Mock
        List<UserResponse> users = Arrays.asList(
            new UserResponse(1L, "张三", "zhangsan@example.com"),
            new UserResponse(2L, "李四", "lisi@example.com")
        );
        when(userService.getAllUsers()).thenReturn(users);
        
        // 执行请求
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].username").value("张三"))
            .andExpect(jsonPath("$[1].username").value("李四"));
    }
    
    @Test
    void getUserById_ShouldReturnUser() throws Exception {
        UserResponse user = new UserResponse(1L, "张三", "zhangsan@example.com");
        when(userService.getUserById(1L)).thenReturn(user);
        
        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.username").value("张三"));
    }
}
```

#### 任务 6：数据库测试（使用 H2）

**配置 application.yml（测试环境）：**

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    username: sa
    password: 
    driver-class-name: org.h2.Driver
  h2:
    console:
      enabled: true
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
```

**数据库集成测试：**

```java
package com.example.demo.repository;

import com.example.demo.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class UserRepositoryTest {
    
    @Autowired
    private UserRepository userRepository;
    
    private User testUser;
    
    @BeforeEach
    void setup() {
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
    }
    
    @Test
    void saveUser_ShouldPersistUser() {
        // 保存用户
        User savedUser = userRepository.save(testUser);
        
        // 验证保存
        assertNotNull(savedUser.getId());
        assertEquals("testuser", savedUser.getUsername());
    }
    
    @Test
    void findByUsername_ShouldReturnUser() {
        // 先保存
        userRepository.save(testUser);
        
        // 查询
        Optional<User> found = userRepository.findByUsername("testuser");
        
        // 验证
        assertTrue(found.isPresent());
        assertEquals("test@example.com", found.get().getEmail());
    }
    
    @Test
    void existsByEmail_ShouldReturnTrueWhenExists() {
        userRepository.save(testUser);
        
        boolean exists = userRepository.existsByEmail("test@example.com");
        assertTrue(exists);
    }
}
```

---

### 📝 今日笔记（5 行）

1. **JUnit 5**：Java 测试框架，支持注解驱动、参数化测试、嵌套测试等
2. **Mockito**：Mock 框架，用于模拟依赖，隔离测试目标
3. **@MockBean**：Spring 测试中替换 Bean 的 Mock 注解
4. **@WebMvcTest**：仅测试 Web 层，自动配置 MockMvc
5. **@DataJpaTest**：仅测试数据访问层，使用内存数据库