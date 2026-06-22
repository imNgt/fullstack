# Day 05：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. Java 8 日期时间 API

**Java 8 引入了新的日期时间 API，替代旧的 `Date` 和 `Calendar`：**

```java
// 创建日期时间
LocalDate today = LocalDate.now();
LocalDateTime now = LocalDateTime.now();
LocalDateTime specific = LocalDateTime.of(2024, 1, 15, 10, 30);

// 格式化
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
String formatted = now.format(formatter);

// 解析
LocalDateTime parsed = LocalDateTime.parse("2024-01-15 10:30:00", formatter);

// 时间运算
LocalDateTime tomorrow = today.plusDays(1).atStartOfDay();
Duration duration = Duration.between(start, end);
```

**新旧 API 对比：**

| 特性 | 旧 API（Date/Calendar） | 新 API（Java 8） |
|-----|------------------------|------------------|
| 线程安全 | 不安全 | 线程安全 |
| 可变/不可变 | 可变 | 不可变 |
| 时区支持 | 复杂 | 清晰（ZoneId） |
| 格式化 | SimpleDateFormat | DateTimeFormatter |

**常用日期时间类：**

| 类 | 说明 | 示例 |
|-----|------|------|
| `LocalDate` | 日期（年月日） | 2024-01-15 |
| `LocalTime` | 时间（时分秒） | 10:30:00 |
| `LocalDateTime` | 日期时间 | 2024-01-15T10:30:00 |
| `ZonedDateTime` | 带时区的日期时间 | 2024-01-15T10:30:00+08:00 |
| `Duration` | 时间段（秒/纳秒） | PT2H30M |
| `Period` | 日期间隔（年月日） | P1Y2M3D |

#### 2. Optional 防空指针

**Optional 是一个容器对象，用于优雅处理 null 值：**

```java
// 创建 Optional
Optional<String> empty = Optional.empty();
Optional<String> present = Optional.of("value");           // 不能为 null
Optional<String> nullable = Optional.ofNullable(nullableValue);  // 可以为 null

// 安全取值
String result = optional.orElse("default");           // 默认值
String result = optional.orElseGet(() -> computeDefault());  // 惰性计算默认值
String result = optional.orElseThrow(() -> new RuntimeException("值不存在"));

// 链式调用（推荐）
String name = Optional.ofNullable(user)
    .map(User::getName)
    .orElse("Unknown");

// 条件处理
optional.ifPresent(value -> process(value));
optional.ifPresentOrElse(
    value -> process(value),
    () -> handleEmpty()
);
```

**Optional 使用场景：**

```java
// 传统方式（容易 NPE）
public String getUserName(User user) {
    if (user != null) {
        String name = user.getName();
        if (name != null) {
            return name.toUpperCase();
        }
    }
    return "UNKNOWN";
}

// 使用 Optional
public String getUserName(User user) {
    return Optional.ofNullable(user)
        .map(User::getName)
        .map(String::toUpperCase)
        .orElse("UNKNOWN");
}
```

**Optional 最佳实践：**

| 原则 | 说明 |
|-----|------|
| 不要作为字段使用 | Optional 不是 Serializable |
| 不要在集合中使用 | `List<Optional<User>>` 不好 |
| 不要用 `isPresent()` + `get()` | 这和 null 判断没区别 |
| 优先使用 `map()`/`flatMap()`/`orElse()` | 链式调用更优雅 |

#### 3. DateTimeFormatter

**线程安全的日期格式化工具：**

```java
// 预定义格式
DateTimeFormatter.ISO_LOCAL_DATE      // 2024-01-15
DateTimeFormatter.ISO_LOCAL_TIME      // 10:30:00
DateTimeFormatter.ISO_LOCAL_DATE_TIME // 2024-01-15T10:30:00

// 自定义格式
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

// 带本地化的格式
DateTimeFormatter chinaFormatter = DateTimeFormatter.ofPattern("yyyy年MM月dd日", Locale.CHINA);

// 解析时宽松模式
DateTimeFormatter lenient = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    .withResolverStyle(ResolverStyle.LENIENT);  // 允许 2024-13-32 这样的日期
```

#### 4. 时区处理

```java
// 获取时区
ZoneId zoneId = ZoneId.systemDefault();  // 系统时区
ZoneId shanghai = ZoneId.of("Asia/Shanghai");
ZoneId utc = ZoneId.of("UTC");

// 时区转换
LocalDateTime localTime = LocalDateTime.now();
ZonedDateTime zonedTime = localTime.atZone(shanghai);
ZonedDateTime utcTime = zonedTime.withZoneSameInstant(utc);

// 常用时区 ID
// Asia/Shanghai, Asia/Tokyo, America/New_York, Europe/London
```