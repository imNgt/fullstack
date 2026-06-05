# 边学 Spring 边补 Java · 45 天混合学习方案

## 📌 总体节奏

| 时间段    | 任务                         | 时长   |
| --------- | ---------------------------- | ------ |
| 前 30 min | Java 知识点（理论 + 小练习） | 40 min |
| 后 90 min | Spring 编码实战              | 1.5 h  |
| 每天结束  | 写 5 行学习笔记（坑 + 收获） | 10 min |

**核心原则**：Java 学的内容必须**当天就在 Spring 里用到**，否则跳过不学。

---

## 🗓️ 阶段一：Spring Boot 入门（Day 1-10）

> 目标：跑通第一个 Web 项目，理解 IoC/DI

| Day    | Java 补啥（40 min）                                                | Spring 干啥（1.5 h）                                                  |
| ------ | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **1**  | JDK 安装、IDEA 配置、Maven `pom.xml` 写法、注解 `@Override` 是什么 | 用 `start.spring.io` 初始化项目，跑通 `HelloController`               |
| **2**  | 包/类/import、类路径（classpath）概念                              | 写一个 `/user/{id}` 接口，返回 JSON                                   |
| **3**  | 反射基础：`Class.forName()`、获取方法                              | 演示 `@RestController` 怎么被 Spring 扫描到（看启动日志）             |
| **4**  | 接口 vs 实现类、`implements` 关键字                                | 手写一个 `UserService` 接口 + `UserServiceImpl`，用 `@Autowired` 注入 |
| **5**  | 构造方法、`this` 关键字                                            | 改用构造器注入，理解 `@Service` 注解                                  |
| **6**  | 泛型 `<T>` 是什么、List/Map 基础                                   | 返回 `List<User>`，用 `Postman` 测试                                  |
| **7**  | 装箱拆箱、`Integer` vs `int`                                       | 配置 `application.yml`，改端口、改日志级别                            |
| **8**  | Lambda 表达式 `(a,b)->a+b`                                         | 用 Lambda 做集合过滤：`users.stream().filter(...)`                    |
| **9**  | try-catch-finally、异常体系                                        | 全局异常处理 `@ControllerAdvice` + `@ExceptionHandler`                |
| **10** | **阶段复盘**：手画 IoC 容器加载 Bean 的流程图                      | 重构 Day 4 的代码，拆出 `controller/service/repository` 三层          |

**🎯 里程碑 1**：能独立搭项目、写 CRUD 接口、懂依赖注入。

---

## 🗓️ 阶段二：Spring Web 深入（Day 11-20）

> 目标：掌握 MVC、参数绑定、RESTful

| Day    | Java 补啥                                                        | Spring 干啥                                     |
| ------ | ---------------------------------------------------------------- | ----------------------------------------------- |
| **11** | 抽象类、`abstract` 关键字                                        | 写一个抽象 `BaseController`，体会模板方法       |
| **12** | `static` 关键字、静态方法                                        | 工具类 `BeanUtils.copyProperties()` 用法        |
| **13** | `final` 关键字、常量设计                                         | 写常量类 `ResultCode` 统一返回码                |
| **14** | 日期 API：`LocalDateTime`、`DateTimeFormatter`                   | 请求/响应中处理时间字段，配 `jackson`           |
| **15** | `Optional` 类防空指针                                            | 改写 service 层，避免 `if(user!=null)`          |
| **16** | 集合进阶：`HashMap` 原理（数组+链表+红黑树）                     | `@RequestParam` 接 Map 参数                     |
| **17** | 集合进阶：`ArrayList` vs `LinkedList`                            | 分页查询返回 `Page<User>`                       |
| **18** | Stream API 完整链：`map/filter/collect/groupingBy`               | 业务里做数据统计：按城市分组                    |
| **19** | 注解自定义：`@interface`                                         | 写一个 `@LoginUser` 注解，从 Session 取当前用户 |
| **20** | **阶段复盘**：手写一个完整的"用户管理"接口（增删改查+分页+异常） | 巩固 10 天内容                                  |

**🎯 里程碑 2**：能写规范的 RESTful API，懂分层。

---

## 🗓️ 阶段三：数据持久化（Day 21-30）

> 目标：打通数据库，搞定 JDBC/JPA/MyBatis

| Day    | Java 补啥                                           | Spring 干啥                                   |
| ------ | --------------------------------------------------- | --------------------------------------------- |
| **21** | JDBC 原生：`Connection/PreparedStatement/ResultSet` | 配 H2 内存数据库，先用 `JdbcTemplate` 跑通    |
| **22** | 资源关闭、try-with-resources                        | 重构 21 天的代码，优雅关连接                  |
| **23** | 数据库连接池原理                                    | 切到 Druid，看监控页                          |
| **24** | 实体类、POJO 概念                                   | 引入 JPA（`spring-data-jpa`），写 `User` 实体 |
| **25** | JPA 注解：`@Entity/@Id/@Column/@OneToMany`          | 配用户-角色一对多关系                         |
| **26** | `equals` 和 `hashCode` 为什么必须一起重写           | JPA 实体里重写这俩方法（避免集合操作 bug）    |
| **27** | 事务概念 ACID                                       | 给 service 加 `@Transactional`                |
| **28** | 事务传播行为（PROPAGATION\_\*）                     | 嵌套调用测试，加日志观察                      |
| **29** | 动态 SQL 概念                                       | 引入 MyBatis Plus，写条件构造器               |
| **30** | **阶段复盘**：用户-角色-权限 三表关联查询           | 完整业务闭环                                  |

**🎯 里程碑 3**：能设计表、懂事务、会用至少一种 ORM。

---

## 🗓️ 阶段四：Spring 核心进阶（Day 31-40）

> 目标：吃透 AOP、配置、源码思想

| Day    | Java 补啥                                               | Spring 干啥                                   |
| ------ | ------------------------------------------------------- | --------------------------------------------- |
| **31** | 代理模式：静态代理手写                                  | 理解 Spring AOP 解决了啥问题                  |
| **32** | JDK 动态代理：`Proxy.newProxyInstance`                  | 写一个"方法耗时统计"切面                      |
| **33** | CGLIB 代理原理（继承）                                  | `@Aspect` + `@Around` 写日志切面              |
| **34** | 注解 + 反射：自己解析注解                               | 自定义 `@Log` 注解 + 切面记录操作日志         |
| **35** | 多线程基础：`Thread/Runnable`                           | `@Async` 异步发邮件，配置线程池               |
| **36** | `synchronized`、锁、线程安全                            | `ThreadLocal` 存用户上下文（请求级）          |
| **37** | 常用设计模式：单例、工厂、策略                          | 干掉代码里的 `if-else`，用策略模式            |
| **38** | SPI 机制、`ServiceLoader`                               | 理解 Spring Boot 自动配置原理                 |
| **39** | ClassLoader 类加载机制                                  | 写一个自定义 `spring.factories`，做个 starter |
| **40** | **阶段复盘**：阅读 `SpringApplication.run()` 源码第一段 | 写 500 字总结                                 |

**🎯 里程碑 4**：懂 AOP、能看源码、不再"只会用"。

---

## 🗓️ 阶段五：项目集成 + 收尾（Day 41-45）

> 目标：做出一个能拿得出手的小项目

| Day    | 任务                                                           |
| ------ | -------------------------------------------------------------- |
| **41** | 集成 Redis（补 Jedis/Lettuce、序列化）做缓存                   |
| **42** | 集成 Spring Security 或 JWT（补过滤器链、Token）做登录         |
| **43** | 集成 Swagger/Knife4j（补接口文档），单元测试 `@SpringBootTest` |
| **44** | 部署到服务器（补 Linux 基础命令、Docker）                      |
| **45** | **总复盘**：整理 GitHub 仓库、写 README、做一次完整复述        |

**🎯 里程碑 5**：简历上能写"独立完成 XX 管理系统"。

---

## 🛠️ 学习工具包

- **IDE**：IntelliJ IDEA（社区版够用）
- **JDK**：17（LTS，长期支持）
- **构建**：Maven（先用这个，Gradle 后期再碰）
- **数据库**：H2（前期）→ MySQL 8（后期）
- **测试**：Postman / Apifox
- **笔记**：语雀 / Notion（建议建"Java 速查卡"专栏）

## ⚠️ 避坑提醒

1. **不要先学 SSJ（SJJ/SSI）再学 Boot** —— 直接 Boot 起步，配置少
2. **XML 配置能不碰就不碰** —— 全程注解 + YAML
3. **遇到 Java 知识点，先看 2 分钟能不能用在 Spring 里**，不能用就跳过
4. **每天代码必须 push 到 GitHub**，45 天后这是你的简历
5. **卡住超过 30 分钟直接看答案**，效率 > 面子

---

> 📅 开始日期：2026年6月5日
> 🎯 目标：45天掌握 Spring Boot + Java 核心

---

_Created with ❤️ for Java/Spring learners_
