# Day 04：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. Lambda 表达式

**Lambda 是 Java 8 引入的函数式编程特性，简化匿名内部类的写法：**

```java
// 无参数无返回值
Runnable runnable = () -> System.out.println("Hello");

// 单参数（可省略括号）
Consumer<String> consumer = s -> System.out.println(s);

// 多参数
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;

// 代码块（需要 return）
Comparator<Integer> comparator = (a, b) -> {
    System.out.println("comparing");
    return a.compareTo(b);
};
```

**Lambda 语法结构：**
```
(参数列表) -> { 代码体 }
```

| 简化规则 | 说明 |
|---------|------|
| 单参数可省略括号 | `(s) -> ...` → `s -> ...` |
| 单条语句可省略花括号和 return | `(a,b) -> { return a+b; }` → `(a,b) -> a+b` |
| 参数类型可省略（类型推断） | `(Integer a) -> ...` → `(a) -> ...` |

#### 2. Stream API

**Stream 提供声明式的数据处理能力，支持链式操作：**

```java
List<User> users = Arrays.asList(
    new User(1L, "张三", 20),
    new User(2L, "李四", 25),
    new User(3L, "王五", 30)
);

// 过滤 + 映射 + 收集
List<String> names = users.stream()
    .filter(u -> u.getAge() > 20)
    .map(User::getName)
    .collect(Collectors.toList());

// 统计
long count = users.stream()
    .filter(u -> u.getAge() < 30)
    .count();

// 分组
Map<String, List<User>> groupByFirstChar = users.stream()
    .collect(Collectors.groupingBy(u -> u.getName().substring(0, 1)));
```

**常用 Stream 操作：**

| 操作 | 说明 | 返回类型 |
|-----|------|---------|
| `filter(Predicate)` | 过滤元素 | Stream |
| `map(Function)` | 映射转换 | Stream |
| `flatMap(Function)` | 扁平化映射 | Stream |
| `collect(Collector)` | 收集结果 | 集合/值 |
| `count()` | 统计数量 | long |
| `findFirst()` | 获取第一个 | Optional |
| `anyMatch(Predicate)` | 任意匹配 | boolean |
| `sorted(Comparator)` | 排序 | Stream |

#### 3. 异常处理机制

**Java 异常分类：**

```java
// 编译时异常（Checked Exception）- 必须处理或声明
try {
    FileInputStream fis = new FileInputStream("file.txt");
} catch (FileNotFoundException e) {
    // 必须处理
    e.printStackTrace();
}

// 运行时异常（Unchecked Exception）- 可选处理
int[] arr = new int[3];
// arr[5] = 10; // ArrayIndexOutOfBoundsException

// 自定义异常
public class BusinessException extends RuntimeException {
    private int code;
    
    public BusinessException(String message) {
        super(message);
        this.code = 400;
    }
    
    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }
    
    public int getCode() { return code; }
}
```

**异常处理最佳实践：**

| 原则 | 说明 |
|-----|------|
| 只捕获已知异常 | 避免 `catch(Exception e)` |
| 提供有意义的错误信息 | 便于排查问题 |
| 不要吞掉异常 | 至少记录日志 |
| 使用异常链 | `throw new RuntimeException(e)` |
| 自定义业务异常 | 区分业务错误和系统错误 |

#### 4. try-with-resources

**自动资源管理，实现 `AutoCloseable` 接口的资源会自动关闭：**

```java
// 传统方式（需要手动关闭）
BufferedReader reader = null;
try {
    reader = new BufferedReader(new FileReader("file.txt"));
    String line = reader.readLine();
} catch (IOException e) {
    e.printStackTrace();
} finally {
    if (reader != null) {
        try {
            reader.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

// try-with-resources（自动关闭）
try (BufferedReader reader = new BufferedReader(new FileReader("file.txt"))) {
    String line = reader.readLine();
} catch (IOException e) {
    e.printStackTrace();
}
```

**支持多个资源：**
```java
try (Connection conn = DriverManager.getConnection(url, user, pwd);
     PreparedStatement stmt = conn.prepareStatement(sql);
     ResultSet rs = stmt.executeQuery()) {
    // 使用资源
} catch (SQLException e) {
    e.printStackTrace();
}
```