# Day 11：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. SPI 机制

**SPI（Service Provider Interface）是 Java 的服务发现机制：**

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

**SPI 工作流程：**

```
1. ServiceLoader.load() 加载服务接口
2. 查找 META-INF/services/接口全限定名 文件
3. 读取文件中的实现类列表
4. 通过反射实例化实现类
5. 返回实现类迭代器
```

**SPI 优点：**

| 优点 | 说明 |
|-----|------|
| **解耦** | 接口与实现分离 |
| **扩展** | 无需修改代码即可添加新实现 |
| **动态** | 运行时发现和加载服务 |

**SPI 在框架中的应用：**

| 框架 | SPI 应用 |
|-----|---------|
| JDBC | 加载数据库驱动 |
| SLF4J | 加载日志实现 |
| Spring | 自动配置 |
| Dubbo | 协议扩展 |

#### 2. 类加载机制

**JVM 的类加载器层次：**

```java
// Bootstrap ClassLoader（启动类加载器）
// - 加载 JRE/lib 目录下的核心类库（如 rt.jar）
// - 由 C++ 实现，不是 Java 类

// Extension ClassLoader（扩展类加载器）
// - 加载 JRE/lib/ext 目录下的扩展类库

// Application ClassLoader（应用类加载器）
// - 加载 classpath 下的应用类
ClassLoader appClassLoader = ClassLoader.getSystemClassLoader();

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
        String path = classPath + File.separatorChar +
            className.replace('.', File.separatorChar) + ".class";
        try (InputStream is = new FileInputStream(path)) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
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

**双亲委派模型：**

```
加载类时的查找顺序：
1. 先委托父类加载器加载
2. 父类加载器无法加载时，自己尝试加载
3. 防止核心类被篡改（如 java.lang.String）
```

**类加载过程：**

```
1. 加载（Loading）：读取 class 文件到内存
2. 验证（Verification）：校验字节码正确性
3. 准备（Preparation）：分配内存，设置默认值
4. 解析（Resolution）：符号引用转直接引用
5. 初始化（Initialization）：执行静态代码块和静态变量赋值
```

**类加载器特点：**

| 类加载器 | 加载路径 | 说明 |
|---------|---------|------|
| Bootstrap | JRE/lib | 核心类库 |
| Extension | JRE/lib/ext | 扩展类库 |
| Application | classpath | 用户类 |
| Custom | 自定义路径 | 按需加载 |

#### 3. 反射机制进阶

**反射的高级用法：**

```java
import java.lang.reflect.Method;
import java.lang.reflect.Field;

public class ReflectionAdvanced {
    
    public static void main(String[] args) throws Exception {
        Class<?> clazz = User.class;
        
        // 获取所有方法（包括私有）
        Method[] methods = clazz.getDeclaredMethods();
        for (Method method : methods) {
            System.out.println("方法: " + method.getName());
        }
        
        // 获取所有字段（包括私有）
        Field[] fields = clazz.getDeclaredFields();
        for (Field field : fields) {
            System.out.println("字段: " + field.getName());
        }
        
        // 突破访问限制
        User user = new User();
        Field passwordField = clazz.getDeclaredField("password");
        passwordField.setAccessible(true);  // 绕过 private 限制
        passwordField.set(user, "123456");
        
        // 调用私有方法
        Method privateMethod = clazz.getDeclaredMethod("privateMethod");
        privateMethod.setAccessible(true);
        privateMethod.invoke(user);
    }
}
```

**反射性能优化：**

```java
// 缓存 Method 对象避免重复查找
private static final Map<String, Method> methodCache = new ConcurrentHashMap<>();

public static Method getMethod(Class<?> clazz, String methodName) {
    String key = clazz.getName() + "." + methodName;
    return methodCache.computeIfAbsent(key, k -> {
        try {
            return clazz.getMethod(methodName);
        } catch (NoSuchMethodException e) {
            throw new RuntimeException(e);
        }
    });
}
```

#### 4. Java 模块化

**Java 9 引入的模块化系统：**

```java
// module-info.java（模块声明文件）
module com.example.app {
    // 导出包（允许其他模块访问）
    exports com.example.app.controller;
    exports com.example.app.dto;
    
    // 依赖其他模块
    requires spring.context;
    requires spring.web;
    requires java.sql;
    
    // 可选依赖
    requires static lombok;
    
    // 服务提供
    provides MessageService with EmailService;
    
    // 服务消费
    uses MessageService;
}
```

**模块优势：**

| 优势 | 说明 |
|-----|------|
| **封装性** | 控制包的可见性 |
| **依赖管理** | 明确声明模块依赖 |
| **性能优化** | 按需加载模块 |
| **安全性** | 防止非法访问 |