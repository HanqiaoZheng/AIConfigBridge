<template>
  <div class="app">
    <header class="header">
      <h1>AIConfigBridge</h1>
      <p>AI编程工具配置统一管理</p>
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
      </div>
      
      <ConvertView v-if="currentView === 'convert'" />
      <ManageView v-else-if="currentView === 'manage'" />
      <TemplatesView v-else-if="currentView === 'templates'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ConvertView from './views/ConvertView.vue'
import ManageView from './views/ManageView.vue'
import TemplatesView from './views/TemplatesView.vue'

const currentView = ref('convert')
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f5f5;
  min-height: 100vh;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 8px;
}

.header p {
  color: #666;
  font-size: 1rem;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar button {
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.toolbar button:hover {
  background: #f0f0f0;
  color: #333;
}

.toolbar button.active {
  background: #4a90d9;
  color: white;
}

.main {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 500px;
}
</style>
