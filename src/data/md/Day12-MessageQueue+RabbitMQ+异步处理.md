# Day 12：消息队列 RabbitMQ + 异步处理

### 📚 Java 补充（30 分钟）

#### 1. 生产者-消费者模式

```java
import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 简单的生产者-消费者模式实现
 */
public class ProducerConsumerPattern {
    
    private final Queue<Integer> queue = new LinkedList<>();
    private final int capacity = 10;
    private final Lock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();
    
    /**
     * 生产者
     */
    class Producer implements Runnable {
        @Override
        public void run() {
            for (int i = 0; i < 20; i++) {
                try {
                    produce(i);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }
        
        private void produce(int item) throws InterruptedException {
            lock.lock();
            try {
                while (queue.size() == capacity) {
                    notFull.await(); // 队列满，等待
                }
                
                queue.add(item);
                System.out.println("生产者生产: " + item);
                
                notEmpty.signal(); // 通知消费者
            } finally {
                lock.unlock();
            }
        }
    }
    
    /**
     * 消费者
     */
    class Consumer implements Runnable {
        @Override
        public void run() {
            while (true) {
                try {
                    consume();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        
        private void consume() throws InterruptedException {
            lock.lock();
            try {
                while (queue.isEmpty()) {
                    notEmpty.await(); // 队列空，等待
                }
                
                int item = queue.poll();
                System.out.println("消费者消费: " + item);
                
                notFull.signal(); // 通知生产者
            } finally {
                lock.unlock();
            }
        }
    }
}
```

#### 2. 线程池基础

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class ThreadPoolExample {
    
    public static void main(String[] args) {
        // 创建固定大小的线程池
        ExecutorService executor = Executors.newFixedThreadPool(5);
        
        // 提交任务
        for (int i = 0; i < 10; i++) {
            final int taskId = i;
            executor.submit(() -> {
                System.out.println("任务 " + taskId + " 开始执行");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                System.out.println("任务 " + taskId + " 执行完成");
            });
        }
        
        // 关闭线程池
        executor.shutdown();
        try {
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：集成 RabbitMQ

**添加依赖：**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

**配置 application.yml：**

```yaml
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
    virtual-host: /
    publisher-confirm-type: correlated
    publisher-returns: true
    listener:
      simple:
        acknowledge-mode: manual
        concurrency: 5
        max-concurrency: 10
```

**配置类：**

```java
package com.example.demo.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    
    // 队列名称
    public static final String USER_REGISTER_QUEUE = "user.register.queue";
    public static final String ORDER_CREATE_QUEUE = "order.create.queue";
    public static final String EMAIL_SEND_QUEUE = "email.send.queue";
    
    // 交换机名称
    public static final String DIRECT_EXCHANGE = "direct.exchange";
    public static final String TOPIC_EXCHANGE = "topic.exchange";
    public static final String FANOUT_EXCHANGE = "fanout.exchange";
    
    // 路由键
    public static final String USER_ROUTING_KEY = "user.register";
    public static final String ORDER_ROUTING_KEY = "order.create";
    
    /**
     * 声明队列
     */
    @Bean
    public Queue userRegisterQueue() {
        return QueueBuilder.durable(USER_REGISTER_QUEUE).build();
    }
    
    @Bean
    public Queue orderCreateQueue() {
        return QueueBuilder.durable(ORDER_CREATE_QUEUE).build();
    }
    
    @Bean
    public Queue emailSendQueue() {
        return QueueBuilder.durable(EMAIL_SEND_QUEUE).build();
    }
    
    /**
     * 声明交换机
     */
    @Bean
    public DirectExchange directExchange() {
        return ExchangeBuilder.directExchange(DIRECT_EXCHANGE).build();
    }
    
    @Bean
    public TopicExchange topicExchange() {
        return ExchangeBuilder.topicExchange(TOPIC_EXCHANGE).build();
    }
    
    @Bean
    public FanoutExchange fanoutExchange() {
        return ExchangeBuilder.fanoutExchange(FANOUT_EXCHANGE).build();
    }
    
    /**
     * 绑定队列到交换机
     */
    @Bean
    public Binding userBinding(Queue userRegisterQueue, DirectExchange directExchange) {
        return BindingBuilder.bind(userRegisterQueue)
            .to(directExchange)
            .with(USER_ROUTING_KEY);
    }
    
    @Bean
    public Binding orderBinding(Queue orderCreateQueue, DirectExchange directExchange) {
        return BindingBuilder.bind(orderCreateQueue)
            .to(directExchange)
            .with(ORDER_ROUTING_KEY);
    }
    
    /**
     * 邮件队列绑定到 Fanout 交换机（广播模式）
     */
    @Bean
    public Binding emailBinding(Queue emailSendQueue, FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(emailSendQueue).to(fanoutExchange);
    }
}
```

#### 任务 2：消息生产者

```java
package com.example.demo.producer;

import com.example.demo.config.RabbitMQConfig;
import com.example.demo.dto.EmailMessage;
import com.example.demo.dto.OrderMessage;
import com.example.demo.dto.UserMessage;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.stereotype.Component;

@Component
public class MessageProducer {
    
    private final RabbitTemplate rabbitTemplate;
    
    public MessageProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
        // 设置 JSON 消息转换器
        this.rabbitTemplate.setMessageConverter(new Jackson2JsonMessageConverter());
    }
    
    /**
     * 发送用户注册消息
     */
    public void sendUserRegisterMessage(UserMessage message) {
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.DIRECT_EXCHANGE,
            RabbitMQConfig.USER_ROUTING_KEY,
            message
        );
    }
    
    /**
     * 发送订单创建消息
     */
    public void sendOrderCreateMessage(OrderMessage message) {
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.DIRECT_EXCHANGE,
            RabbitMQConfig.ORDER_ROUTING_KEY,
            message
        );
    }
    
    /**
     * 发送邮件消息（广播模式）
     */
    public void sendEmailMessage(EmailMessage message) {
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.FANOUT_EXCHANGE,
            "",  // Fanout 模式不需要路由键
            message
        );
    }
    
    /**
     * 发送带回调的消息
     */
    public void sendMessageWithCallback(String exchange, String routingKey, Object message) {
        // 设置确认回调
        rabbitTemplate.setConfirmCallback((correlationData, ack, cause) -> {
            if (ack) {
                System.out.println("消息发送成功: " + correlationData);
            } else {
                System.err.println("消息发送失败: " + cause);
            }
        });
        
        // 设置返回回调
        rabbitTemplate.setReturnsCallback(returnedMessage -> {
            System.err.println("消息退回: " + returnedMessage.getMessage());
        });
        
        rabbitTemplate.convertAndSend(exchange, routingKey, message);
    }
}
```

**消息 DTO：**

```java
// UserMessage.java
public record UserMessage(Long userId, String username, String email) {}

// OrderMessage.java
public record OrderMessage(Long orderId, Long userId, Double amount) {}

// EmailMessage.java
public record EmailMessage(String to, String subject, String content) {}
```

#### 任务 3：消息消费者

```java
package com.example.demo.consumer;

import com.example.demo.config.RabbitMQConfig;
import com.example.demo.dto.EmailMessage;
import com.example.demo.dto.OrderMessage;
import com.example.demo.dto.UserMessage;
import com.rabbitmq.client.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class MessageConsumer {
    
    private static final Logger logger = LoggerFactory.getLogger(MessageConsumer.class);
    
    /**
     * 消费用户注册消息
     */
    @RabbitListener(queues = RabbitMQConfig.USER_REGISTER_QUEUE)
    public void handleUserRegister(UserMessage message, Channel channel, Message msg) throws IOException {
        try {
            logger.info("收到用户注册消息: {}", message);
            
            // 处理业务逻辑
            processUserRegister(message);
            
            // 手动确认消息
            channel.basicAck(msg.getMessageProperties().getDeliveryTag(), false);
            
        } catch (Exception e) {
            logger.error("处理用户注册消息失败", e);
            
            // 消息重新入队（最多重试3次）
            if (msg.getMessageProperties().getRedelivered()) {
                // 已经重试过，直接拒绝
                channel.basicReject(msg.getMessageProperties().getDeliveryTag(), false);
            } else {
                // 重新入队
                channel.basicNack(msg.getMessageProperties().getDeliveryTag(), false, true);
            }
        }
    }
    
    /**
     * 消费订单创建消息
     */
    @RabbitListener(queues = RabbitMQConfig.ORDER_CREATE_QUEUE)
    public void handleOrderCreate(OrderMessage message) {
        logger.info("收到订单创建消息: {}", message);
        
        // 处理订单业务
        processOrderCreate(message);
    }
    
    /**
     * 消费邮件消息
     */
    @RabbitListener(queues = RabbitMQConfig.EMAIL_SEND_QUEUE)
    public void handleEmailSend(EmailMessage message) {
        logger.info("收到邮件消息: {}", message);
        
        // 发送邮件
        sendEmail(message);
    }
    
    private void processUserRegister(UserMessage message) {
        // 用户注册后的业务处理：发送欢迎邮件、初始化用户配置等
        logger.info("处理用户注册: {}", message.username());
    }
    
    private void processOrderCreate(OrderMessage message) {
        // 订单处理：库存扣减、通知物流、发送订单确认邮件等
        logger.info("处理订单创建: {}", message.orderId());
    }
    
    private void sendEmail(EmailMessage message) {
        // 发送邮件逻辑
        logger.info("发送邮件到: {}, 主题: {}", message.to(), message.subject());
    }
}
```

#### 任务 4：异步处理服务

```java
package com.example.demo.service;

import com.example.demo.dto.EmailMessage;
import com.example.demo.dto.OrderMessage;
import com.example.demo.dto.UserMessage;
import com.example.demo.producer.MessageProducer;
import org.springframework.stereotype.Service;

@Service
public class AsyncService {
    
    private final MessageProducer messageProducer;
    
    public AsyncService(MessageProducer messageProducer) {
        this.messageProducer = messageProducer;
    }
    
    /**
     * 用户注册后异步处理
     */
    public void handleUserRegisterAsync(Long userId, String username, String email) {
        UserMessage message = new UserMessage(userId, username, email);
        messageProducer.sendUserRegisterMessage(message);
    }
    
    /**
     * 订单创建后异步处理
     */
    public void handleOrderCreateAsync(Long orderId, Long userId, Double amount) {
        OrderMessage message = new OrderMessage(orderId, userId, amount);
        messageProducer.sendOrderCreateMessage(message);
    }
    
    /**
     * 异步发送邮件
     */
    public void sendEmailAsync(String to, String subject, String content) {
        EmailMessage message = new EmailMessage(to, subject, content);
        messageProducer.sendEmailMessage(message);
    }
}
```

#### 任务 5：延迟队列

**延迟队列配置：**

```java
package com.example.demo.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DelayQueueConfig {
    
    // 延迟交换机
    public static final String DELAY_EXCHANGE = "delay.exchange";
    // 延迟队列
    public static final String DELAY_QUEUE = "delay.queue";
    // 死信交换机
    public static final String DEAD_LETTER_EXCHANGE = "dead.letter.exchange";
    // 死信队列
    public static final String DEAD_LETTER_QUEUE = "dead.letter.queue";
    
    /**
     * 延迟交换机（使用 x-delayed-message 类型）
     */
    @Bean
    public CustomExchange delayExchange() {
        return new CustomExchange(DELAY_EXCHANGE, "x-delayed-message", true, false);
    }
    
    /**
     * 延迟队列
     */
    @Bean
    public Queue delayQueue() {
        return QueueBuilder.durable(DELAY_QUEUE).build();
    }
    
    /**
     * 死信交换机
     */
    @Bean
    public DirectExchange deadLetterExchange() {
        return ExchangeBuilder.directExchange(DEAD_LETTER_EXCHANGE).build();
    }
    
    /**
     * 死信队列（实际消费队列）
     */
    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DEAD_LETTER_QUEUE).build();
    }
    
    /**
     * 绑定延迟队列到延迟交换机
     */
    @Bean
    public Binding delayBinding(Queue delayQueue, CustomExchange delayExchange) {
        return BindingBuilder.bind(delayQueue).to(delayExchange).with("delay").noargs();
    }
    
    /**
     * 绑定死信队列到死信交换机
     */
    @Bean
    public Binding deadLetterBinding(Queue deadLetterQueue, DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(deadLetterQueue)
            .to(deadLetterExchange)
            .with("dead.letter");
    }
}
```

**延迟消息生产者：**

```java
package com.example.demo.producer;

import com.example.demo.config.DelayQueueConfig;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class DelayMessageProducer {
    
    private final RabbitTemplate rabbitTemplate;
    
    public DelayMessageProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }
    
    /**
     * 发送延迟消息
     * @param message 消息内容
     * @param delayMs 延迟时间（毫秒）
     */
    public void sendDelayMessage(String message, long delayMs) {
        MessageProperties properties = new MessageProperties();
        properties.setHeader("x-delay", delayMs);
        
        Message msg = new Message(message.getBytes(), properties);
        
        rabbitTemplate.send(
            DelayQueueConfig.DELAY_EXCHANGE,
            "delay",
            msg
        );
    }
    
    /**
     * 发送订单超时检查消息（30分钟后检查）
     */
    public void sendOrderTimeoutCheck(Long orderId) {
        long delayMs = 30 * 60 * 1000; // 30分钟
        sendDelayMessage("ORDER_TIMEOUT_CHECK:" + orderId, delayMs);
    }
    
    /**
     * 发送重试消息（5分钟后重试）
     */
    public void sendRetryMessage(String taskId) {
        long delayMs = 5 * 60 * 1000; // 5分钟
        sendDelayMessage("RETRY_TASK:" + taskId, delayMs);
    }
}
```

#### 任务 6：消息确认与可靠性

**配置消息确认：**

```java
package com.example.demo.config;

import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfirmConfig {
    
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        
        // 设置消息转换器
        template.setMessageConverter(new Jackson2JsonMessageConverter());
        
        // 启用确认模式
        template.setConfirmCallback((correlationData, ack, cause) -> {
            if (ack) {
                // 消息已确认，更新消息状态
                System.out.println("消息已发送到交换机: " + correlationData);
            } else {
                // 消息发送失败，进行重试或记录
                System.err.println("消息发送失败: " + cause);
            }
        });
        
        // 启用返回模式
        template.setReturnsCallback(returnedMessage -> {
            // 消息路由失败
            System.err.println("消息路由失败: " + returnedMessage.getMessage());
            System.err.println("路由键: " + returnedMessage.getRoutingKey());
            System.err.println("交换机: " + returnedMessage.getExchange());
            System.err.println("回复码: " + returnedMessage.getReplyCode());
            System.err.println("回复文本: " + returnedMessage.getReplyText());
        });
        
        return template;
    }
}
```

---

### 📝 今日笔记（5 行）

1. **RabbitMQ**：高性能消息队列，支持多种交换机类型（Direct、Topic、Fanout、Headers）
2. **生产者-消费者模式**：解耦生产者和消费者，支持异步处理
3. **消息确认**：通过 `confirmCallback` 和 `returnsCallback` 确保消息可靠传递
4. **手动确认**：消费端使用 `basicAck`、`basicNack`、`basicReject` 手动控制消息确认
5. **延迟队列**：通过 `x-delayed-message` 类型交换机实现消息延迟投递