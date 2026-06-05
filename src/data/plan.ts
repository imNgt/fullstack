export interface Day {
  id: number
  title: string
  javaTopic: string
  springTopic: string
  stage: number
  stageTitle: string
}

export interface Stage {
  id: number
  title: string
  days: number
  description: string
}

export const stages: Stage[] = [
  { id: 1, title: 'Spring Boot 入门', days: 10, description: '跑通第一个 Web 项目，理解 IoC/DI' },
  { id: 2, title: 'Spring Web 深入', days: 10, description: '掌握 MVC、参数绑定、RESTful' },
  { id: 3, title: '数据持久化', days: 10, description: '打通数据库，搞定 JDBC/JPA/MyBatis' },
  { id: 4, title: 'Spring 核心进阶', days: 10, description: '吃透 AOP、配置、源码思想' },
  { id: 5, title: '项目集成 + 收尾', days: 5, description: '做出一个能拿得出手的小项目' }
]

export const days: Day[] = [
  // 阶段一：Spring Boot 入门
  { id: 1, title: '环境搭建 + 第一个 Spring Boot 项目', javaTopic: 'JDK 安装、Maven pom.xml、@Override', springTopic: 'start.spring.io 初始化、HelloController', stage: 1, stageTitle: 'Spring Boot 入门' },
  { id: 2, title: '包结构 + 路径参数', javaTopic: '包、import、类路径', springTopic: 'User 模型类、@PathVariable、@RequestParam', stage: 1, stageTitle: 'Spring Boot 入门' },
  { id: 3, title: '反射 + Spring 扫描原理', javaTopic: '反射基础、Class.forName()', springTopic: '@SpringBootApplication、自定义注解', stage: 1, stageTitle: 'Spring Boot 入门' },
  { id: 4, title: '接口 + 依赖注入', javaTopic: '接口 vs 实现类、implements', springTopic: '@Service、@Autowired', stage: 1, stageTitle: 'Spring Boot 入门' },
  { id: 5, title: '构造方法 + 构造器注入', javaTopic: '构造方法、this 关键字', springTopic: '构造器注入 vs 字段注入', stage: 1, stageTitle: 'Spring Boot 入门' },
  { id: 6, title: '泛型 + 集合返回', javaTopic: '泛型 <T>、List/Map', springTopic: '统一返回结果类 Result<T>', stage: 1, stageTitle: 'Spring Boot 入门' },
  { id: 7, title: '装箱拆箱 + 配置文件', javaTopic: 'Integer vs int、自动装箱拆箱', springTopic: 'application.yml、@ConfigurationProperties', stage: 1, stageTitle: 'Spring Boot 入门' },
  { id: 8, title: 'Lambda 表达式 + Stream 过滤', javaTopic: 'Lambda、Stream API', springTopic: 'Stream 链式操作、数据统计', stage: 1, stageTitle: 'Spring Boot 入门' },
  { id: 9, title: '异常处理 + 全局异常', javaTopic: 'try-catch、自定义异常', springTopic: '@RestControllerAdvice、@ExceptionHandler', stage: 1, stageTitle: 'Spring Boot 入门' },
  { id: 10, title: '阶段复盘 + 项目重构', javaTopic: '复习要点', springTopic: '三层架构重构', stage: 1, stageTitle: 'Spring Boot 入门' },
  // 阶段二：Spring Web 深入
  { id: 11, title: '抽象类 + 模板方法', javaTopic: '抽象类、abstract', springTopic: 'BaseController', stage: 2, stageTitle: 'Spring Web 深入' },
  { id: 12, title: 'static + 工具类', javaTopic: 'static 关键字', springTopic: 'BeanUtils.copyProperties()', stage: 2, stageTitle: 'Spring Web 深入' },
  { id: 13, title: 'final + 常量设计', javaTopic: 'final 关键字', springTopic: 'ResultCode 统一返回码', stage: 2, stageTitle: 'Spring Web 深入' },
  { id: 14, title: '日期 API + JSON 处理', javaTopic: 'LocalDateTime、DateTimeFormatter', springTopic: 'Jackson 时间配置', stage: 2, stageTitle: 'Spring Web 深入' },
  { id: 15, title: 'Optional + 空指针防护', javaTopic: 'Optional 类', springTopic: 'Service 层防空指针', stage: 2, stageTitle: 'Spring Web 深入' },
  { id: 16, title: 'HashMap 原理', javaTopic: 'HashMap 底层实现', springTopic: '@RequestParam 接 Map', stage: 2, stageTitle: 'Spring Web 深入' },
  { id: 17, title: 'ArrayList vs LinkedList', javaTopic: '集合底层对比', springTopic: '分页查询 Page<User>', stage: 2, stageTitle: 'Spring Web 深入' },
  { id: 18, title: 'Stream API 完整链', javaTopic: 'map/filter/collect/groupingBy', springTopic: '业务数据统计', stage: 2, stageTitle: 'Spring Web 深入' },
  { id: 19, title: '自定义注解', javaTopic: '@interface', springTopic: '@LoginUser 注解 + 切面', stage: 2, stageTitle: 'Spring Web 深入' },
  { id: 20, title: '阶段复盘', javaTopic: '综合复习', springTopic: '完整用户管理接口', stage: 2, stageTitle: 'Spring Web 深入' },
  // 阶段三：数据持久化
  { id: 21, title: 'JDBC 原生', javaTopic: 'Connection/PreparedStatement', springTopic: 'JdbcTemplate', stage: 3, stageTitle: '数据持久化' },
  { id: 22, title: '资源关闭', javaTopic: 'try-with-resources', springTopic: '优雅关闭连接', stage: 3, stageTitle: '数据持久化' },
  { id: 23, title: '数据库连接池', javaTopic: '连接池原理', springTopic: 'Druid 配置', stage: 3, stageTitle: '数据持久化' },
  { id: 24, title: 'JPA 实体', javaTopic: 'POJO 概念', springTopic: '@Entity、@Id、@Column', stage: 3, stageTitle: '数据持久化' },
  { id: 25, title: 'JPA 关联关系', javaTopic: '关联设计', springTopic: '@OneToMany、@ManyToOne', stage: 3, stageTitle: '数据持久化' },
  { id: 26, title: 'equals + hashCode', javaTopic: 'equals 和 hashCode 重写', springTopic: 'JPA 实体优化', stage: 3, stageTitle: '数据持久化' },
  { id: 27, title: '事务基础', javaTopic: 'ACID', springTopic: '@Transactional', stage: 3, stageTitle: '数据持久化' },
  { id: 28, title: '事务传播', javaTopic: '事务传播行为', springTopic: 'PROPAGATION_*', stage: 3, stageTitle: '数据持久化' },
  { id: 29, title: 'MyBatis Plus', javaTopic: '动态 SQL', springTopic: '条件构造器', stage: 3, stageTitle: '数据持久化' },
  { id: 30, title: '阶段复盘', javaTopic: '综合复习', springTopic: '三表关联查询', stage: 3, stageTitle: '数据持久化' },
  // 阶段四：Spring 核心进阶
  { id: 31, title: '静态代理', javaTopic: '代理模式', springTopic: 'AOP 基础', stage: 4, stageTitle: 'Spring 核心进阶' },
  { id: 32, title: 'JDK 动态代理', javaTopic: 'Proxy.newProxyInstance', springTopic: 'AOP 方法耗时统计', stage: 4, stageTitle: 'Spring 核心进阶' },
  { id: 33, title: 'CGLIB 代理', javaTopic: '继承代理', springTopic: '@Aspect + @Around', stage: 4, stageTitle: 'Spring 核心进阶' },
  { id: 34, title: '注解 + 反射', javaTopic: '注解解析', springTopic: '自定义 @Log 注解', stage: 4, stageTitle: 'Spring 核心进阶' },
  { id: 35, title: '多线程基础', javaTopic: 'Thread/Runnable', springTopic: '@Async、线程池', stage: 4, stageTitle: 'Spring 核心进阶' },
  { id: 36, title: '线程安全', javaTopic: 'synchronized、ThreadLocal', springTopic: '用户上下文', stage: 4, stageTitle: 'Spring 核心进阶' },
  { id: 37, title: '设计模式', javaTopic: '单例、工厂、策略', springTopic: '策略模式重构', stage: 4, stageTitle: 'Spring 核心进阶' },
  { id: 38, title: 'SPI 机制', javaTopic: 'ServiceLoader', springTopic: '自动配置原理', stage: 4, stageTitle: 'Spring 核心进阶' },
  { id: 39, title: '类加载机制', javaTopic: 'ClassLoader', springTopic: '自定义 Starter', stage: 4, stageTitle: 'Spring 核心进阶' },
  { id: 40, title: '阶段复盘', javaTopic: '源码阅读', springTopic: 'SpringApplication.run()', stage: 4, stageTitle: 'Spring 核心进阶' },
  // 阶段五：项目集成 + 收尾
  { id: 41, title: 'Redis 集成', javaTopic: 'Jedis/Lettuce', springTopic: '缓存配置', stage: 5, stageTitle: '项目集成' },
  { id: 42, title: 'Spring Security/JWT', javaTopic: '过滤器链', springTopic: '登录认证', stage: 5, stageTitle: '项目集成' },
  { id: 43, title: '接口文档 + 测试', javaTopic: '单元测试', springTopic: 'Swagger/Knife4j', stage: 5, stageTitle: '项目集成' },
  { id: 44, title: '项目部署', javaTopic: 'Linux 基础', springTopic: 'Docker 部署', stage: 5, stageTitle: '项目集成' },
  { id: 45, title: '总复盘', javaTopic: '综合复习', springTopic: '项目总结', stage: 5, stageTitle: '项目集成' }
]

export const getDaysByStage = (stageId: number): Day[] => {
  return days.filter(day => day.stage === stageId)
}

export const getDayById = (dayId: number): Day | undefined => {
  return days.find(day => day.id === dayId)
}

export const getCurrentStage = (dayId: number): Stage | undefined => {
  const day = getDayById(dayId)
  if (!day) return undefined
  return stages.find(stage => stage.id === day.stage)
}
