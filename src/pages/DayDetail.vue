<script setup lang="ts">
import { computed, onMounted } from "vue";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/atom-one-dark.css";
import { ArrowLeft, Notebook, DataBoard, Files } from "@element-plus/icons-vue";
import { getDayById, getCurrentStage } from "@/data/plan";
import type { Day } from "@/data/plan";

hljs.registerLanguage("java", java);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  })
);

marked.setOptions({
  breaks: true,
  gfm: true
});

const markdownModules = import.meta.glob("@/data/md/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const props = defineProps<{
  day: number;
}>();
const emit = defineEmits<{
  (e: "back"): void;
}>();

const day = computed<Day | undefined>(() => getDayById(props.day));
const stageData = computed(() => getCurrentStage(props.day));

const markdownContent = computed(() => {
  const dayId = String(props.day).padStart(2, "0");
  for (const [path, content] of Object.entries(markdownModules)) {
    const fileName = path.split("/").pop() || "";
    if (fileName.startsWith(`Day${dayId}-`)) {
      return marked(content) as string;
    }
  }
  return "<p>暂无内容</p>";
});

onMounted(() => {
  const preElements = document.querySelectorAll("pre");
  preElements.forEach((pre) => {
    const code = pre.querySelector("code");
    if (code) {
      const codeContent = code.textContent || "";
      const lang = code.className.replace("language-", "").replace("hljs ", "").replace("hljs", "") || "code";
      
      const header = document.createElement("div");
      header.className = "code-header";
      
      const langSpan = document.createElement("span");
      langSpan.className = "code-lang";
      langSpan.textContent = lang.toUpperCase();
      
      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(codeContent).then(() => {
          copyBtn.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
          copyBtn.classList.add("copied");
          setTimeout(() => {
            copyBtn.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
            copyBtn.classList.remove("copied");
          }, 2000);
        }).catch(err => {
          console.error("复制失败:", err);
        });
      });
      
      header.appendChild(langSpan);
      header.appendChild(copyBtn);
      pre.parentNode?.insertBefore(header, pre);
    }
  });
});
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

    <!-- Markdown 内容 -->
    <div class="markdown-content" v-html="markdownContent"></div>
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
  background: #f5f3ff;
  border-color: #8b5cf6;
  color: #6d28d9;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.15);
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
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
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
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  color: #6d28d9;
  font-weight: 600;
  border-color: #8b5cf6;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
}

.tab-icon {
  width: 20px;
  height: 20px;
}

.markdown-content {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

.markdown-content :deep(h1) {
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.markdown-content :deep(h2) {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin-top: 28px;
  margin-bottom: 16px;
}

.markdown-content :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-top: 20px;
  margin-bottom: 12px;
}

.markdown-content :deep(h4) {
  font-size: 16px;
  font-weight: 600;
  color: #4b5563;
  margin-top: 16px;
  margin-bottom: 8px;
}

.markdown-content :deep(p) {
  color: #4b5563;
  margin-bottom: 16px;
  line-height: 1.8;
  font-size: 15px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 16px;
  padding-left: 24px;
  color: #4b5563;
}

.markdown-content :deep(li) {
  margin-bottom: 8px;
  line-height: 1.7;
}

.markdown-content :deep(strong) {
  color: #1f2937;
  font-weight: 600;
}

.markdown-content :deep(code) {
  background: #f3f4f6;
  color: #7c3aed;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "Fira Code", "Consolas", monospace;
  font-size: 14px;
}

.markdown-content :deep(pre) {
  background: #0d1117;
  color: #e6edf3;
  padding: 16px 20px;
  border-radius: 0 0 12px 12px;
  overflow-x: auto;
  margin-bottom: 20px;
  margin-top: 0;
  border: 1px solid #30363d;
  border-top: none;
}

.markdown-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  font-size: 14px;
  line-height: 1.7;
  font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
}

.markdown-content :deep(.hljs) {
  background: transparent !important;
  padding: 0;
}

.markdown-content :deep(.hljs-keyword) {
  color: #ff7b72;
}

.markdown-content :deep(.hljs-string) {
  color: #a5d6ff;
}

.markdown-content :deep(.hljs-comment) {
  color: #8b949e;
  font-style: italic;
}

.markdown-content :deep(.hljs-function) {
  color: #d2a8ff;
}

.markdown-content :deep(.hljs-title) {
  color: #d2a8ff;
}

.markdown-content :deep(.hljs-variable) {
  color: #ffa657;
}

.markdown-content :deep(.hljs-attribute) {
  color: #7ee787;
}

.markdown-content :deep(.hljs-number) {
  color: #ffa657;
}

.markdown-content :deep(.hljs-built_in) {
  color: #79c0ff;
}

.markdown-content :deep(.hljs-type) {
  color: #79c0ff;
}

.markdown-content :deep(.hljs-tag) {
  color: #ff7b72;
}

.markdown-content :deep(.hljs-name) {
  color: #ff7b72;
}

.markdown-content :deep(.hljs-attr) {
  color: #a5d6ff;
}

.markdown-content :deep(.hljs-string) {
  color: #a5d6ff;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px 12px 0 0;
  border-bottom: none;
}

.code-lang {
  color: #8b949e;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #8b949e;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #30363d;
  color: #e6edf3;
  border-color: #8b949e;
}

.copy-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
}

.copy-icon::before {
  content: '';
  display: inline-block;
  width: 100%;
  height: 100%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.copy-btn .copy-icon::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Crect x='9' y='9' width='13' height='13' rx='2' ry='2'/%3E%3Cpath d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'/%3E%3C/svg%3E");
}

.copy-btn.copied .copy-icon::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 24px 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #8b5cf6;
  padding-left: 16px;
  margin: 16px 0;
  color: #6b7280;
  font-style: italic;
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
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  border: none;
  border-radius: 0 0 16px 16px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.run-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
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
  color: #a78bfa;
  font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
