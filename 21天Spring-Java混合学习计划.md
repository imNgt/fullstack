# 边学 Spring 边补 Java · 21 天高效学习方案

## 📌 总体节奏

| 时间段    | 任务                         | 时长   |
| --------- | ---------------------------- | ------ |
| 前 30 min | Java 知识点（理论 + 小练习） | 30 min |
| 后 90 min | Spring 编码实战              | 1.5 h  |
| 每天结束  | 写 5 行学习笔记（坑 + 收获） | 10 min |

**核心原则**：Java 学的内容必须**当天就在 Spring 里用到**，否则跳过不学。

---

## 🗓️ 阶段一：Spring Boot 入门（Day 1-5）

> 目标：跑通第一个 Web 项目，理解 IoC/DI

| Day    | Java 补啥（30 min）                                                | Spring 干啥（1.5 h）                                                  |
| ------ | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **1**  | JDK 安装、IDEA 配置、Maven `pom.xml` 写法、注解 `@Override` 是什么 | 用 `start.spring.io` 初始化项目，跑通 `HelloController`               |
| **2**  | 包/类/import、类路径概念、接口 vs 实现类                            | 写 `/user/{id}` 接口，手写 `UserService` 接口 + 实现，用 `@Autowired` |
| **3**  | 构造方法、`this` 关键字、泛型 `<T>`                                | 改用构造器注入，理解 `@Service`，返回 `List<User>`                    |
| **4**  | 反射基础、`static` 关键字                                          | 演示 `@RestController` 扫描机制，工具类 `BeanUtils.copyProperties()`   |
| **5**  | **阶段复盘**：手画 IoC 容器加载 Bean 的流程图                      | 重构代码，拆出 `controller/service/repository` 三层                    |

**🎯 里程碑 1**：能独立搭项目、写 CRUD 接口、懂依赖注入。

---

## 🗓️ 阶段二：Spring Web 深入 + 数据持久化（Day 6-15）

> 目标：掌握 MVC、参数绑定、数据库操作

| Day    | Java 补啥（30 min）                                                | Spring 干啥（1.5 h）                                                  |
| ------ | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **6**  | 抽象类、`abstract` 关键字、`final` 常量                             | 写抽象 `BaseController`，写常量类 `ResultCode` 统一返回码              |
| **7**  | Lambda 表达式、Stream API                                          | 用 Lambda 做集合过滤，业务数据统计：`users.stream().filter(...)`      |
| **8**  | 日期 API：`LocalDateTime`、`Optional` 防空指针                      | 请求/响应处理时间字段，改写 service 避免 `if(user!=null)`             |
| **9**  | try-catch-finally、异常体系                                         | 全局异常处理 `@ControllerAdvice` + `@ExceptionHandler`                |
| **10** | **小复盘**：写完整"用户管理"接口（增删改查+分页+异常）              | 巩固前 9 天内容                                                       |
| **11** | JDBC 原生、资源关闭 try-with-resources                             | 配 H2 内存数据库，用 `JdbcTemplate` 跑通                              |
| **12** | 实体类 POJO、JPA 注解 `@Entity/@Id/@Column`                        | 引入 JPA，写 `User` 实体，配用户-角色一对多关系                       |
| **13** | `equals` 和 `hashCode`、事务 ACID                                  | JPA 实体重写方法，给 service 加 `@Transactional`                      |
| **14** | 动态 SQL 概念、数据库连接池                                        | 引入 MyBatis Plus，写条件构造器，切到 Druid 看监控                    |
| **15** | **阶段复盘**：用户-角色-权限 三表关联查询                           | 完整业务闭环，打通数据库                                              |

**🎯 里程碑 2**：能写规范 RESTful API、会用 ORM、懂事务。

---

## 🗓️ 阶段三：核心进阶 + 项目实战（Day 16-21）

> 目标：吃透 AOP、做一个能拿出手的项目

| Day    | Java 补啥（30 min）                                                | Spring 干啥（1.5 h）                                                  |
| ------ | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **16** | 代理模式：静态代理 + JDK 动态代理                                   | 理解 AOP 原理，写"方法耗时统计"切面 `@Aspect` + `@Around`              |
| **17** | 注解自定义 `@interface`、注解 + 反射                               | 自定义 `@Log` 注解 + 切面记录操作日志                                 |
| **18** | 多线程基础、`synchronized`                                        | `@Async` 异步任务，配置线程池，`ThreadLocal` 存用户上下文              |
| **19** | SPI 机制、常用设计模式（单例/工厂/策略）                            | 理解 Spring Boot 自动配置原理，用策略模式重构 `if-else`                |
| **20** | 集成 Redis、JWT 基础                                               | 集成 Redis 做缓存，集成 JWT 做登录认证                                 |
| **21** | **总复盘**：阅读 `SpringApplication.run()` 源码第一段              | 整理项目、写 README、集成 Swagger/Knife4j、单元测试                     |

**🎯 里程碑 3**：简历上能写"独立完成 XX 管理系统"。

---

## 🛠️ 学习工具包

- **IDE**：IntelliJ IDEA（社区版够用）
- **JDK**：17（LTS，长期支持）
- **构建**：Maven
- **数据库**：H2（前期）→ MySQL 8（后期）
- **测试**：Postman / Apifox
- **笔记**：语雀 / Notion（建议建"Java 速查卡"专栏）

## ⚠️ 避坑提醒

1. **直接 Boot 起步** —— 不要先学 SSM，配置少效率高
2. **全程注解 + YAML** —— XML 配置能不碰就不碰
3. **Java 知识点先看能不能用** —— 不能用就跳过，效率优先
4. **每天代码 push 到 GitHub** —— 21 天后这是你的简历亮点
5. **卡住超过 30 分钟看答案** —— 效率 > 面子

---

> 📅 开始日期：2026年6月5日
> 🎯 目标：21天掌握 Spring Boot + Java 核心

---

_Created with ❤️ for Java/Spring learners_
