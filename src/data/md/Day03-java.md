# Day 03：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. 泛型基础

```java
// 泛型类
public class Result<T> {
    private T data;
    private int code;
    
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
}

// 泛型方法
public <T> List<T> filter(List<T> list, Predicate<T> predicate) {
    return list.stream().filter(predicate).collect(Collectors.toList());
}

// 通配符
public void process(List<?> list) {
    for (Object obj : list) {
        System.out.println(obj);
    }
}
```

##### 泛型的好处

| 特性 | 说明 |
|------|------|
| **类型安全** | 编译时检查类型，避免运行时错误 |
| **代码复用** | 一套代码支持多种类型 |
| **自动装箱拆箱** | 简化基本类型操作 |

##### 泛型通配符

| 通配符 | 含义 | 示例 |
|--------|------|------|
| `?` | 任意类型 | `List<?>` |
| `? extends T` | T 或 T 的子类 | `List<? extends Number>` |
| `? super T` | T 或 T 的父类 | `List<? super Integer>` |

#### 2. 装箱与拆箱

```java
// 自动装箱
Integer num = 10;  // 等价于 Integer.valueOf(10)

// 自动拆箱
int value = num;   // 等价于 num.intValue()

// 注意：null 拆箱会报 NullPointerException
Integer nullable = null;
// int x = nullable;  // 运行时异常
```

##### 包装类对应关系

| 基本类型 | 包装类 | 默认值 |
|----------|--------|--------|
| `int` | `Integer` | `0` |
| `long` | `Long` | `0L` |
| `double` | `Double` | `0.0` |
| `boolean` | `Boolean` | `false` |
| `char` | `Character` | `\u0000` |

#### 3. 静态内部类 vs 非静态内部类

```java
public class Outer {
    private String outerField = "outer";
    
    // 静态内部类
    public static class StaticInner {
        public void print() {
            // 不能访问外部类的非静态成员
            System.out.println("Static Inner");
        }
    }
    
    // 非静态内部类
    public class Inner {
        public void print() {
            // 可以访问外部类的所有成员
            System.out.println(outerField);
        }
    }
}

// 使用
Outer.StaticInner staticInner = new Outer.StaticInner();
Outer outer = new Outer();
Outer.Inner inner = outer.new Inner();
```

#### 4. 枚举类

```java
public enum Status {
    SUCCESS(200, "成功"),
    ERROR(500, "失败"),
    NOT_FOUND(404, "未找到");
    
    private final int code;
    private final String message;
    
    Status(int code, String message) {
        this.code = code;
        this.message = message;
    }
    
    public int getCode() { return code; }
    public String getMessage() { return message; }
}

// 使用
Status status = Status.SUCCESS;
System.out.println(status.getCode());  // 200
```
