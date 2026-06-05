<script setup lang="ts">
import { ref, computed } from "vue";
import {
  ArrowLeft,
  Notebook,
  DataBoard,
  Files,
  VideoPlay,
  Refresh,
  DocumentCopy,
  Check,
} from "@element-plus/icons-vue";
import { getDayById, getCurrentStage } from "@/data/plan";
import type { Day } from "@/data/plan";
const props = defineProps<{
  day: number;
}>();
const emit = defineEmits<{
  (e: "back"): void;
}>();
const day = computed<Day | undefined>(() => getDayById(props.day));
const stageData = computed(() => getCurrentStage(props.day));
const copied = ref(false);
const codeOutput = ref("");
const codeExecuting = ref(false);
const javaContent = ref(`public class HelloWorld {
 public static void main(String[] args) {
 System.out.println("Hello, Spring Boot!");
 }
}`);
const copyCode = () => {
  navigator.clipboard.writeText(javaContent.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
};
const runCode = () => {
  codeExecuting.value = true;
  setTimeout(() => {
    try {
      const output = executeJavaCode(javaContent.value);
      codeOutput.value = output;
    } catch (error) {
      codeOutput.value = `执行错误: ${error.message}`;
    }
    codeExecuting.value = false;
  }, 800);
};

const executeJavaCode = (code: string): string => {
  const outputs: string[] = [];

  const printPattern = /System\.out\.println\s*\(\s*["']([^"']+)["']\s*\)/g;
  let match;
  while ((match = printPattern.exec(code)) !== null) {
    outputs.push(match[1]);
  }

  if (outputs.length === 0) {
    return "没有找到 System.out.println 语句\n\n程序执行成功！";
  }

  return outputs.join("\n") + "\n\n程序执行成功！";
};
const resetCode = () => {
  javaContent.value = `public class HelloWorld {
 public static void main(String[] args) {
 System.out.println("Hello, Spring Boot!");
 }
}`;
  codeOutput.value = "";
};
</script>

<template>
  <div class="day-detail">
    <!-- 返回按钮 -->
    <button class="back-btn" @click="emit('back')">
      <ArrowLeft class="back-icon" />
      <span>返回首页</span>
    </button>

    <!-- 标题区域 -->
    <div class="day-header">
      <div class="day-info">
        <div class="day-badge">Day {{ day?.id }}</div>
        <span class="stage-label">{{ stageData?.title }}</span>
      </div>
      <h1>{{ day?.title }}</h1>
    </div>

    <!-- 学习内容 -->
    <div class="content-tabs">
      <button class="tab-btn active">
        <Notebook class="tab-icon" />
        <span>Java 补充</span>
      </button>
      <button class="tab-btn">
        <DataBoard class="tab-icon" />
        <span>Spring 实战</span>
      </button>
      <button class="tab-btn">
        <Files class="tab-icon" />
        <span>今日笔记</span>
      </button>
    </div>

    <!-- Java 补充内容 -->
    <div class="content-section">
      <h2>📚 Java 补充（40 分钟）</h2>
      <p class="topic-desc">今日学习：{{ day?.javaTopic }}</p>

      <div class="knowledge-card">
        <h3>1. 核心知识点</h3>
        <p>
          今天我们学习 <strong>JDK 安装配置</strong> 和
          <strong>Maven 基础</strong>。
        </p>
        <ul>
          <li>
            <strong>JDK（Java Development Kit）</strong>：Java
            开发工具包，包含编译器、运行时环境和工具
          </li>
          <li><strong>Maven</strong>：项目构建工具，管理依赖和构建生命周期</li>
          <li><strong>pom.xml</strong>：Maven 项目的核心配置文件</li>
          <li>
            <strong>@Override 注解</strong>：标记方法重写，编译器会检查方法签名
          </li>
        </ul>
      </div>

      <div class="knowledge-card">
        <h3>2. 代码示例</h3>
        <div class="code-container">
          <div class="code-header">
            <span class="code-lang">Java</span>
            <div class="code-actions">
              <button class="code-action-btn" @click="copyCode">
                <component
                  :is="copied ? Check : DocumentCopy"
                  class="action-icon"
                />
                <span>{{ copied ? "已复制" : "复制" }}</span>
              </button>
              <button class="code-action-btn" @click="resetCode">
                <Refresh class="action-icon" />
                <span>重置</span>
              </button>
            </div>
          </div>
          <textarea class="code-editor" v-model="javaContent"></textarea>
          <button class="run-btn" :disabled="codeExecuting" @click="runCode">
            <VideoPlay class="run-icon" />
            <span>{{ codeExecuting ? "执行中..." : "运行代码" }}</span>
          </button>
          <div v-if="codeOutput" class="output-panel">
            <h4>输出结果：</h4>
            <pre class="output-content">{{ codeOutput }}</pre>
          </div>
        </div>
      </div>

      <div class="knowledge-card">
        <h3>3. 小练习</h3>
        <p>请修改代码，让程序输出你的名字！</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.day-detail {
  max-width: 950px;
  margin: 0 auto;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  color: #374151;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.back-btn:hover {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #166534;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.15);
  transform: translateX(-3px);
}

.back-icon {
  width: 19px;
  height: 19px;
}

.day-header {
  margin-bottom: 32px;
}

.day-info {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.day-badge {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
}

.stage-label {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
}

.day-header h1 {
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
  letter-spacing: -0.5px;
}

.content-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f0f0f0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-btn:hover {
  background: #f9fafb;
  color: #374151;
  border-color: #e5e7eb;
}

.tab-btn.active {
  background: linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%);
  color: #166534;
  font-weight: 600;
  border-color: #22c55e;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);
}

.tab-icon {
  width: 20px;
  height: 20px;
}

.content-section {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

.content-section h2 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1f2937;
}

.topic-desc {
  color: #6b7280;
  margin-bottom: 28px;
  font-size: 15px;
  line-height: 1.7;
}

.knowledge-card {
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border-left: 4px solid #22c55e;
  transition: all 0.3s;
}

.knowledge-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.knowledge-card h3 {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  color: #1f2937;
}

.knowledge-card p {
  color: #4b5563;
  line-height: 1.7;
  margin-bottom: 14px;
  font-size: 15px;
}

.knowledge-card ul {
  padding-left: 24px;
}

.knowledge-card li {
  color: #4b5563;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.code-container {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #334155;
}

.code-lang {
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 600;
}

.code-actions {
  display: flex;
  gap: 10px;
}

.code-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #475569;
  border: none;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.code-action-btn:hover {
  background: #64748b;
  transform: translateY(-1px);
}

.action-icon {
  width: 15px;
  height: 15px;
}

.code-editor {
  width: 100%;
  min-height: 200px;
  padding: 20px;
  background: #1e293b;
  color: #e2e8f0;
  font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
  font-size: 14px;
  line-height: 1.7;
  border: none;
  resize: vertical;
  outline: none;
}

.run-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 0 0 16px 16px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
}

.run-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
  transform: translateY(-1px);
}

.run-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.run-icon {
  width: 20px;
  height: 20px;
}

.output-panel {
  background: #0f172a;
  padding: 20px;
  border-top: 1px solid #1e293b;
}

.output-panel h4 {
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.output-content {
  color: #22c55e;
  font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
