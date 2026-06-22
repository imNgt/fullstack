<script setup lang="ts">
import { computed, onMounted } from "vue";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/github-dark.css";
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
    },
  }),
);

marked.setOptions({
  breaks: true,
  gfm: true,
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
      const lang =
        code.className
          .replace("language-", "")
          .replace("hljs ", "")
          .replace("hljs", "") || "code";

      const header = document.createElement("div");
      header.className = "code-header";

      const langSpan = document.createElement("span");
      langSpan.className = "code-lang";
      langSpan.textContent = lang.toUpperCase();

      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.innerHTML =
        '<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

      copyBtn.addEventListener("click", () => {
        navigator.clipboard
          .writeText(codeContent)
          .then(() => {
            copyBtn.innerHTML =
              '<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
            copyBtn.classList.add("copied");
            setTimeout(() => {
              copyBtn.innerHTML =
                '<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
              copyBtn.classList.remove("copied");
            }, 2000);
          })
          .catch((err) => {
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
    <button class="back-btn" @click="emit('back')">
      <ArrowLeft class="back-icon" />
      <span>返回首页</span>
    </button>

    <div class="day-header">
      <div class="day-info">
        <div class="day-badge">Day {{ day?.id }}</div>
        <span class="stage-label">{{ stageData?.title }}</span>
      </div>
      <h1>{{ day?.title }}</h1>
    </div>

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

    <div class="markdown-content" v-html="markdownContent"></div>
  </div>
</template>

<style scoped>
.day-detail {
  max-width: 980px;
  margin: 0 auto;
  padding: 40px 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  color: #24292f;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 24px;
}

.back-btn:hover {
  background: #f6f8fa;
  border-color: #1f6feb;
  color: #0969da;
}

.back-icon {
  width: 16px;
  height: 16px;
}

.day-header {
  margin-bottom: 24px;
}

.day-info {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.day-badge {
  background: #0969da;
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.stage-label {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.day-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.content-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #d0d7de;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #57606a;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #f6f8fa;
  color: #24292f;
}

.tab-btn.active {
  background: transparent;
  color: #24292f;
  font-weight: 600;
  border-bottom: 2px solid #0969da;
  border-radius: 0;
}

.tab-icon {
  width: 16px;
  height: 16px;
}

.markdown-content {
  background: white;
  border-radius: 6px;
  padding: 32px;
  border: 1px solid #d0d7de;
}

.markdown-content :deep(h1) {
  font-size: 1.75em;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #d0d7de;
}

.markdown-content :deep(h2) {
  font-size: 1.5em;
  font-weight: 600;
  color: #1f2937;
  margin-top: 24px;
  margin-bottom: 16px;
}

.markdown-content :deep(h3) {
  font-size: 1.25em;
  font-weight: 600;
  color: #24292f;
  margin-top: 16px;
  margin-bottom: 8px;
}

.markdown-content :deep(h4) {
  font-size: 1.125em;
  font-weight: 600;
  color: #24292f;
  margin-top: 16px;
  margin-bottom: 8px;
}

.markdown-content :deep(h5) {
  font-size: 1em;
  font-weight: 600;
  color: #24292f;
  margin-top: 16px;
  margin-bottom: 8px;
}

.markdown-content :deep(p) {
  color: #24292f;
  margin-bottom: 16px;
  line-height: 1.6;
  font-size: 14px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 16px;
  padding-left: 24px;
  color: #24292f;
}

.markdown-content :deep(li) {
  margin-bottom: 8px;
  line-height: 1.6;
}

.markdown-content :deep(strong) {
  color: #1f2937;
  font-weight: 600;
}

.markdown-content :deep(code) {
  background: rgba(175, 184, 193, 0.2);
  color: #1f2937;
  padding: 0.2em 0.4em;
  border-radius: 6px;
  font-family:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 85%;
}

.markdown-content :deep(pre) {
  background: #161b22;
  color: #c9d1d9;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 16px;
  margin-top: 8px;
  border: 1px solid #30363d;
}

.markdown-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
  font-size: 14px;
  line-height: 1.5;
  font-family:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

.markdown-content :deep(.hljs) {
  background: transparent !important;
  padding: 0;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid #d0d7de;
  margin: 24px 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #d0d7de;
  padding-left: 16px;
  margin: 16px 0;
  color: #57606a;
  font-style: normal;
  background: #f6f8fa;
  padding: 16px;
  border-radius: 0 6px 6px 0;
}

.markdown-content :deep(table) {
  width: 100%;
  margin-bottom: 16px;
  border-collapse: collapse;
  font-size: 14px;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 6px 13px;
  border: 1px solid #d0d7de;
}

.markdown-content :deep(th) {
  font-weight: 600;
  background: #f6f8fa;
}

.markdown-content :deep(tr:nth-child(2n)) {
  background: #f6f8fa;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px 6px 0 0;
  border-bottom: none;
}

.code-lang {
  color: #8b949e;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 4px;
  color: #8b949e;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: #30363d;
  color: #c9d1d9;
  border-color: #8b949e;
}

.copy-icon {
  width: 14px;
  height: 14px;
}

.copy-btn.copied {
  color: #3fb950;
  border-color: #3fb950;
}
</style>
