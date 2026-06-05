<script setup lang="ts">
import {
  HomeFilled,
  DataAnalysis,
  Calendar,
  Files,
  Setting,
} from "@element-plus/icons-vue";

defineProps<{
  currentPage: string;
}>();

const emit = defineEmits<{
  (e: "change-page", page: string): void;
}>();

const navItems = [
  { id: "home", label: "首页", icon: HomeFilled },
  { id: "progress", label: "学习进度", icon: DataAnalysis },
  { id: "calendar", label: "学习日历", icon: Calendar },
  { id: "notes", label: "我的笔记", icon: Files },
  { id: "settings", label: "设置", icon: Setting },
];
</script>

<template>
  <nav class="navbar">
    <div class="navbar-left">
      <div class="logo">
        <span class="logo-icon">🌱</span>
        <span class="logo-text">Spring Java 学习</span>
      </div>
    </div>
    <div class="navbar-right">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-item"
        :class="{ active: currentPage === item.id }"
        @click="emit('change-page', item.id)"
      >
        <component :is="item.icon" class="nav-icon" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: linear-gradient(135deg, #166534 0%, #15803d 50%, #22c55e 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
  z-index: 100;
  backdrop-filter: blur(10px);
}

.navbar-left {
  flex: 1;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 28px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.logo-text {
  font-size: 19px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
}

.navbar-right {
  display: flex;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transition: left 0.5s ease;
}

.nav-item:hover::before {
  left: 100%;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.nav-icon {
  width: 19px;
  height: 19px;
}
</style>
