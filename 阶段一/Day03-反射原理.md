# Day 3：反射 + Spring 扫描原理

### 📚 Java 补充（40 分钟）

#### 1. 反射基础

```java
package com.example.demo;

import java.lang.reflect.Method;

public class ReflectionDemo {
    public static void main(String[] args) throws Exception {
        // 方式 1：通过类名获取 Class 对象
        Class<?> clazz = Class.forName("com.example.demo.model.User");
        
        // 方式 2：通过对象获取
        User user = new User();
        Class<?> clazz2 = user.getClass();
        
        // 方式 3：通过 .class
        Class<?> clazz3 = User.class;
        
        // 获取所有方法
        Method[] methods = clazz.getDeclaredMethods();
        for (Method method : methods) {
            System.out.println("方法名：" + method.getName());
        }
        
        // 调用方法
        Method setNameMethod = clazz.getMethod("setName", String.class);
        User newUser = (User) clazz.getConstructor().newInstance();
        setNameMethod.invoke(newUser, "王五");
        System.out.println(newUser.getName());  // 输出：王五
    }
}
```

**反射的作用**：
- 运行时动态获取类信息
- 动态调用方法
- 框架底层大量使用（如 Spring）

#### 2. 获取类信息

```java
// 获取所有字段
Field[] fields = clazz.getDeclaredFields();

// 获取所有构造方法
Constructor<?>[] constructors = clazz.getConstructors();

// 获取注解
RestController annotation = clazz.getAnnotation(RestController.class);
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：观察 Spring 扫描过程

```java
// DemoApplication.java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication  // 包含 @ComponentScan，扫描当前包及子包
public class DemoApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(DemoApplication.class, args);
        
        // 打印所有 Bean 名称
        String[] beanNames = context.getBeanDefinitionNames();
        System.out.println("=== 容器中的 Bean ===");
        for (String name : beanNames) {
            if (name.contains("controller") || name.contains("service")) {
                System.out.println(name);
            }
        }
    }
}
```

#### 任务 2：自定义注解

```java
// src/main/java/com/example/demo/annotation/MyComponent.java
package com.example.demo.annotation;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)  // 运行时保留
@Target(ElementType.TYPE)            // 用在类上
public @interface MyComponent {
    String value() default "";
}
```

#### 任务 3：用反射扫描注解

```java
// src/main/java/com/example/demo/util/AnnotationScanner.java
package com.example.demo.util;

import com.example.demo.annotation.MyComponent;
import org.reflections.Reflections;
import org.springframework.stereotype.Component;

import java.util.Set;

public class AnnotationScanner {
    public static void main(String[] args) {
        // 扫描指定包下的类
        Reflections reflections = new Reflections("com.example.demo");
        
        // 获取带 @MyComponent 注解的类
        Set<Class<?>> annotated = reflections.getTypesAnnotatedWith(MyComponent.class);
        
        System.out.println("带 @MyComponent 的类：");
        annotated.forEach(clazz -> System.out.println(clazz.getName()));
        
        // 获取带 @Component 的类
        Set<Class<?>> components = reflections.getTypesAnnotatedWith(Component.class);
        System.out.println("\n带 @Component 的类：");
        components.forEach(clazz -> System.out.println(clazz.getName()));
    }
}
```

#### 任务 4：给 Controller 加自定义注解

```java
@MyComponent("userController")
@RestController
@RequestMapping("/users")
public class UserController {
    // ...
}
```

---

### 📝 今日笔记

1. 反射的三种获取 Class 对象的方式？
2. `@SpringBootApplication` 包含哪些核心注解？
3. Spring 如何扫描到我们的 Controller？
4. 遇到的问题：______
5. 今天的收获：______