<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/github-dark.css";
import { ArrowLeft, Notebook, Cpu } from "@element-plus/icons-vue";
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

const activeTab = ref<"java" | "spring">("java");

const day = computed<Day | undefined>(() => getDayById(props.day));
const stageData = computed(() => getCurrentStage(props.day));

const currentMarkdownContent = computed(() => {
  const dayId = String(props.day).padStart(2, "0");
  const fileName =
    activeTab.value === "java" ? `Day${dayId}-java.md` : `Day${dayId}-`;

  for (const [path, content] of Object.entries(markdownModules)) {
    const file = path.split("/").pop() || "";
    if (activeTab.value === "java") {
      if (file === fileName) {
        return marked(content) as string;
      }
    } else {
      if (file.startsWith(fileName) && !file.endsWith("-java.md")) {
        return marked(content) as string;
      }
    }
  }
  return "<p>暂无内容</p>";
});

const hasJavaContent = computed(() => {
  const dayId = String(props.day).padStart(2, "0");
  for (const path of Object.keys(markdownModules)) {
    const fileName = path.split("/").pop() || "";
    if (fileName === `Day${dayId}-java.md`) {
      return true;
    }
  }
  return false;
});

const setupCodeCopy = () => {
  const preElements = document.querySelectorAll("pre");
  let codeBlockIndex = 0;

  // 语言到默认文件名的映射
  const langToFilename: Record<string, string> = {
    java: "Main.java",
    javascript: "index.js",
    js: "index.js",
    typescript: "index.ts",
    ts: "index.ts",
    python: "main.py",
    py: "main.py",
    html: "index.html",
    css: "style.css",
    sql: "query.sql",
    xml: "config.xml",
    json: "config.json",
    yaml: "config.yaml",
    yml: "config.yaml",
    shell: "script.sh",
    bash: "script.sh",
    console: "output.txt",
  };

  preElements.forEach((pre) => {
    // 如果已经有 header，跳过
    if (pre.previousElementSibling?.classList.contains("code-header")) {
      return;
    }

    const code = pre.querySelector("code");
    if (code) {
      codeBlockIndex++;
      const codeContent = code.textContent || "";
      const lang =
        code.className
          .replace("language-", "")
          .replace("hljs ", "")
          .replace("hljs", "") || "code";

      // 生成文件名
      const defaultFilename =
        langToFilename[lang.toLowerCase()] || `example${codeBlockIndex}.txt`;

      // 尝试从代码内容中提取类名作为文件名（Java）
      let filename = defaultFilename;
      if (lang.toLowerCase() === "java") {
        const classMatch = codeContent.match(/public\s+class\s+(\w+)/);
        if (classMatch) {
          filename = `${classMatch[1]}.java`;
        }
      }

      const header = document.createElement("div");
      header.className = "code-header";

      const headerLeft = document.createElement("div");
      headerLeft.className = "code-header-left";

      const filenameSpan = document.createElement("span");
      filenameSpan.className = "code-filename";
      filenameSpan.textContent = filename;

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

      headerLeft.appendChild(filenameSpan);
      headerLeft.appendChild(langSpan);
      header.appendChild(headerLeft);
      header.appendChild(copyBtn);
      pre.parentNode?.insertBefore(header, pre);
    }
  });
};

onMounted(setupCodeCopy);

watch([currentMarkdownContent, activeTab], () => {
  setTimeout(setupCodeCopy, 100);
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
      <button
        v-if="hasJavaContent"
        class="tab-btn"
        :class="{ active: activeTab === 'java' }"
        @click="activeTab = 'java'"
      >
        <Notebook class="tab-icon" />
        <span>Java 知识</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'spring' }"
        @click="activeTab = 'spring'"
      >
        <Cpu class="tab-icon" />
        <span>Spring 实战</span>
      </button>
    </div>

    <div class="markdown-content" v-html="currentMarkdownContent"></div>
  </div>
</template>

<style>
.day-detail {
  max-width: 980px;
  margin: 0 auto;
  padding: 40px 24px;
}

.day-detail .back-btn {
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

.day-detail .back-btn:hover {
  background: #f6f8fa;
  border-color: #1f6feb;
  color: #0969da;
}

.day-detail .back-icon {
  width: 16px;
  height: 16px;
}

.day-detail .day-header {
  margin-bottom: 24px;
}

.day-detail .day-info {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.day-detail .day-badge {
  background: #0969da;
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.day-detail .stage-label {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.day-detail .day-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.day-detail .content-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #d0d7de;
}

.day-detail .tab-btn {
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

.day-detail .tab-btn:hover {
  background: #f6f8fa;
  color: #24292f;
}

.day-detail .tab-btn.active {
  background: transparent;
  color: #24292f;
  font-weight: 600;
  border-bottom: 2px solid #0969da;
  border-radius: 0;
}

.day-detail .tab-icon {
  width: 16px;
  height: 16px;
}

.day-detail .markdown-content {
  background: white;
  border-radius: 6px;
  padding: 32px;
  border: 1px solid #d0d7de;
}

.day-detail .markdown-content h1 {
  font-size: 1.75em;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #d0d7de;
}

.day-detail .markdown-content h2 {
  font-size: 1.5em;
  font-weight: 600;
  color: #1f2937;
  margin-top: 24px;
  margin-bottom: 16px;
}

.day-detail .markdown-content h3 {
  font-size: 1.25em;
  font-weight: 600;
  color: #24292f;
  margin-top: 16px;
  margin-bottom: 8px;
}

.day-detail .markdown-content h4 {
  font-size: 1.125em;
  font-weight: 600;
  color: #24292f;
  margin-top: 16px;
  margin-bottom: 8px;
}

.day-detail .markdown-content h5 {
  font-size: 1em;
  font-weight: 600;
  color: #24292f;
  margin-top: 16px;
  margin-bottom: 8px;
}

.day-detail .markdown-content p {
  color: #24292f;
  margin-bottom: 16px;
  line-height: 1.6;
  font-size: 14px;
}

.day-detail .markdown-content ul,
.day-detail .markdown-content ol {
  margin-bottom: 16px;
  padding-left: 24px;
  color: #24292f;
}

.day-detail .markdown-content li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.day-detail .markdown-content strong {
  color: #1f2937;
  font-weight: 600;
}

.day-detail .markdown-content code {
  background: rgba(175, 184, 193, 0.2);
  color: #1f2937;
  padding: 0.2em 0.4em;
  border-radius: 6px;
  font-family:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 85%;
}

.day-detail .markdown-content pre {
  background: #161b22;
  color: #c9d1d9;
  padding: 16px;
  border-radius: 0 0 6px 6px;
  overflow-x: auto;
  margin-bottom: 16px;
  border: 1px solid #30363d;
}

.day-detail .markdown-content pre code {
  background: transparent;
  color: inherit;
  padding: 0;
  font-size: 13px;
  line-height: 1.5;
  font-family:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

.day-detail .markdown-content .hljs {
  background: transparent !important;
  padding: 0;
}

.day-detail .markdown-content hr {
  border: none;
  border-top: 1px solid #d0d7de;
  margin: 24px 0;
}

.day-detail .markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  font-size: 14px;
}

.day-detail .markdown-content th {
  text-align: left;
  padding: 8px 12px;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  font-weight: 600;
  color: #24292f;
}

.day-detail .markdown-content td {
  padding: 8px 12px;
  border: 1px solid #d0d7de;
  color: #24292f;
}

.day-detail .markdown-content tr:hover {
  background: #f6f8fa;
}

.day-detail .markdown-content blockquote {
  padding: 12px 16px;
  margin: 16px 0;
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  border-radius: 0 6px 6px 0;
  color: #92400e;
  font-style: italic;
}

.day-detail .markdown-content a {
  color: #0969da;
  text-decoration: none;
}

.day-detail .markdown-content a:hover {
  text-decoration: underline;
}

.day-detail .code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: #0d1117;
  border-radius: 6px 6px 0 0;
  border-bottom: 1px solid #30363d;
  min-height: 36px;
  box-sizing: border-box;
}

.day-detail .code-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.day-detail .code-filename {
  font-size: 12px;
  color: #c9d1d9;
  font-weight: 500;
  font-family:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  display: flex;
  align-items: center;
  gap: 6px;
}

.day-detail .code-filename::before {
  content: "";
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3fb950;
}

.day-detail .code-lang {
  font-size: 11px;
  color: #8b949e;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.day-detail .copy-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #8b949e;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-detail .copy-btn:hover {
  background: rgba(240, 246, 252, 0.1);
  color: #c9d1d9;
}

.day-detail .copy-btn.copied {
  color: #3fb950;
}

.day-detail .copy-icon {
  width: 16px;
  height: 16px;
}
</style>
