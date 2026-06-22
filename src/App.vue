<script setup lang="ts">
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import Sidebar from '@/components/Sidebar.vue'
import Home from '@/pages/Home.vue'
import DayDetail from '@/pages/DayDetail.vue'
import Progress from '@/pages/Progress.vue'
import CalendarPage from '@/pages/CalendarPage.vue'
import Notes from '@/pages/Notes.vue'

const currentPage = ref('home')
const selectedDay = ref<number | null>(null)

const handlePageChange = (page: string) => {
  currentPage.value = page
  selectedDay.value = null
}

const handleDaySelect = (day: number) => {
  selectedDay.value = day
  currentPage.value = 'dayDetail'
}

const handleBackToHome = () => {
  currentPage.value = 'home'
  selectedDay.value = null
}
</script>

<template>
  <div class="app-container">
    <NavBar :current-page="currentPage" @change-page="handlePageChange" />
    
    <div class="main-content">
      <Sidebar 
        :current-page="currentPage" 
        :selected-day="selectedDay"
        @change-page="handlePageChange" 
        @select-day="handleDaySelect" 
      />
      
      <div class="content-area">
        <Home 
          v-if="currentPage === 'home'" 
          @select-day="handleDaySelect" 
        />
        <DayDetail 
          v-else-if="currentPage === 'dayDetail' && selectedDay" 
          :day="selectedDay" 
          @back="handleBackToHome" 
        />
        <Progress 
          v-else-if="currentPage === 'progress'" 
        />
        <CalendarPage 
          v-else-if="currentPage === 'calendar'" 
          @select-day="handleDaySelect" 
        />
        <Notes 
          v-else-if="currentPage === 'notes'" 
        />
      </div>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  margin-top: 64px;
}

.content-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  height: calc(100vh - 64px);
}
</style>
