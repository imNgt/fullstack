# Day 6：泛型 + 集合返回

### 📚 Java 补充（40 分钟）

#### 1. 泛型基础

```java
// 泛型类
public class Box<T> {
    private T content;
    
    public void set(T content) {
        this.content = content;
    }
    
    public T get() {
        return content;
    }
}

// 使用
Box<String> stringBox = new Box<>();
stringBox.set("Hello");
String s = stringBox.get();

Box<Integer> intBox = new Box<>();
intBox.set(123);
Integer i = intBox.get();
```

#### 2. 泛型方法

```java
public class Utils {
    // 泛型方法
    public static <T> T getFirst(List<T> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        return list.get(0);
    }
}

// 使用
List<String> names = List.of("张三", "李四");
String firstName = Utils.getFirst(names);

List<Integer> numbers = List.of(1, 2, 3);
Integer firstNumber = Utils.getFirst(numbers);
```

#### 3. 常用泛型

```java
// List<T>：有序列表
List<String> list = new ArrayList<>();
list.add("A");
list.add("B");

// Map<K, V>：键值对
Map<String, Integer> map = new HashMap<>();
map.put("张三", 25);
map.put("李四", 30);

// 泛型通配符
List<?> unknownList = new ArrayList<String>();  // 未知类型
List<? extends Number> numbers = new ArrayList<Integer>();  // Number 的子类
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：返回 List

```java
// UserController.java
@GetMapping
public List<User> getAllUsers() {
    return userService.getAllUsers();
}

// 测试
curl http://localhost:8080/users
```

**返回 JSON**：
```json
[
  {"id":1,"name":"张三","age":25},
  {"id":2,"name":"李四","age":30}
]
```

#### 任务 2：返回 Map

```java
@GetMapping("/map/{id}")
public Map<String, Object> getUserAsMap(@PathVariable Long id) {
    User user = userService.getUserById(id);
    
    Map<String, Object> result = new HashMap<>();
    result.put("code", 200);
    result.put("message", "success");
    result.put("data", user);
    
    return result;
}

// 测试
curl http://localhost:8080/users/map/1
```

**返回 JSON**：
```json
{
  "code": 200,
  "message": "success",
  "data": {"id":1,"name":"张三","age":25}
}
```

#### 任务 3：创建统一返回结果类

```java
// src/main/java/com/example/demo/common/Result.java
package com.example.demo.common;

public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    
    // 私有构造，使用静态方法创建
    private Result() {}
    
    private Result(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
    
    // 成功返回（带数据）
    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }
    
    // 成功返回（无数据）
    public static <T> Result<T> success() {
        return new Result<>(200, "success", null);
    }
    
    // 失败返回
    public static <T> Result<T> error(String message) {
        return new Result<>(500, message, null);
    }
    
    // Getter
    public Integer getCode() { return code; }
    public String getMessage() { return message; }
    public T getData() { return data; }
}
```

#### 任务 4：使用统一返回结果

```java
// UserController.java
@GetMapping("/{id}")
public Result<User> getUserById(@PathVariable Long id) {
    User user = userService.getUserById(id);
    if (user == null) {
        return Result.error("用户不存在");
    }
    return Result.success(user);
}

@GetMapping
public Result<List<User>> getAllUsers() {
    return Result.success(userService.getAllUsers());
}
```

#### 任务 5：用 Postman 测试

1. 安装 Postman
2. 创建新请求：GET http://localhost:8080/users
3. 点击 Send，查看响应

---

### 📝 今日笔记

1. 泛型 `<T>` 的作用是什么？
2. 为什么推荐使用统一返回结果类？
3. `List<?>` 和 `List<Object>` 的区别？
4. 遇到的问题：______
5. 今天的收获：______