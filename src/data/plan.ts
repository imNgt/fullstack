export interface Day {
  id: number;
  title: string;
  javaTopic: string;
  springTopic: string;
  stage: number;
  stageTitle: string;
}

export interface Stage {
  id: number;
  title: string;
  days: number;
  description: string;
}

export const stages: Stage[] = [
  {
    id: 1,
    title: "Spring Boot 入门",
    days: 5,
    description: "跑通第一个 Web 项目，理解 IoC/DI",
  },
  {
    id: 2,
    title: "Java 高级特性",
    days: 5,
    description: "掌握 Lambda、集合、设计模式",
  },
  {
    id: 3,
    title: "数据持久化 + 安全",
    days: 5,
    description: "JPA/MyBatis、JWT 认证",
  },
  {
    id: 4,
    title: "综合实战",
    days: 4,
    description: "用户管理、权限、异步、优化",
  },
  { id: 5, title: "项目总结", days: 1, description: "部署上线、复盘总结" },
];

// 从 md 文件动态获取数据
const mdFiles = import.meta.glob("./md/Day*.md", { eager: true });

const days: Day[] = [];

// 解析文件名获取天数和标题
for (const [path] of Object.entries(mdFiles)) {
  // 匹配 DayXX-标题.md，排除 -java.md 文件
  if (path.endsWith("-java.md")) {
    continue;
  }
  const match = path.match(/Day(\d+)-(.*)\.md/);
  if (match) {
    const id = parseInt(match[1]);
    const title = match[2].replace(/-/g, " ");

    // 根据天数确定阶段
    let stage: number;
    let stageTitle: string;
    if (id >= 1 && id <= 5) {
      stage = 1;
      stageTitle = "Spring Boot 入门";
    } else if (id >= 6 && id <= 10) {
      stage = 2;
      stageTitle = "Java 高级特性";
    } else if (id >= 11 && id <= 15) {
      stage = 3;
      stageTitle = "数据持久化 + 安全";
    } else if (id >= 16 && id <= 20) {
      stage = 4;
      stageTitle = "综合实战";
    } else {
      stage = 5;
      stageTitle = "项目总结";
    }

    // 主题映射配置
    const topicMappings: {
      keywords: string[];
      javaTopic: string;
      springTopic: string;
    }[] = [
      {
        keywords: ["环境搭建", "包结构"],
        javaTopic: "JDK/Maven、反射基础",
        springTopic: "Spring Boot 初始化、依赖注入",
      },
      {
        keywords: ["泛型", "Lambda", "Stream"],
        javaTopic: "泛型、Lambda、Stream API",
        springTopic: "统一返回、配置文件",
      },
      {
        keywords: ["HashMap", "ArrayList", "注解"],
        javaTopic: "集合框架、自定义注解",
        springTopic: "AOP 切面",
      },
      {
        keywords: ["JDBC", "JPA", "事务"],
        javaTopic: "JDBC、equals/hashCode",
        springTopic: "JPA 实体、事务管理",
      },
      {
        keywords: ["MyBatis", "代理", "AOP"],
        javaTopic: "代理模式、设计模式",
        springTopic: "MyBatis Plus、AOP 深入",
      },
      {
        keywords: ["多线程", "线程安全"],
        javaTopic: "多线程、线程安全",
        springTopic: "异步任务、线程池",
      },
      {
        keywords: ["SPI", "类加载", "自动配置"],
        javaTopic: "SPI 机制、类加载",
        springTopic: "Spring 自动配置原理",
      },
      {
        keywords: ["Redis", "缓存"],
        javaTopic: "Jedis/Lettuce",
        springTopic: "Spring Cache、Redis 集成",
      },
      {
        keywords: ["Security", "JWT"],
        javaTopic: "过滤器链",
        springTopic: "Spring Security、JWT 认证",
      },
      {
        keywords: ["接口文档", "测试"],
        javaTopic: "单元测试、Mockito",
        springTopic: "Knife4j/Swagger",
      },
      {
        keywords: ["部署", "Docker"],
        javaTopic: "Linux 基础",
        springTopic: "Docker 部署、Nginx",
      },
      {
        keywords: ["CRUD"],
        javaTopic: "综合复习",
        springTopic: "用户管理系统",
      },
      {
        keywords: ["RBAC", "权限"],
        javaTopic: "权限设计",
        springTopic: "RBAC 权限管理",
      },
      {
        keywords: ["业务逻辑", "查询"],
        javaTopic: "复杂查询、Excel 导出",
        springTopic: "JPA Specification",
      },
      {
        keywords: ["异步", "消息队列"],
        javaTopic: "消息队列",
        springTopic: "@Async、RabbitMQ",
      },
      {
        keywords: ["性能优化", "监控"],
        javaTopic: "JVM 调优",
        springTopic: "缓存优化、Actuator",
      },
    ];

    // 根据标题获取主题
    const getTopics = (
      title: string,
    ): { javaTopic: string; springTopic: string } => {
      const mapping = topicMappings.find((m) =>
        m.keywords.some((k) => title.includes(k)),
      );
      return mapping || { javaTopic: "综合复习", springTopic: "项目总结" };
    };

    // 提取 Java 和 Spring 主题
    const { javaTopic, springTopic } = getTopics(title);

    days.push({
      id,
      title,
      javaTopic,
      springTopic,
      stage,
      stageTitle,
    });
  }
}

// 按天数排序
days.sort((a, b) => a.id - b.id);

export { days };

export const getDaysByStage = (stageId: number): Day[] => {
  return days.filter((day) => day.stage === stageId);
};

export const getDayById = (dayId: number): Day | undefined => {
  return days.find((day) => day.id === dayId);
};

export const getCurrentStage = (dayId: number): Stage | undefined => {
  const day = getDayById(dayId);
  if (!day) return undefined;
  return stages.find((stage) => stage.id === day.stage);
};
