# Day 11：SPI 机制 + 类加载 + Spring 自动配置原理

### 📚 Java 补充（30 分钟）

#### 1. SPI 机制

```java
// 定义服务接口
public interface MessageService {
    void send(String message);
}

// 实现类 1
public class EmailService implements MessageService {
    @Override
    public void send(String message) {
        System.out.println("发送邮件: " + message);
    }
}

// 实现类 2
public class SmsService implements MessageService {
    @Override
    public void send(String message) {
        System.out.println("发送短信: " + message);
    }
}

// 在 resources/META-INF/services 创建文件
// 文件名为接口全限定名：com.example.MessageService
// 文件内容为实现类全限定名：
// com.example.EmailService
// com.example.SmsService

// 使用 ServiceLoader 加载
ServiceLoader<MessageService> loader = ServiceLoader.load(MessageService.class);
for (MessageService service : loader) {
    service.send("Hello");
}
```

#### 2. 类加载机制

```java
// 类加载器层次
// Bootstrap ClassLoader (启动类加载器) - 加载 JRE/lib
// Extension ClassLoader (扩展类加载器) - 加载 JRE/lib/ext
// Application ClassLoader (应用类加载器) - 加载 classpath

// 双亲委派模型
// 1. 先委托父类加载器加载
// 2. 父类加载器无法加载时，自己尝试加载
// 3. 防止核心类被篡改

// 自定义类加载器
public class CustomClassLoader extends ClassLoader {

    private String classPath;

    public CustomClassLoader(String classPath) {
        this.classPath = classPath;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        byte[] data = loadClassData(name);
        return defineClass(name, data, 0, data.length);
    }

    private byte[] loadClassData(String className) {
        // 从指定路径读取 class 文件
        String path = classPath + File.separatorChar +
            className.replace('.', File.separatorChar) + ".class";
        try (InputStream is = new FileInputStream(path)) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            int bufferSize = 1024;
            byte[] buffer = new byte[bufferSize];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：理解 Spring Boot 自动配置

```java
// Spring Boot 启动流程
// 1. SpringApplication.run()
// 2. createApplicationContext() - 创建应用上下文
// 3. refreshContext() - 刷新上下文
// 4. invokeBeanFactoryPostProcessors() - 执行 BeanFactoryPostProcessor
// 5. ConfigurationClassParser 解析配置类
// 6. AutoConfigurationImportSelector 导入自动配置类

// 自动配置原理
// META-INF/spring.factories 文件中声明自动配置类
// org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
//   com.example.MyAutoConfiguration

@Configuration
@ConditionalOnClass(DataSource.class)  // 当 DataSource 类存在时生效
@ConditionalOnMissingBean              // 当 Bean 不存在时生效
@EnableConfigurationProperties(MyProperties.class)
public class MyAutoConfiguration {

    @Bean
    public MyService myService(MyProperties properties) {
        return new MyService(properties.getConfig());
    }
}
```

#### 任务 2：创建自定义 Starter

```java
// 第一步：创建配置属性类
@ConfigurationProperties(prefix = "my.starter")
public class MyStarterProperties {
    private String name = "default";
    private int timeout = 5000;

    // Getters and Setters
}

// 第二步：创建自动配置类
@Configuration
@ConditionalOnClass(MyService.class)
@EnableConfigurationProperties(MyStarterProperties.class)
public class MyStarterAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public MyService myService(MyStarterProperties properties) {
        MyService service = new MyService();
        service.setName(properties.getName());
        service.setTimeout(properties.getTimeout());
        return service;
    }
}

// 第三步：创建 spring.factories
// META-INF/spring.factories
// org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
//   com.example.MyStarterAutoConfiguration

// 使用
// application.yml
my:
  starter:
    name: myapp
    timeout: 3000
```

#### 任务 3：实现 Starter 功能

```java
public class MyService {
    private String name;
    private int timeout;

    public void doSomething() {
        System.out.printf("Service [%s] doing something with timeout %d%n", name, timeout);
    }

    // Getters and Setters
}

// 在其他项目中使用
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(Application.class, args);
        MyService service = context.getBean(MyService.class);
        service.doSomething();
    }
}
```

---

### 📝 今日笔记（5 行）

1. **SPI**：Service Provider Interface，通过配置文件动态加载实现类
2. **双亲委派模型**：保证类加载的安全性和一致性
3. **Spring Boot 自动配置**：通过 `spring.factories` 声明自动配置类
4. **@ConditionalOnXxx**：条件注解，控制配置类是否生效
5. **自定义 Starter**：配置属性类 + 自动配置类 + spring.factories
