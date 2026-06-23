# Day 14：定时任务 + Quartz + 异步调度

### 📚 Java 补充（30 分钟）

#### 1. Timer 和 TimerTask

```java
import java.util.Timer;
import java.util.TimerTask;

/**
 * Timer 定时任务示例
 */
public class TimerExample {
    
    public static void main(String[] args) {
        Timer timer = new Timer();
        
        // 延迟 1 秒后执行，之后每隔 2 秒执行一次
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                System.out.println("定时任务执行: " + System.currentTimeMillis());
            }
        }, 1000, 2000);
        
        // 延迟 3 秒后执行一次
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                System.out.println("一次性任务执行");
            }
        }, 3000);
    }
}
```

#### 2. ScheduledExecutorService

```java
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class ScheduledExecutorExample {
    
    public static void main(String[] args) {
        ScheduledExecutorService executor = Executors.newScheduledThreadPool(2);
        
        // 延迟 1 秒后执行，之后每隔 2 秒执行一次
        executor.scheduleAtFixedRate(() -> {
            System.out.println("定时任务执行: " + System.currentTimeMillis());
        }, 1, 2, TimeUnit.SECONDS);
        
        // 延迟 3 秒后执行一次
        executor.schedule(() -> {
            System.out.println("一次性任务执行");
        }, 3, TimeUnit.SECONDS);
        
        // 关闭执行器（不关闭则程序会一直运行）
        // executor.shutdown();
    }
}
```

---

### 💻 Spring 实战（1.5 小时）

#### 任务 1：@Scheduled 注解

**启用定时任务：**

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling  // 启用定时任务
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

**定时任务示例：**

```java
package com.example.demo.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class SimpleScheduledTasks {
    
    private static final Logger logger = LoggerFactory.getLogger(SimpleScheduledTasks.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    /**
     * 每 5 秒执行一次
     */
    @Scheduled(fixedRate = 5000)
    public void fixedRateTask() {
        logger.info("fixedRate 任务执行: {}", LocalDateTime.now().format(formatter));
    }
    
    /**
     * 每 5 秒执行一次（以上次任务完成后开始计算）
     */
    @Scheduled(fixedDelay = 5000)
    public void fixedDelayTask() {
        logger.info("fixedDelay 任务执行: {}", LocalDateTime.now().format(formatter));
        try {
            Thread.sleep(2000); // 模拟任务执行时间
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
    
    /**
     * 使用 Cron 表达式：每分钟执行一次
     */
    @Scheduled(cron = "0 * * * * ?")
    public void cronTask() {
        logger.info("Cron 任务执行: {}", LocalDateTime.now().format(formatter));
    }
    
    /**
     * 延迟 10 秒后开始执行，之后每 3 秒执行一次
     */
    @Scheduled(initialDelay = 10000, fixedRate = 3000)
    public void initialDelayTask() {
        logger.info("initialDelay 任务执行: {}", LocalDateTime.now().format(formatter));
    }
}
```

**Cron 表达式示例：**

| 表达式 | 说明 |
|--------|------|
| `0 * * * * ?` | 每分钟执行一次 |
| `0 0 * * * ?` | 每小时执行一次 |
| `0 0 12 * * ?` | 每天中午 12 点执行 |
| `0 0 12 * * MON` | 每周一中午 12 点执行 |
| `0 0 12 1 * ?` | 每月 1 号中午 12 点执行 |
| `0 0/5 * * * ?` | 每 5 分钟执行一次 |

#### 任务 2：集成 Quartz

**添加依赖：**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-quartz</artifactId>
</dependency>
```

**Quartz 配置：**

```java
package com.example.demo.config;

import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuartzConfig {
    
    /**
     * 定义 JobDetail
     */
    @Bean
    public JobDetail sampleJobDetail() {
        return JobBuilder.newJob(SampleJob.class)
            .withIdentity("sampleJob")
            .storeDurably()
            .build();
    }
    
    /**
     * 定义 Trigger
     */
    @Bean
    public Trigger sampleJobTrigger() {
        // 每 10 秒执行一次
        SimpleScheduleBuilder scheduleBuilder = SimpleScheduleBuilder.simpleSchedule()
            .withIntervalInSeconds(10)
            .repeatForever();
        
        return TriggerBuilder.newTrigger()
            .forJob(sampleJobDetail())
            .withIdentity("sampleTrigger")
            .withSchedule(scheduleBuilder)
            .build();
    }
    
    /**
     * Cron Trigger
     */
    @Bean
    public Trigger cronTrigger() {
        CronScheduleBuilder scheduleBuilder = CronScheduleBuilder.cronSchedule("0 * * * * ?");
        
        return TriggerBuilder.newTrigger()
            .forJob(sampleJobDetail())
            .withIdentity("cronTrigger")
            .withSchedule(scheduleBuilder)
            .build();
    }
}
```

**Quartz Job：**

```java
package com.example.demo.job;

import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class SampleJob implements Job {
    
    private static final Logger logger = LoggerFactory.getLogger(SampleJob.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        logger.info("Quartz 任务执行: {}", LocalDateTime.now().format(formatter));
        
        // 获取 JobDataMap 中的数据
        String jobName = context.getJobDetail().getKey().getName();
        logger.info("Job 名称: {}", jobName);
    }
}
```

#### 任务 3：动态定时任务

**动态调度服务：**

```java
package com.example.demo.service;

import org.quartz.*;
import org.springframework.stereotype.Service;

@Service
public class QuartzService {
    
    private final Scheduler scheduler;
    
    public QuartzService(Scheduler scheduler) {
        this.scheduler = scheduler;
    }
    
    /**
     * 添加定时任务
     */
    public void addJob(String jobName, String groupName, Class<? extends Job> jobClass, 
                       String cronExpression) throws SchedulerException {
        
        // 定义 JobDetail
        JobDetail jobDetail = JobBuilder.newJob(jobClass)
            .withIdentity(jobName, groupName)
            .storeDurably()
            .build();
        
        // 定义 Trigger
        CronTrigger trigger = TriggerBuilder.newTrigger()
            .withIdentity(jobName + "_trigger", groupName)
            .withSchedule(CronScheduleBuilder.cronSchedule(cronExpression))
            .forJob(jobDetail)
            .build();
        
        // 调度任务
        scheduler.scheduleJob(jobDetail, trigger);
    }
    
    /**
     * 删除定时任务
     */
    public void deleteJob(String jobName, String groupName) throws SchedulerException {
        JobKey jobKey = new JobKey(jobName, groupName);
        scheduler.deleteJob(jobKey);
    }
    
    /**
     * 暂停定时任务
     */
    public void pauseJob(String jobName, String groupName) throws SchedulerException {
        JobKey jobKey = new JobKey(jobName, groupName);
        scheduler.pauseJob(jobKey);
    }
    
    /**
     * 恢复定时任务
     */
    public void resumeJob(String jobName, String groupName) throws SchedulerException {
        JobKey jobKey = new JobKey(jobName, groupName);
        scheduler.resumeJob(jobKey);
    }
    
    /**
     * 更新定时任务的 Cron 表达式
     */
    public void updateJobCron(String jobName, String groupName, String newCronExpression) 
            throws SchedulerException {
        
        TriggerKey triggerKey = new TriggerKey(jobName + "_trigger", groupName);
        CronTrigger trigger = (CronTrigger) scheduler.getTrigger(triggerKey);
        
        if (trigger != null) {
            trigger = trigger.getTriggerBuilder()
                .withIdentity(triggerKey)
                .withSchedule(CronScheduleBuilder.cronSchedule(newCronExpression))
                .build();
            
            scheduler.rescheduleJob(triggerKey, trigger);
        }
    }
}
```

**动态调度控制器：**

```java
package com.example.demo.controller;

import com.example.demo.job.DynamicJob;
import com.example.demo.service.QuartzService;
import org.quartz.SchedulerException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/scheduler")
public class SchedulerController {
    
    private final QuartzService quartzService;
    
    public SchedulerController(QuartzService quartzService) {
        this.quartzService = quartzService;
    }
    
    /**
     * 添加定时任务
     */
    @PostMapping("/jobs")
    public ResponseEntity<Map<String, String>> addJob(
            @RequestParam String jobName,
            @RequestParam String cronExpression) throws SchedulerException {
        
        quartzService.addJob(jobName, "default", DynamicJob.class, cronExpression);
        
        Map<String, String> result = new HashMap<>();
        result.put("message", "定时任务添加成功");
        result.put("jobName", jobName);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 删除定时任务
     */
    @DeleteMapping("/jobs/{jobName}")
    public ResponseEntity<Map<String, String>> deleteJob(@PathVariable String jobName) 
            throws SchedulerException {
        
        quartzService.deleteJob(jobName, "default");
        
        Map<String, String> result = new HashMap<>();
        result.put("message", "定时任务删除成功");
        result.put("jobName", jobName);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 暂停定时任务
     */
    @PostMapping("/jobs/{jobName}/pause")
    public ResponseEntity<Map<String, String>> pauseJob(@PathVariable String jobName) 
            throws SchedulerException {
        
        quartzService.pauseJob(jobName, "default");
        
        Map<String, String> result = new HashMap<>();
        result.put("message", "定时任务已暂停");
        result.put("jobName", jobName);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 恢复定时任务
     */
    @PostMapping("/jobs/{jobName}/resume")
    public ResponseEntity<Map<String, String>> resumeJob(@PathVariable String jobName) 
            throws SchedulerException {
        
        quartzService.resumeJob(jobName, "default");
        
        Map<String, String> result = new HashMap<>();
        result.put("message", "定时任务已恢复");
        result.put("jobName", jobName);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 更新定时任务
     */
    @PutMapping("/jobs/{jobName}")
    public ResponseEntity<Map<String, String>> updateJob(
            @PathVariable String jobName,
            @RequestParam String cronExpression) throws SchedulerException {
        
        quartzService.updateJobCron(jobName, "default", cronExpression);
        
        Map<String, String> result = new HashMap<>();
        result.put("message", "定时任务更新成功");
        result.put("jobName", jobName);
        return ResponseEntity.ok(result);
    }
}
```

**动态 Job：**

```java
package com.example.demo.job;

import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class DynamicJob implements Job {
    
    private static final Logger logger = LoggerFactory.getLogger(DynamicJob.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        String jobName = context.getJobDetail().getKey().getName();
        logger.info("动态任务 [{}] 执行: {}", jobName, LocalDateTime.now().format(formatter));
    }
}
```

#### 任务 4：异步执行

**启用异步：**

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync  // 启用异步支持
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

**异步配置：**

```java
package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {
    
    /**
     * 自定义异步线程池
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // 核心线程数
        executor.setCorePoolSize(5);
        // 最大线程数
        executor.setMaxPoolSize(10);
        // 队列容量
        executor.setQueueCapacity(25);
        // 线程名前缀
        executor.setThreadNamePrefix("AsyncTask-");
        // 拒绝策略
        executor.setRejectedExecutionHandler(
            new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy()
        );
        // 等待所有任务完成后再关闭线程池
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        
        executor.initialize();
        return executor;
    }
}
```

**异步服务：**

```java
package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class AsyncService {
    
    private static final Logger logger = LoggerFactory.getLogger(AsyncService.class);
    
    /**
     * 异步执行任务
     */
    @Async("taskExecutor")
    public void executeAsyncTask(String taskName) {
        logger.info("开始执行异步任务: {}", taskName);
        
        try {
            // 模拟耗时操作
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        logger.info("异步任务执行完成: {}", taskName);
    }
    
    /**
     * 异步执行并返回结果
     */
    @Async("taskExecutor")
    public CompletableFuture<String> executeAsyncWithResult(String taskName) {
        logger.info("开始执行异步任务（带返回值）: {}", taskName);
        
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        String result = "任务 " + taskName + " 执行完成";
        logger.info(result);
        
        return CompletableFuture.completedFuture(result);
    }
    
    /**
     * 批量异步任务
     */
    @Async("taskExecutor")
    public CompletableFuture<Integer> processData(int data) {
        logger.info("处理数据: {}", data);
        
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        return CompletableFuture.completedFuture(data * 2);
    }
}
```

**异步控制器：**

```java
package com.example.demo.controller;

import com.example.demo.service.AsyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/async")
public class AsyncController {
    
    private final AsyncService asyncService;
    
    public AsyncController(AsyncService asyncService) {
        this.asyncService = asyncService;
    }
    
    /**
     * 执行异步任务
     */
    @PostMapping("/execute")
    public ResponseEntity<Map<String, String>> executeAsync(@RequestParam String taskName) {
        asyncService.executeAsyncTask(taskName);
        
        Map<String, String> result = new HashMap<>();
        result.put("message", "异步任务已提交");
        result.put("taskName", taskName);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 执行异步任务并等待结果
     */
    @GetMapping("/result")
    public ResponseEntity<Map<String, Object>> getAsyncResult(@RequestParam String taskName) 
            throws ExecutionException, InterruptedException {
        
        CompletableFuture<String> future = asyncService.executeAsyncWithResult(taskName);
        String result = future.get(); // 阻塞等待结果
        
        Map<String, Object> response = new HashMap<>();
        response.put("taskName", taskName);
        response.put("result", result);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 并行执行多个任务
     */
    @GetMapping("/parallel")
    public ResponseEntity<Map<String, Object>> executeParallel() 
            throws ExecutionException, InterruptedException {
        
        // 并行执行多个任务
        CompletableFuture<Integer> task1 = asyncService.processData(1);
        CompletableFuture<Integer> task2 = asyncService.processData(2);
        CompletableFuture<Integer> task3 = asyncService.processData(3);
        
        // 等待所有任务完成
        CompletableFuture.allOf(task1, task2, task3).get();
        
        Map<String, Object> result = new HashMap<>();
        result.put("task1", task1.get());
        result.put("task2", task2.get());
        result.put("task3", task3.get());
        result.put("total", task1.get() + task2.get() + task3.get());
        
        return ResponseEntity.ok(result);
    }
}
```

---

### 📝 今日笔记（5 行）

1. **@Scheduled**：Spring 自带的定时任务注解，支持 fixedRate、fixedDelay、cron 三种方式
2. **Quartz**：功能强大的定时任务框架，支持动态添加/删除/修改任务
3. **Cron 表达式**：6 位或 7 位表达式，用于定义定时任务的执行时间
4. **@Async**：Spring 异步执行注解，配合 ThreadPoolTaskExecutor 使用
5. **CompletableFuture**：Java 8+ 的异步编程工具，支持组合多个异步任务