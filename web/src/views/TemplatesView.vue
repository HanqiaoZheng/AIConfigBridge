<template>
  <div class="templates-view">
    <h2>预设模板</h2>
    <p class="description">选择预设模板快速开始</p>
    
    <div class="templates-grid">
      <div 
        v-for="template in templates" 
        :key="template.id" 
        class="template-card"
        @click="selectTemplate(template)"
      >
        <div class="template-icon">{{ template.icon }}</div>
        <h3>{{ template.name }}</h3>
        <p>{{ template.description }}</p>
      </div>
    </div>
    
    <div v-if="selectedTemplate" class="template-preview">
      <h3>预览: {{ selectedTemplate.name }}</h3>
      <pre>{{ selectedTemplate.content }}</pre>
      <div class="actions">
        <button @click="useTemplate">使用此模板</button>
        <button @click="selectedTemplate = null" class="secondary">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Template {
  id: string
  name: string
  description: string
  icon: string
  content: string
}

const templates = ref<Template[]>([
  {
    id: 'web-react',
    name: 'React Web应用',
    description: '适用于React + TypeScript项目',
    icon: '⚛️',
    content: `# My React App

## Project Context
- **Project Type:** Web Application (React)

## Coding Standards
- Use functional components and hooks
- Follow React best practices
- Use TypeScript for type safety

## Allowed Commands
- npm run dev
- npm run build
- npm test

## General Rules
Always use modern React patterns with hooks. Prefer composition over inheritance.
`
  },
  {
    id: 'web-vue',
    name: 'Vue Web应用',
    description: '适用于Vue 3 + TypeScript项目',
    icon: '💚',
    content: `# My Vue App

## Project Context
- **Project Type:** Web Application (Vue 3)

## Coding Standards
- Use Composition API
- Follow Vue 3 best practices
- Use TypeScript for type safety

## Allowed Commands
- npm run dev
- npm run build

## General Rules
Use Vue 3 Composition API with script setup syntax.
`
  },
  {
    id: 'api-node',
    name: 'Node.js API',
    description: '适用于Node.js后端API项目',
    icon: '🚀',
    content: `# Node.js API

## Project Context
- **Project Type:** REST API (Node.js)

## Coding Standards
- Use Express or Fastify
- Follow RESTful conventions
- Use async/await for async operations

## Allowed Commands
- npm run dev
- npm run start
- npm test

## General Rules
Write clean, modular API endpoints. Always handle errors properly.
`
  },
  {
    id: 'library',
    name: 'JavaScript库',
    description: '适用于开源JavaScript/TypeScript库',
    icon: '📦',
    content: `# JavaScript Library

## Project Context
- **Project Type:** Library/Package

## Coding Standards
- Use ES modules
- Provide TypeScript definitions
- Keep exports minimal and clear

## General Rules
Focus on small, reusable code. Document all public APIs.
`
  },
  {
    id: 'fullstack',
    name: '全栈应用',
    description: '适用于全栈TypeScript项目',
    icon: '🌐',
    content: `# Full Stack App

## Project Context
- **Project Type:** Full Stack Application

## Coding Standards
- Use TypeScript throughout
- Follow monorepo structure
- Share types between frontend and backend

## Allowed Commands
- npm run dev (frontend + backend)
- npm run build
- npm run test

## General Rules
Keep frontend and backend separate. Share types and utilities.
`
  },
  {
    id: 'minimal',
    name: '极简配置',
    description: '最基础的配置模板',
    icon: '✨',
    content: `# Project Rules

## General Rules
Write clean, maintainable code.
`
  }
])

const selectedTemplate = ref<Template | null>(null)

function selectTemplate(template: Template) {
  selectedTemplate.value = template
}

function useTemplate() {
  if (!selectedTemplate.value) return
  alert(`已选择模板: ${selectedTemplate.value.name}\n\n请前往"配置管理"页面查看`)
  selectedTemplate.value = null
}
</script>

<style scoped>
.templates-view h2 {
  margin-bottom: 8px;
  color: #333;
}

.description {
  color: #666;
  margin-bottom: 24px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.template-card {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: #4a90d9;
  box-shadow: 0 4px 12px rgba(74, 144, 217, 0.15);
}

.template-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.template-card h3 {
  margin-bottom: 8px;
  color: #333;
}

.template-card p {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.template-preview {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}

.template-preview h3 {
  margin-bottom: 12px;
  color: #333;
}

.template-preview pre {
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #eee;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
  max-height: 300px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.actions button {
  padding: 10px 20px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.actions button:hover {
  background: #357abd;
}

.actions button.secondary {
  background: #999;
}

.actions button.secondary:hover {
  background: #777;
}
</style>
