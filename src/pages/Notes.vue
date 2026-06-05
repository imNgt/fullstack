<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Edit, Delete, Download, Close } from '@element-plus/icons-vue'
import { days } from '@/data/plan'

interface Note {
  id: string
  day: number
  content: string
  date: string
}

const notes = ref<Note[]>([
  {
    id: '1',
    day: 1,
    content: '今天学习了 JDK 安装和 Maven 配置，掌握了 pom.xml 的基本结构。Spring Boot 项目初始化很简单，直接用 start.spring.io 就行。',
    date: '2026-06-05T10:30:00.000Z'
  },
  {
    id: '2',
    day: 2,
    content: '包结构的命名规范：com.example.app.controller，这样分层很清晰。@PathVariable 用于路径参数，@RequestParam 用于查询参数。',
    date: '2026-06-06T14:00:00.000Z'
  }
])

const newNoteDay = ref<number | null>(null)
const newNoteContent = ref('')
const editingId = ref<string | null>(null)
const editingContent = ref('')

const filteredNotes = computed(() => {
  return [...notes.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const getDayInfo = (dayId: number) => {
  return days.find(d => d.id === dayId)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

const saveNewNote = () => {
  if (!newNoteDay.value || !newNoteContent.value.trim()) return
  
  notes.value.push({
    id: Date.now().toString(),
    day: newNoteDay.value,
    content: newNoteContent.value,
    date: new Date().toISOString()
  })
  
  newNoteDay.value = null
  newNoteContent.value = ''
}

const cancelNewNote = () => {
  newNoteDay.value = null
  newNoteContent.value = ''
}

const startEdit = (note: Note) => {
  editingId.value = note.id
  editingContent.value = note.content
}

const saveEdit = () => {
  if (!editingId.value || !editingContent.value.trim()) return
  
  const note = notes.value.find(n => n.id === editingId.value)
  if (note) {
    note.content = editingContent.value
    note.date = new Date().toISOString()
  }
  
  editingId.value = null
  editingContent.value = ''
}

const cancelEdit = () => {
  editingId.value = null
  editingContent.value = ''
}

const deleteNote = (noteId: string) => {
  notes.value = notes.value.filter(n => n.id !== noteId)
}
</script>

<template>
  <div class="notes-container">
    <h1 class="page-title">📒 我的笔记</h1>
    
    <!-- 添加笔记按钮 -->
    <div class="add-note-section">
      <div class="add-note-header">
        <h2>添加新笔记</h2>
      </div>
      <div class="add-note-form">
        <select 
          v-model="newNoteDay" 
          class="note-day-select"
          placeholder="选择学习日"
        >
          <option :value="null">选择学习日</option>
          <option v-for="day in days" :key="day.id" :value="day.id">
            Day {{ day.id }}: {{ day.title }}
          </option>
        </select>
        <textarea 
          v-model="newNoteContent"
          class="note-textarea"
          placeholder="记录你的学习心得..."
          rows="3"
        ></textarea>
        <div class="note-actions">
          <button class="save-btn" :disabled="!newNoteDay || !newNoteContent.trim()" @click="saveNewNote">
            <Download class="action-icon" />
            <span>保存</span>
          </button>
          <button class="cancel-btn" @click="cancelNewNote">
            <Close class="action-icon" />
            <span>取消</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 笔记列表 -->
    <div class="notes-list">
      <h2>笔记列表 ({{ notes.length }})</h2>
      
      <div v-if="filteredNotes.length === 0" class="empty-state">
        <Plus class="empty-icon" />
        <p>还没有笔记，开始记录你的学习心得吧！</p>
      </div>
      
      <div v-else class="notes-grid">
        <div 
          v-for="note in filteredNotes" 
          :key="note.id" 
          class="note-card"
        >
          <div class="note-header">
            <div class="note-day">
              <span class="day-badge">Day {{ note.day }}</span>
              <span class="day-title">{{ getDayInfo(note.day)?.title }}</span>
            </div>
            <div class="note-date">{{ formatDate(note.date) }}</div>
          </div>
          
          <div v-if="editingId === note.id" class="note-edit">
            <textarea 
              v-model="editingContent"
              class="edit-textarea"
              rows="4"
            ></textarea>
            <div class="edit-actions">
              <button class="save-btn small" @click="saveEdit">
                <Download class="action-icon" />
                <span>保存</span>
              </button>
              <button class="cancel-btn small" @click="cancelEdit">
                <Close class="action-icon" />
                <span>取消</span>
              </button>
            </div>
          </div>
          
          <p v-else class="note-content">{{ note.content }}</p>
          
          <div v-if="editingId !== note.id" class="note-footer">
            <button class="edit-btn" @click="startEdit(note)">
              <Edit class="action-icon" />
              <span>编辑</span>
            </button>
            <button class="delete-btn" @click="deleteNote(note.id)">
              <Delete class="action-icon" />
              <span>删除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notes-container {
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #1f2937;
}

.add-note-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.add-note-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f2937;
}

.add-note-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-day-select {
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #374151;
  background: white;
}

.note-textarea {
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #374151;
  resize: vertical;
  font-family: inherit;
}

.note-actions {
  display: flex;
  gap: 12px;
}

.save-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #16a34a;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-btn.small {
  padding: 6px 12px;
  font-size: 12px;
}

.cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.cancel-btn.small {
  padding: 6px 12px;
  font-size: 12px;
}

.action-icon {
  width: 16px;
  height: 16px;
}

.notes-list h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f2937;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #f9fafb;
  border-radius: 16px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #9ca3af;
  margin-bottom: 12px;
}

.empty-state p {
  color: #6b7280;
}

.notes-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.note-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.note-day {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-badge {
  font-size: 12px;
  font-weight: 600;
  color: #22c55e;
}

.day-title {
  font-size: 14px;
  color: #6b7280;
}

.note-date {
  font-size: 12px;
  color: #9ca3af;
}

.note-content {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 16px;
}

.edit-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 12px;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.note-footer {
  display: flex;
  gap: 12px;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.delete-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #fee2e2;
  border: none;
  border-radius: 6px;
  color: #dc2626;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #fecaca;
}
</style>
