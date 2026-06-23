# Day 15：API 网关 + Spring Cloud + 微服务基础

### 📚 Java 补充（30 分钟）

#### 1. HTTP 客户端基础

```java
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class HttpClientExample {
    
    public static void main(String[] args) throws Exception {
        URL url = new URL("https://api.example.com/users");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Accept", "application/json");
        
        BufferedReader reader = new BufferedReader(
            new InputStreamReader(conn.getInputStream()));
        
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            response.append(line);
        }
        reader.close();
        
        System.out.println("Response: " + response.toString());
    }
}
```

#### 2. 负载均衡算法

```java
import java.util.List;
import java.util.Random;

public class LoadBalancer {
    
    private final List<String> servers;
    private int roundRobinIndex = 0;
    private final Random random = new Random();
    
    public LoadBalancer(List<String> servers) {
        this.servers = servers;
    }
    
    /**
     * 轮询算法
     */
    public String roundRobin() {
        String server = servers.get(roundRobinIndex);
        roundRobinIndex = (roundRobinIndex + 1) % servers.size();
        return server;
    }
    
    /**
     * 随机算法
     */
    public String random() {
        return servers.get(random.nextInt(servers.size()));
    }
    
    /**
     * 加权随机算法
     */
    public String weightedRandom(int[] weights) {
        int totalWeight = 0;
        for (int weight : weights) {
            totalWeight += weight;
        }
        
        int randomWeight = random.nextInt(totalWeight);
        for (int i = 0; i < servers.size(); i++) {
            randomWeight -= weights[i];
            if (randomWeight < 0) {
                return servers.get(i);
            }
        }
        
        return servers.get(0);
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：Spring Cloud Gateway

**添加依赖：**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
```

**配置 application.yml：**

```yaml
server:
  port: 8080

spring:
  application:
    name: gateway-service
  cloud:
    gateway:
      routes:
        # 用户服务路由
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/users/**
          filters:
            - StripPrefix=2
            
        # 订单服务路由
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=2
            
        # 产品服务路由
        - id: product-service
          uri: lb://product-service
          predicates:
            - Path=/api/products/**
          filters:
            - StripPrefix=2

# 服务发现配置
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

**网关配置类：**

```java
package com.example.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {
    
    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            // 用户服务
            .route("user-service", r -> r
                .path("/api/users/**")
                .filters(f -> f.stripPrefix(2))
                .uri("lb://user-service"))
            
            // 订单服务
            .route("order-service", r -> r
                .path("/api/orders/**")
                .filters(f -> f.stripPrefix(2))
                .uri("lb://order-service"))
            
            // 产品服务
            .route("product-service", r -> r
                .path("/api/products/**")
                .filters(f -> f.stripPrefix(2))
                .uri("lb://product-service"))
            
            .build();
    }
}
```

#### 任务 2：全局过滤器

```java
package com.example.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class LoggingFilter implements GlobalFilter, Ordered {
    
    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getPath().toString();
        String remoteAddress = exchange.getRequest().getRemoteAddress().toString();
        
        logger.info("请求进入: {} {} from {}", method, path, remoteAddress);
        
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            int statusCode = exchange.getResponse().getStatusCode().value();
            logger.info("请求完成: {} {} -> {}", method, path, statusCode);
        }));
    }
    
    @Override
    public int getOrder() {
        return -1; // 优先级最高
    }
}
```

**认证过滤器：**

```java
package com.example.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class AuthFilter implements GlobalFilter, Ordered {
    
    private static final String AUTH_HEADER = "Authorization";
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // 跳过公开接口
        String path = exchange.getRequest().getPath().toString();
        if (path.startsWith("/api/public/") || path.startsWith("/api/auth/")) {
            return chain.filter(exchange);
        }
        
        // 检查认证头
        String authHeader = exchange.getRequest().getHeaders().getFirst(AUTH_HEADER);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        
        // 验证 Token（简化版）
        String token = authHeader.substring(7);
        if (!validateToken(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            return exchange.getResponse().setComplete();
        }
        
        return chain.filter(exchange);
    }
    
    private boolean validateToken(String token) {
        // 实际项目中应该调用认证服务验证 Token
        return token != null && !token.isEmpty();
    }
    
    @Override
    public int getOrder() {
        return 0; // 在 LoggingFilter 之后执行
    }
}
```

#### 任务 3：Eureka 服务注册中心

**添加依赖：**

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
</dependency>
```

**配置 application.yml：**

```yaml
server:
  port: 8761

spring:
  application:
    name: eureka-server

eureka:
  instance:
    hostname: localhost
  client:
    register-with-eureka: false
    fetch-registry: false
    service-url:
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
```

**启动类：**

```java
package com.example.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

#### 任务 4：服务提供者

**添加依赖：**

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

**配置 application.yml：**

```yaml
server:
  port: 8081

spring:
  application:
    name: user-service

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
```

**启动类：**

```java
package com.example.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
```

**控制器：**

```java
package com.example.user.controller;

import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {
    
    @GetMapping
    public List<User> getAllUsers() {
        return Arrays.asList(
            new User(1L, "张三", "zhangsan@example.com"),
            new User(2L, "李四", "lisi@example.com"),
            new User(3L, "王五", "wangwu@example.com")
        );
    }
    
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return new User(id, "用户" + id, "user" + id + "@example.com");
    }
    
    public record User(Long id, String name, String email) {}
}
```

#### 任务 5：服务消费者（Feign）

**添加依赖：**

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

**启用 Feign：**

```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
```

**Feign 客户端：**

```java
package com.example.order.client;

import com.example.order.dto.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "user-service")
public interface UserServiceClient {
    
    @GetMapping("/users")
    List<UserResponse> getAllUsers();
    
    @GetMapping("/users/{id}")
    UserResponse getUserById(@PathVariable Long id);
}
```

**使用 Feign 客户端：**

```java
package com.example.order.service;

import com.example.order.client.UserServiceClient;
import com.example.order.dto.OrderResponse;
import com.example.order.dto.UserResponse;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {
    
    private final UserServiceClient userServiceClient;
    
    public OrderService(UserServiceClient userServiceClient) {
        this.userServiceClient = userServiceClient;
    }
    
    public List<OrderResponse> getOrdersWithUserInfo() {
        List<UserResponse> users = userServiceClient.getAllUsers();
        
        return Arrays.asList(
            new OrderResponse(1L, 100.0, "已完成"),
            new OrderResponse(2L, 200.0, "待付款"),
            new OrderResponse(3L, 300.0, "已发货")
        ).stream()
            .map(order -> {
                UserResponse user = users.stream()
                    .filter(u -> u.id().equals(order.userId()))
                    .findFirst()
                    .orElse(null);
                return new OrderResponse(order.id(), order.amount(), order.status(), user);
            })
            .collect(Collectors.toList());
    }
}
```

#### 任务 6：Ribbon 负载均衡

**配置 Ribbon：**

```yaml
user-service:
  ribbon:
    NFLoadBalancerRuleClassName: com.netflix.loadbalancer.RandomRule
    ConnectTimeout: 3000
    ReadTimeout: 5000
```

**自定义负载均衡规则：**

```java
package com.example.order.config;

import com.netflix.loadbalancer.IRule;
import com.netflix.loadbalancer.RandomRule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RibbonConfig {
    
    @Bean
    public IRule ribbonRule() {
        return new RandomRule(); // 随机规则
        // return new RoundRobinRule(); // 轮询规则
        // return new WeightedResponseTimeRule(); // 加权响应时间规则
    }
}
```

---

### 📝 今日笔记（5 行）

1. **API 网关**：统一入口，负责路由转发、认证、限流、日志等
2. **Eureka**：服务注册中心，服务自动注册和发现
3. **Feign**：声明式 HTTP 客户端，简化服务间调用
4. **Ribbon**：客户端负载均衡，支持多种负载均衡算法
5. **微服务架构**：将单体应用拆分为多个独立服务，通过 API 网关统一访问