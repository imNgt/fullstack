<script setup lang="ts">
import { ref } from 'vue'
import { CaretBottom, CaretRight, Notebook } from '@element-plus/icons-vue'
import { stages, days } from '@/data/plan'

defineProps<{
  currentPage: string
  selectedDay: number | null
}>()

const emit = defineEmits<{
  (e: 'change-page', page: string): void
  (e: 'select-day', day: number): void
}>()

const expandedStages = ref<number[]>([1])

const toggleStage = (stageId: number) => {
  const index = expandedStages.value.indexOf(stageId)
  if (index === -1) {
    expandedStages.value.push(stageId)
  } else {
    expandedStages.value.splice(index, 1)
  }
}

const getDaysByStage = (stageId: number) => {
  return days.filter(day => day.stage === stageId)
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <Notebook class="sidebar-icon" />
      <span>学习目录</span>
    </div>
    
    <div class="sidebar-content">
      <div v-for="stage in stages" :key="stage.id" class="stage-item">
        <button 
          class="stage-header" 
          @click="toggleStage(stage.id)"
        >
          <component 
            :is="expandedStages.includes(stage.id) ? CaretBottom : CaretRight" 
            class="stage-icon" 
          />
          <span class="stage-title">{{ stage.title }}</span>
          <span class="stage-days">({{ stage.days }}天)</span>
        </button>
        
        <div 
          v-if="expandedStages.includes(stage.id)" 
          class="stage-content"
        >
          <button
            v-for="day in getDaysByStage(stage.id)"
            :key="day.id"
            class="day-item"
            :class="{ active: selectedDay === day.id }"
            @click="emit('select-day', day.id)"
          >
            <span class="day-number">Day {{ day.id }}</span>
            <span class="day-title">{{ day.title }}</span>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 290px;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.03);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 700;
  color: #1f2937;
  font-size: 15px;
  background: linear-gradient(90deg, #f5f3ff 0%, #ede9fe 100%);
}

.sidebar-icon {
  width: 22px;
  height: 22px;
  color: #8b5cf6;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.stage-item {
  margin-bottom: 8px;
}

.stage-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 12px 12px 0;
  margin-left: 8px;
}

.stage-header:hover {
  background: #f5f3ff;
  color: #7c3aed;
  transform: translateX(4px);
}

.stage-icon {
  width: 18px;
  height: 18px;
  color: #9ca3af;
  transition: color 0.25s;
}

.stage-header:hover .stage-icon {
  color: #8b5cf6;
}

.stage-title {
  flex: 1;
}

.stage-days {
  font-size: 12px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 10px;
}

.stage-content {
  padding-left: 20px;
  margin-top: 4px;
}

.day-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  color: #6b7280;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid transparent;
  border-radius: 0 10px 10px 0;
}

.day-item:hover {
  background: #f9fafb;
  color: #374151;
  transform: translateX(3px);
}

.day-item.active {
  background: linear-gradient(90deg, #f5f3ff 0%, #ede9fe 100%);
  color: #6d28d9;
  border-left-color: #8b5cf6;
  font-weight: 500;
  box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.15);
}

.day-number {
  font-weight: 700;
  min-width: 52px;
  font-size: 14px;
  color: #9ca3af;
}

.day-item.active .day-number {
  color: #22c55e;
}

.day-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
