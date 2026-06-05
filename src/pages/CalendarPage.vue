<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, ArrowRight, Check, CircleCheck } from '@element-plus/icons-vue'
import { days } from '@/data/plan'

const emit = defineEmits<{
  (e: 'select-day', day: number): void
}>()

const currentYear = ref(2026)
const currentMonth = ref(6)

const completedDays = ref(new Set<number>([1, 2, 3, 4, 5]))

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const firstDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value - 1, 1).getDay()
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 0).getDate()
})

const getDayStatus = (day: number): 'completed' | 'current' | 'pending' | 'disabled' => {
  if (day > days.length) return 'disabled'
  if (completedDays.value.has(day)) return 'completed'
  if (day === 1) return 'current'
  return 'pending'
}

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}


</script>

<template>
  <div class="calendar-container">
    <h1 class="page-title">📅 学习日历</h1>
    
    <!-- 日历头部 -->
    <div class="calendar-header">
      <button class="nav-btn" @click="prevMonth">
        <ArrowLeft />
      </button>
      <div class="month-title">
        {{ currentYear }}年{{ currentMonth }}月
      </div>
      <button class="nav-btn" @click="nextMonth">
        <ArrowRight />
      </button>
    </div>
    
    <!-- 日历主体 -->
    <div class="calendar-grid">
      <!-- 星期标题 -->
      <div class="weekday-header">
        <div v-for="day in weekdays" :key="day" class="weekday">
          {{ day }}
        </div>
      </div>
      
      <!-- 日期格子 -->
      <div class="days-grid">
        <!-- 空白填充 -->
        <div v-for="i in firstDayOfMonth" :key="'empty-' + i" class="day-cell empty">
        </div>
        
        <!-- 日期 -->
        <div 
          v-for="day in daysInMonth" 
          :key="day" 
          class="day-cell"
          :class="getDayStatus(day)"
          @click="day <= days.length && emit('select-day', day)"
        >
          <span class="day-number">{{ day }}</span>
          <component :is="getDayStatus(day) === 'completed' ? Check : CircleCheck" class="day-status-icon" />
        </div>
      </div>
    </div>
    
    <!-- 图例 -->
    <div class="legend">
      <div class="legend-item">
        <div class="legend-dot completed"></div>
        <span>已完成</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot current"></div>
        <span>今日</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot pending"></div>
        <span>待学习</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot disabled"></div>
        <span>未开放</span>
      </div>
    </div>
    
    <!-- 今日详情卡片 -->
    <div class="today-detail">
      <h2>Day {{ days[0]?.id }} 学习内容</h2>
      <div class="detail-content">
        <div class="detail-item">
          <span class="detail-label">标题</span>
          <span class="detail-value">{{ days[0]?.title }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Java 补充</span>
          <span class="detail-value">{{ days[0]?.javaTopic }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Spring 实战</span>
          <span class="detail-value">{{ days[0]?.springTopic }}</span>
        </div>
        <button class="start-btn" @click="emit('select-day', 1)">
          开始学习
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #1f2937;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.nav-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f3f4f6;
  border-color: #22c55e;
}

.nav-btn svg {
  width: 20px;
  height: 20px;
  color: #374151;
}

.month-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.calendar-grid {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 16px;
}

.weekday {
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  padding: 8px 0;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.day-cell.empty {
  background: transparent;
  cursor: default;
}

.day-cell.pending {
  background: #f9fafb;
}

.day-cell.pending:hover {
  background: #f3f4f6;
}

.day-cell.current {
  background: #fef3c7;
  border: 2px solid #f59e0b;
}

.day-cell.completed {
  background: #ecfdf5;
  border: 2px solid #22c55e;
}

.day-cell.disabled {
  background: #f3f4f6;
  opacity: 0.4;
  cursor: not-allowed;
}

.day-number {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
}

.day-status-icon {
  width: 14px;
  height: 14px;
  margin-top: 2px;
}

.day-cell.completed .day-status-icon {
  color: #22c55e;
}

.day-cell.pending .day-status-icon {
  color: #9ca3af;
}

.day-cell.current .day-status-icon {
  color: #f59e0b;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.legend-dot.completed {
  background: #ecfdf5;
  border: 2px solid #22c55e;
}

.legend-dot.current {
  background: #fef3c7;
  border: 2px solid #f59e0b;
}

.legend-dot.pending {
  background: #f9fafb;
  border: 2px solid #d1d5db;
}

.legend-dot.disabled {
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  opacity: 0.5;
}

.legend-item span {
  font-size: 14px;
  color: #6b7280;
}

.today-detail {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.today-detail h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1f2937;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.detail-label {
  font-size: 14px;
  color: #6b7280;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.start-btn {
  margin-top: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
}
</style>
