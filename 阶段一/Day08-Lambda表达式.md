# Day 8：Lambda 表达式 + Stream 过滤

### 📚 Java 补充（40 分钟）

#### 1. Lambda 表达式基础

```java
// 传统方式：匿名内部类
Runnable r1 = new Runnable() {
    @Override
    public void run() {
        System.out.println("Hello");
    }
};

// Lambda 方式
Runnable r2 = () -> System.out.println("Hello");

// Lambda 语法
(参数) -> { 方法体 }

// 示例
() -> System.out.println("无参");
x -> System.out.println(x);  // 单参数可省略括号
(x, y) -> x + y;  // 单行可省略 return 和大括号
(x, y) -> { return x + y; }  // 多行需要大括号和 return
```

#### 2. 函数式接口

```java
// 只有一个抽象方法的接口
@FunctionalInterface
interface Calculator {
    int calculate(int a, int b);
}

// 使用 Lambda
Calculator add = (a, b) -> a + b;
Calculator multiply = (a, b) -> a * b;

System.out.println(add.calculate(2, 3));      // 5
System.out.println(multiply.calculate(2, 3)); // 6
```

#### 3. 常用函数式接口

```java
// Predicate<T>：断言，返回 boolean
Predicate<Integer> isEven = n -> n % 2 == 0;
System.out.println(isEven.test(4));  // true

// Function<T, R>：函数，输入 T 输出 R
Function<String, Integer> toLength = s -> s.length();
System.out.println(toLength.apply("Hello"));  // 5

// Consumer<T>：消费者，无返回值
Consumer<String> printer = s -> System.out.println(s);
printer.accept("Hello");  // 输出：Hello

// Supplier<T>：供应者，无输入返回 T
Supplier<Double> random = () -> Math.random();
System.out.println(random.get());  // 0.123...
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：Stream 基础操作

```java
// UserServiceImpl.java
public List<User> getUsersByAge(int minAge) {
    List<User> allUsers = getAllUsers();
    
    // 传统方式
    List<User> result = new ArrayList<>();
    for (User user : allUsers) {
        if (user.getAge() >= minAge) {
            result.add(user);
        }
    }
    return result;
    
    // Stream 方式
    return allUsers.stream()
        .filter(user -> user.getAge() >= minAge)  // 过滤
        .collect(Collectors.toList());  // 收集为 List
}
```

#### 任务 2：添加接口

```java
// UserController.java
@GetMapping("/age/{minAge}")
public Result<List<User>> getUsersByAge(@PathVariable int minAge) {
    return Result.success(userService.getUsersByAge(minAge));
}
```

#### 任务 3：Stream 链式操作

```java
// UserServiceImpl.java
public List<String> getUserNames() {
    return getAllUsers().stream()
        .map(User::getName)  // 转换：提取 name
        .collect(Collectors.toList());
}

public Map<Integer, List<User>> groupUsersByAge() {
    return getAllUsers().stream()
        .collect(Collectors.groupingBy(User::getAge));  // 按年龄分组
}

public List<User> sortUsersByName() {
    return getAllUsers().stream()
        .sorted(Comparator.comparing(User::getName))  // 按名字排序
        .collect(Collectors.toList());
}
```

#### 任务 4：添加更多接口

```java
// UserController.java
@GetMapping("/names")
public Result<List<String>> getUserNames() {
    return Result.success(userService.getUserNames());
}

@GetMapping("/group")
public Result<Map<Integer, List<User>>> groupUsersByAge() {
    return Result.success(userService.groupUsersByAge());
}

@GetMapping("/sorted")
public Result<List<User>> sortUsersByName() {
    return Result.success(userService.sortUsersByName());
}
```

#### 任务 5：测试

```bash
# 测试年龄过滤
curl http://localhost:8081/users/age/25

# 测试提取名字
curl http://localhost:8081/users/names

# 测试分组
curl http://localhost:8081/users/group

# 测试排序
curl http://localhost:8081/users/sorted
```

---

### 📝 今日笔记

1. Lambda 表达式的语法？
2. Stream 的 `map` 和 `filter` 的区别？
3. 为什么说 Stream 是"惰性求值"？
4. 遇到的问题：______
5. 今天的收获：______