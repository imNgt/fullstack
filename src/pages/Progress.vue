<script setup lang="ts">import { ref, computed } from 'vue';
import { Aim, Clock, Trophy, TrendCharts } from '@element-plus/icons-vue';
import { stages, days } from '@/data/plan';
const completedDays = ref(new Set<number>([1, 2, 3]));
const dailyMinutes = ref<Record<number, number>>({
 1: 120,
 2: 105,
 3: 130
});
const toggleDay = (dayId: number) => {
 if (completedDays.value.has(dayId)) {
 completedDays.value.delete(dayId);
 delete dailyMinutes.value[dayId];
 }
 else {
 completedDays.value.add(dayId);
 dailyMinutes.value[dayId] = 130;
 }
};
const totalCompleted = computed(() => completedDays.value.size);
const totalDays = computed(() => days.length);
const progressPercent = computed(() => Math.round((totalCompleted.value / totalDays.value) * 100));
const totalMinutes = computed(() => {
 return Object.values(dailyMinutes.value).reduce((sum, mins) => sum + mins, 0);
});
const formatTime = (minutes: number): string => {
 const hours = Math.floor(minutes / 60);
 const mins = minutes % 60;
 return `${hours}小时${mins}分钟`;
};
const getStageProgress = (stageId: number) => {
 const stageDays = days.filter(d => d.stage === stageId);
 const completed = stageDays.filter(d => completedDays.value.has(d.id)).length;
 return {
 total: stageDays.length,
 completed,
 percent: Math.round((completed / stageDays.length) * 100)
 };
};
</script>

<template>
  <div class="progress-container">
    <h1 class="page-title">📊 学习进度</h1>
    
    <!-- 总体进度卡片 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon blue">
          <Aim />
        </div>
        <div class="card-content">
          <span class="card-value">{{ totalCompleted }}/{{ totalDays }}</span>
          <span class="card-label">完成天数</span>
        </div>
      </div>
      
      <div class="overview-card">
        <div class="card-icon green">
          <Clock />
        </div>
        <div class="card-content">
          <span class="card-value">{{ formatTime(totalMinutes) }}</span>
          <span class="card-label">累计学习</span>
        </div>
      </div>
      
      <div class="overview-card">
        <div class="card-icon orange">
          <TrendCharts />
        </div>
        <div class="card-content">
          <span class="card-value">{{ progressPercent }}%</span>
          <span class="card-label">总体进度</span>
        </div>
      </div>
      
      <div class="overview-card">
        <div class="card-icon purple">
          <Trophy />
        </div>
        <div class="card-content">
          <span class="card-value">{{ totalCompleted * 10 }}</span>
          <span class="card-label">学习积分</span>
        </div>
      </div>
    </div>
    
    <!-- 进度条 -->
    <div class="progress-section">
      <div class="progress-header">
        <h2>总体进度</h2>
        <span>{{ progressPercent }}%</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>
    </div>
    
    <!-- 阶段进度 -->
    <div class="stages-progress">
      <h2>各阶段进度</h2>
      <div class="stages-grid">
        <div 
          v-for="stage in stages" 
          :key="stage.id" 
          class="stage-progress-card"
        >
          <div class="stage-header">
            <span class="stage-num">阶段 {{ stage.id }}</span>
            <span class="stage-percent">{{ getStageProgress(stage.id).percent }}%</span>
          </div>
          <h3>{{ stage.title }}</h3>
          <p class="stage-desc">{{ stage.description }}</p>
          <div class="stage-progress-bar">
            <div 
              class="stage-progress-fill" 
              :style="{ width: `${getStageProgress(stage.id).percent}%` }"
            ></div>
          </div>
          <div class="stage-stats">
            <span>{{ getStageProgress(stage.id).completed }}/{{ getStageProgress(stage.id).total }} 天</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 每日进度 -->
    <div class="daily-progress">
      <h2>每日学习进度</h2>
      <div class="days-grid">
        <div 
          v-for="day in days" 
          :key="day.id" 
          class="day-progress-card"
          :class="{ completed: completedDays.has(day.id) }"
          @click="toggleDay(day.id)"
        >
          <div class="day-num">Day {{ day.id }}</div>
          <div class="day-title">{{ day.title }}</div>
          <div class="day-status">
            <span v-if="completedDays.has(day.id)" class="status-completed">✓ 已完成</span>
            <span v-else class="status-pending">○ 未学习</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #1f2937;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.card-icon.blue {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.card-icon.green {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
}

.card-icon.orange {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.card-icon.purple {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.card-content {
  flex: 1;
}

.card-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.card-label {
  font-size: 13px;
  color: #6b7280;
}

.progress-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.progress-header span {
  font-size: 24px;
  font-weight: 700;
  color: #8b5cf6;
}

.progress-bar {
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  border-radius: 12px;
  transition: width 0.5s ease;
}

.stages-progress {
  margin-bottom: 24px;
}

.stages-progress h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f2937;
}

.stages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.stage-progress-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stage-num {
  font-size: 12px;
  color: #6b7280;
}

.stage-percent {
  font-size: 18px;
  font-weight: 600;
  color: #8b5cf6;
}

.stage-progress-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #1f2937;
}

.stage-desc {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.stage-progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.stage-progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.stage-stats {
  font-size: 12px;
  color: #9ca3af;
}

.daily-progress h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f2937;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.day-progress-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.day-progress-card:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.day-progress-card.completed {
  background: #f5f3ff;
  border-color: #8b5cf6;
}

.day-num {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.day-title {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  line-height: 1.4;
}

.status-completed {
  font-size: 12px;
  color: #22c55e;
  font-weight: 500;
}

.status-pending {
  font-size: 12px;
  color: #9ca3af;
}
</style>
