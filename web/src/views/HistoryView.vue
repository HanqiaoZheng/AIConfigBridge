<template>
  <div class="history-view">
    <h2>历史记录</h2>
    
    <div class="tool-bar">
      <button @click="clearHistory" class="danger">清空历史</button>
    </div>
    
    <div v-if="history.length === 0" class="empty-state">
      <p>暂无转换历史记录</p>
    </div>
    
    <div v-else class="history-list">
      <div v-for="(item, index) in history" :key="index" class="history-item">
        <div class="history-header">
          <span class="tool-badge from">{{ item.from }}</span>
          <span class="arrow">→</span>
          <span class="tool-badge to">{{ item.to }}</span>
          <span class="timestamp">{{ formatDate(item.timestamp) }}</span>
        </div>
        <div class="history-content">
          <p>{{ item.name || '未命名配置' }}</p>
          <p class="description" v-if="item.description">{{ item.description }}</p>
        </div>
        <div class="history-actions">
          <button @click="restoreConfig(item)">恢复</button>
          <button @click="deleteHistoryItem(index)" class="danger">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface HistoryItem {
  from: string
  to: string
  name: string
  description: string
  config: string
  timestamp: number
}

const history = ref<HistoryItem[]>([])

function loadHistory() {
  try {
    const saved = localStorage.getItem('aiconfigbridge_history')
    if (saved) {
      history.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load history:', e)
  }
}

function saveHistory() {
  try {
    localStorage.setItem('aiconfigbridge_history', JSON.stringify(history.value))
  } catch (e) {
    console.error('Failed to save history:', e)
  }
}

function clearHistory() {
  if (confirm('确定要清空所有历史记录吗?')) {
    history.value = []
    saveHistory()
  }
}

function deleteHistoryItem(index: number) {
  history.value.splice(index, 1)
  saveHistory()
}

function restoreConfig(item: HistoryItem) {
  localStorage.setItem('aiconfigbridge_restore', JSON.stringify(item))
  alert(`配置已准备恢复:\n${item.name}\n请前往"配置管理"页面查看`)
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadHistory()
})

defineExpose({ addToHistory })
</script>

<script lang="ts">
function addToHistory(item: HistoryItem) {
  history.value.unshift(item)
  if (history.value.length > 50) {
    history.value = history.value.slice(0, 50)
  }
  saveHistory()
}
</script>

<style scoped>
.history-view h2 {
  margin-bottom: 20px;
  color: var(--text-primary);
}

.tool-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tool-bar button {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.tool-bar button.danger {
  background: var(--danger-color);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-color);
}

.history-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.tool-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tool-badge.from {
  background: #e3f2fd;
  color: #1976d2;
}

.dark-theme .tool-badge.from {
  background: #1a237e;
  color: #90caf9;
}

.tool-badge.to {
  background: #e8f5e9;
  color: #388e3c;
}

.dark-theme .tool-badge.to {
  background: #1b5e20;
  color: #a5d6a7;
}

.arrow {
  color: var(--text-secondary);
}

.timestamp {
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 12px;
}

.history-content {
  margin-bottom: 12px;
}

.history-content p {
  color: var(--text-primary);
  margin: 4px 0;
}

.description {
  color: var(--text-secondary);
  font-size: 13px;
}

.history-actions {
  display: flex;
  gap: 8px;
}

.history-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  background: var(--primary-color);
  color: white;
}

.history-actions button.danger {
  background: var(--danger-color);
}
</style>
