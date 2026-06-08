<script setup lang="ts">
import { ref } from 'vue'
import { VideoPlay, Notebook, Aim, Clock } from '@element-plus/icons-vue'
import { stages, days } from '@/data/plan'
import type { Day } from '@/data/plan'

const emit = defineEmits<{
  (e: 'select-day', day: number): void
}>()

const activeStage = ref(1)

const getDaysByStage = (stageId: number): Day[] => {
  return days.filter(day => day.stage === stageId)
}

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins}分钟`
}

const totalDays = days.length
const completedDays = 0
const totalTime = totalDays * 130
const todayDay = 1
const todayJavaTopic = days[0]?.javaTopic || ''
const todaySpringTopic = days[0]?.springTopic || ''
</script>

<template>
  <div class="home-container">
    <!-- 欢迎区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <h1>双轨并行：Spring 与 Java</h1>
        <p class="hero-subtitle">45 天进阶学习方案</p>
        <p class="hero-desc">语法略懂、面向对象/集合稀里糊涂？用 Spring 倒逼补 Java，效率更高！</p>
        <div class="hero-stats">
          <div class="stat-item">
            <Aim class="stat-icon" />
            <div>
              <span class="stat-value">{{ totalDays }}</span>
              <span class="stat-label">学习天数</span>
            </div>
          </div>
          <div class="stat-item">
            <Clock class="stat-icon" />
            <div>
              <span class="stat-value">{{ formatTime(totalTime) }}</span>
              <span class="stat-label">总学习时长</span>
            </div>
          </div>
          <div class="stat-item">
            <Notebook class="stat-icon" />
            <div>
              <span class="stat-value">{{ completedDays }}/{{ totalDays }}</span>
              <span class="stat-label">完成进度</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 今日学习卡片 -->
    <div class="today-card">
      <div class="today-header">
        <h2>📅 今日学习</h2>
        <span class="today-day">Day {{ todayDay }}</span>
      </div>
      <div class="today-content">
        <div class="today-topic">
          <span class="topic-label java">Java 补充</span>
          <span class="topic-content">{{ todayJavaTopic }}</span>
        </div>
        <div class="today-topic">
          <span class="topic-label spring">Spring 实战</span>
          <span class="topic-content">{{ todaySpringTopic }}</span>
        </div>
        <button class="start-btn" @click="emit('select-day', todayDay)">
          <VideoPlay class="btn-icon" />
          <span>开始学习</span>
        </button>
      </div>
    </div>

    <!-- 阶段选择 -->
    <div class="stage-tabs">
      <button
        v-for="stage in stages"
        :key="stage.id"
        class="stage-tab"
        :class="{ active: activeStage === stage.id }"
        @click="activeStage = stage.id"
      >
        <span class="stage-num">{{ stage.id }}</span>
        <span class="stage-name">{{ stage.title }}</span>
      </button>
    </div>

    <!-- 每日列表 -->
    <div class="days-list">
      <h3>{{ stages.find(s => s.id === activeStage)?.title }} (Day {{ getDaysByStage(activeStage)[0]?.id }}-{{ getDaysByStage(activeStage).slice(-1)[0]?.id }})</h3>
      <div class="days-grid">
        <div
          v-for="day in getDaysByStage(activeStage)"
          :key="day.id"
          class="day-card"
          @click="emit('select-day', day.id)"
        >
          <div class="day-card-header">
            <span class="day-badge">Day {{ day.id }}</span>
            <span class="stage-tag">{{ day.stageTitle }}</span>
          </div>
          <h4 class="day-card-title">{{ day.title }}</h4>
          <div class="day-card-topics">
            <span class="topic-chip java">Java: {{ day.javaTopic }}</span>
            <span class="topic-chip spring">Spring: {{ day.springTopic }}</span>
          </div>
          <button class="day-card-btn">
            <VideoPlay class="btn-icon" />
            <span>开始</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1280px;
  margin: 0 auto;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 40%, #f093fb 100%);
  border-radius: 20px;
  padding: 50px;
  color: white;
  margin-bottom: 32px;
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}

.hero-section::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 50%;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-content h1 {
  font-size: 40px;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}

.hero-subtitle {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 20px;
  opacity: 0.95;
}

.hero-desc {
  font-size: 15px;
  opacity: 0.85;
  margin-bottom: 32px;
  max-width: 700px;
  line-height: 1.7;
}

.hero-stats {
  display: flex;
  gap: 48px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255, 255, 255, 0.1);
  padding: 14px 20px;
  border-radius: 14px;
  backdrop-filter: blur(10px);
}

.stat-icon {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 8px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  font-size: 13px;
  opacity: 0.85;
}

.today-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  padding: 28px;
  margin-bottom: 32px;
  border: 1px solid #f0f0f0;
}

.today-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.today-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.today-day {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.today-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.today-topic {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 14px;
  transition: all 0.25s;
}

.today-topic:hover {
  background: #f5f3ff;
  transform: translateX(5px);
}

.topic-label {
  padding: 6px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  min-width: 90px;
  text-align: center;
}

.topic-label.java {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.topic-label.spring {
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  color: #6d28d9;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.topic-content {
  font-size: 15px;
  color: #374151;
  font-weight: 500;
}

.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
  border: none;
  border-radius: 14px;
  padding: 16px 32px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.35);
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(139, 92, 246, 0.45);
}

.start-btn:active {
  transform: translateY(-1px);
}

.btn-icon {
  width: 22px;
  height: 22px;
}

.stage-tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  overflow-x: auto;
  padding-bottom: 12px;
}

.stage-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.stage-tab:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.15);
}

.stage-tab.active {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border-color: #8b5cf6;
  color: #6d28d9;
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.2);
  transform: translateY(-2px);
}

.stage-num {
  font-weight: 700;
  font-size: 18px;
}

.stage-name {
  font-size: 14px;
  font-weight: 500;
}

.days-list h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1f2937;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.day-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.day-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%);
  transform: scaleX(0);
  transition: transform 0.3s;
}

.day-card:hover::before {
  transform: scaleX(1);
}

.day-card:hover {
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.1);
  border-color: #8b5cf6;
  transform: translateY(-4px);
}

.day-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.day-badge {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #166534;
}

.stage-tag {
  font-size: 12px;
  color: #9ca3af;
  padding: 4px 10px;
  background: #f3f4f6;
  border-radius: 6px;
}

.day-card-title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  color: #1f2937;
}

.day-card-topics {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.topic-chip {
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 500;
}

.topic-chip.java {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
}

.topic-chip.spring {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #166534;
}

.day-card-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: #f9fafb;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  color: #374151;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.day-card-btn:hover {
  background: linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%);
  border-color: #22c55e;
  color: #166534;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);
}
</style>
