<template>
  <div class="app" :class="{ 'dark-theme': isDark }">
    <header class="header">
      <div class="header-content">
        <div class="title-section">
          <h1>AIConfigBridge</h1>
          <p>AI编程工具配置统一管理</p>
        </div>
        <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换到浅色主题' : '切换到深色主题'">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
      </div>
    </header>
    
    <main class="main">
      <div class="toolbar">
        <button @click="currentView = 'convert'" :class="{ active: currentView === 'convert' }">
          配置转换
        </button>
        <button @click="currentView = 'manage'" :class="{ active: currentView === 'manage' }">
          配置管理
        </button>
        <button @click="currentView = 'templates'" :class="{ active: currentView === 'templates' }">
          预设模板
        </button>
        <button @click="currentView = 'history'" :class="{ active: currentView === 'history' }">
          历史记录
        </button>
      </div>
      
      <ConvertView v-if="currentView === 'convert'" />
      <ManageView v-else-if="currentView === 'manage'" />
      <TemplatesView v-else-if="currentView === 'templates'" />
      <HistoryView v-else-if="currentView === 'history'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ConvertView from './views/ConvertView.vue'
import ManageView from './views/ManageView.vue'
import TemplatesView from './views/TemplatesView.vue'
import HistoryView from './views/HistoryView.vue'

const currentView = ref('convert')
const isDark = ref(false)

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
  }
})
</script>

<style>
:root {
  --bg-color: #f5f5f5;
  --card-bg: #ffffff;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #dddddd;
  --primary-color: #4a90d9;
  --primary-hover: #357abd;
  --danger-color: #f44336;
  --warning-bg: #fff3e0;
  --warning-text: #e65100;
  --success-color: #4caf50;
}

.dark-theme {
  --bg-color: #1a1a2e;
  --card-bg: #16213e;
  --text-primary: #e8e8e8;
  --text-secondary: #a0a0a0;
  --border-color: #333366;
  --primary-color: #5a9fd4;
  --primary-hover: #4a8ec4;
  --danger-color: #e57373;
  --warning-bg: #4a3f00;
  --warning-text: #ffcc00;
  --success-color: #81c784;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg-color);
  color: var(--text-primary);
  min-height: 100vh;
  transition: background-color 0.3s, color 0.3s;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.header p {
  color: var(--text-secondary);
  font-size: 1rem;
}

.theme-toggle {
  padding: 10px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-toggle:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  background: var(--card-bg);
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar button {
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.toolbar button:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.toolbar button.active {
  background: var(--primary-color);
  color: white;
}

.main {
  background: var(--card-bg);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 500px;
  transition: background-color 0.3s;
}

.dark-theme .main {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
