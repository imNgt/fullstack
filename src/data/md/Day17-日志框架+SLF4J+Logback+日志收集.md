# Day 17：日志框架 + SLF4J + Logback + 日志收集

### 📚 Java 补充（30 分钟）

#### 1. 日志级别

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoggingLevels {
    
    private static final Logger logger = LoggerFactory.getLogger(LoggingLevels.class);
    
    public static void main(String[] args) {
        // 日志级别从低到高
        logger.trace("这是 TRACE 级别日志 - 最详细的调试信息");
        logger.debug("这是 DEBUG 级别日志 - 调试信息");
        logger.info("这是 INFO 级别日志 - 一般信息");
        logger.warn("这是 WARN 级别日志 - 警告信息");
        logger.error("这是 ERROR 级别日志 - 错误信息");
    }
}
```

#### 2. 参数化日志

```java
public class ParameterizedLogging {
    
    private static final Logger logger = LoggerFactory.getLogger(ParameterizedLogging.class);
    
    public void processUser(Long userId, String username) {
        // 使用 {} 作为占位符
        logger.info("处理用户: userId={}, username={}", userId, username);
        
        try {
            // 业务逻辑
        } catch (Exception e) {
            // 记录异常
            logger.error("处理用户失败: userId={}", userId, e);
        }
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：Logback 配置

**logback-spring.xml：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    
    <!-- 控制台输出 -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- 文件输出（按天滚动） -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/app.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/app.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
            <totalSizeCap>1GB</totalSizeCap>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- 异步日志 -->
    <appender name="ASYNC" class="ch.qos.logback.classic.AsyncAppender">
        <appender-ref ref="FILE" />
        <queueSize>1024</queueSize>
        <discardingThreshold>0</discardingThreshold>
        <includeCallerData>false</includeCallerData>
    </appender>
    
    <!-- 根日志级别 -->
    <root level="INFO">
        <appender-ref ref="CONSOLE" />
        <appender-ref ref="ASYNC" />
    </root>
    
    <!-- 特定包的日志级别 -->
    <logger name="com.example.demo" level="DEBUG" />
    <logger name="org.springframework" level="WARN" />
    <logger name="com.zaxxer.hikari" level="INFO" />
    
</configuration>
```

#### 任务 2：结构化日志（JSON 格式）

**添加依赖：**

```xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>7.3</version>
</dependency>
```

**配置 JSON 输出：**

```xml
<appender name="JSON_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/app.json</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>logs/app.%d{yyyy-MM-dd}.json</fileNamePattern>
        <maxHistory>30</maxHistory>
    </rollingPolicy>
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
        <customFields>{"appname":"demo-app","environment":"development"}</customFields>
    </encoder>
</appender>
```

#### 任务 3：MDC（Mapped Diagnostic Context）

```java
package com.example.demo.filter;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import jakarta.servlet.*;
import java.io.IOException;
import java.util.UUID;

@Component
public class MdcFilter implements Filter {
    
    private static final String REQUEST_ID = "requestId";
    private static final String USER_ID = "userId";
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        
        try {
            // 设置请求 ID
            MDC.put(REQUEST_ID, UUID.randomUUID().toString());
            
            // 获取用户 ID（从请求头或认证信息）
            String userId = request.getParameter("userId");
            if (userId != null) {
                MDC.put(USER_ID, userId);
            }
            
            chain.doFilter(request, response);
        } finally {
            // 清理 MDC
            MDC.remove(REQUEST_ID);
            MDC.remove(USER_ID);
        }
    }
}
```

**配置 MDC 输出：**

```xml
<encoder>
    <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} %X{requestId} %X{userId} - %msg%n</pattern>
</encoder>
```

#### 任务 4：自定义日志格式

```java
package com.example.demo.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BusinessLogger {
    
    private static final Logger logger = LoggerFactory.getLogger(BusinessLogger.class);
    
    /**
     * 记录用户操作日志
     */
    public static void logUserAction(String userId, String action, String detail) {
        logger.info("[USER_ACTION] userId={}, action={}, detail={}", userId, action, detail);
    }
    
    /**
     * 记录订单日志
     */
    public static void logOrder(Long orderId, String status, Double amount) {
        logger.info("[ORDER] orderId={}, status={}, amount={}", orderId, status, amount);
    }
    
    /**
     * 记录支付日志
     */
    public static void logPayment(String paymentId, String method, Double amount) {
        logger.info("[PAYMENT] paymentId={}, method={}, amount={}", paymentId, method, amount);
    }
}
```

#### 任务 5：日志收集（ELK 栈）

**配置 Logstash 输出：**

```xml
<appender name="LOGSTASH" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
    <destination>localhost:5044</destination>
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
        <customFields>{"appname":"demo-app"}</customFields>
    </encoder>
</appender>
```

**Logstash 配置（logstash.conf）：**

```ruby
input {
  tcp {
    port => 5044
    codec => json_lines
  }
}

filter {
  grok {
    match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{DATA:logger} %{DATA:message}" }
  }
  
  date {
    match => [ "timestamp", "yyyy-MM-dd HH:mm:ss.SSS" ]
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
  
  stdout {
    codec => rubydebug
  }
}
```

#### 任务 6：日志最佳实践

```java
package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    /**
     * 正确的日志使用方式
     */
    public void updateUser(Long userId, String username) {
        // 1. 使用参数化日志，避免字符串拼接
        logger.info("更新用户信息: userId={}, username={}", userId, username);
        
        try {
            // 业务逻辑
            
            // 2. 记录重要业务事件
            logger.info("用户更新成功: userId={}", userId);
            
        } catch (Exception e) {
            // 3. 记录异常时传入异常对象
            logger.error("更新用户失败: userId={}", userId, e);
        }
    }
    
    /**
     * 错误的日志使用方式（反例）
     */
    public void badLoggingExample(Long userId) {
        // ❌ 避免字符串拼接
        logger.info("用户ID: " + userId);
        
        // ❌ 避免在生产环境记录敏感信息
        // logger.info("用户密码: " + password);
        
        // ❌ 避免重复日志
        // logger.debug("开始处理用户");
        // logger.debug("处理用户中...");
        // logger.debug("完成处理用户");
    }
}
```

---

### 📝 今日笔记（5 行）

1. **SLF4J**：日志门面，提供统一的日志 API，支持多种日志实现
2. **Logback**：SLF4J 的默认实现，高性能、配置灵活
3. **MDC**：映射诊断上下文，用于在多线程环境中关联请求
4. **ELK 栈**：Elasticsearch、Logstash、Kibana，用于日志收集、存储和可视化
5. **日志最佳实践**：使用参数化日志、避免敏感信息、合理设置日志级别