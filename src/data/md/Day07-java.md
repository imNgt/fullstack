# Day 07：Java 补充知识

### 📚 Java 补充（30 分钟）

#### 1. JDBC 基础

**JDBC（Java Database Connectivity）是 Java 访问数据库的标准 API：**

```java
// 传统 JDBC 步骤
String url = "jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=UTC";
String username = "root";
String password = "password";

try (Connection conn = DriverManager.getConnection(url, username, password);
     PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
     ResultSet rs = stmt.executeQuery()) {

    stmt.setLong(1, 1L);
    while (rs.next()) {
        String name = rs.getString("name");
        int age = rs.getInt("age");
    }
} catch (SQLException e) {
    e.printStackTrace();
}
```

**JDBC 核心组件：**

| 组件 | 作用 |
|-----|------|
| `DriverManager` | 管理数据库驱动，建立连接 |
| `Connection` | 数据库连接对象 |
| `PreparedStatement` | 预编译 SQL 语句，防止 SQL 注入 |
| `Statement` | 普通 SQL 语句执行（不推荐） |
| `ResultSet` | 查询结果集 |

**PreparedStatement vs Statement：**

| 特性 | PreparedStatement | Statement |
|-----|------------------|-----------|
| SQL 注入 | 安全（参数化） | 不安全 |
| 性能 | 预编译，复用执行计划 | 每次编译 |
| 使用场景 | 常用（推荐） | 仅执行静态 SQL |

#### 2. 数据库连接池

**连接池复用数据库连接，避免频繁创建销毁的开销：**

```java
// 连接池优势：
// 1. 复用连接，减少创建开销（TCP 握手等）
// 2. 控制连接数量，防止资源耗尽
// 3. 统一管理连接生命周期
// 4. 提供连接监控和统计

// Druid 配置示例
@Configuration
public class DruidConfig {

    @Bean
    public DataSource dataSource() {
        DruidDataSource ds = new DruidDataSource();
        ds.setUrl("jdbc:mysql://localhost:3306/mydb");
        ds.setUsername("root");
        ds.setPassword("password");
        ds.setInitialSize(5);   // 初始连接数
        ds.setMaxActive(20);    // 最大活跃连接数
        ds.setMinIdle(5);       // 最小空闲连接数
        ds.setMaxWait(60000);   // 获取连接最大等待时间
        return ds;
    }
}
```

**常用连接池对比：**

| 连接池 | 说明 | 特点 |
|-------|------|------|
| **HikariCP** | Spring Boot 默认 | 高性能，零拷贝设计 |
| **Druid** | 阿里巴巴开源 | 强大的监控和扩展能力 |
| **C3P0** | 老牌连接池 | 稳定但性能一般 |
| **DBCP** | Apache 开源 | 功能全面 |

**连接池配置参数：**

| 参数 | 说明 | 建议值 |
|-----|------|-------|
| `initialSize` | 初始连接数 | 5-10 |
| `maxActive` | 最大连接数 | 根据并发量调整 |
| `minIdle` | 最小空闲连接数 | 保持一定空闲连接 |
| `maxWait` | 获取连接超时时间 | 60000ms |
| `validationQuery` | 连接校验 SQL | `SELECT 1` |

#### 3. SQL 注入防护

**SQL 注入是常见的安全漏洞，必须防范：**

```java
// 危险：拼接 SQL（易受注入攻击）
String sql = "SELECT * FROM users WHERE username = '" + username + "'";

// 安全：使用 PreparedStatement
String sql = "SELECT * FROM users WHERE username = ?";
PreparedStatement stmt = conn.prepareStatement(sql);
stmt.setString(1, username);  // 参数化查询

// 使用 MyBatis（自动参数化）
@Select("SELECT * FROM users WHERE username = #{username}")
User findByUsername(@Param("username") String username);
```

**SQL 注入示例：**

```java
// 用户输入（恶意）
String username = "admin' OR '1'='1";

// 拼接 SQL 结果
// SELECT * FROM users WHERE username = 'admin' OR '1'='1'
// 条件永真，可获取所有用户数据

// 使用参数化查询后
// SELECT * FROM users WHERE username = ?
// 参数: 'admin\' OR \'1\'=\'1'
// 作为字符串处理，安全
```

#### 4. 事务管理基础

**数据库事务的 ACID 特性：**

| 特性 | 说明 |
|-----|------|
| **A**tomicity（原子性） | 事务中的操作要么全部成功，要么全部回滚 |
| **C**onsistency（一致性） | 事务执行前后数据状态一致 |
| **I**solation（隔离性） | 事务之间相互隔离 |
| **D**urability（持久性） | 事务提交后数据持久化 |

**事务隔离级别：**

| 级别 | 说明 | 问题 |
|-----|------|------|
| `READ_UNCOMMITTED` | 读未提交 | 脏读、不可重复读、幻读 |
| `READ_COMMITTED` | 读已提交（Oracle 默认） | 不可重复读、幻读 |
| `REPEATABLE_READ` | 可重复读（MySQL 默认） | 幻读 |
| `SERIALIZABLE` | 串行化 | 性能最差，无并发问题 |