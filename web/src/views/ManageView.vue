<template>
  <div class="manage-view">
    <h2>配置管理</h2>
    
    <div class="tool-bar">
      <button @click="showImport = true">导入配置</button>
      <button @click="exportConfig" :disabled="!currentConfig">导出配置</button>
      <button @click="clearConfig" :disabled="!currentConfig" class="secondary">清空</button>
    </div>
    
    <div v-if="!currentConfig" class="empty-state">
      <p>暂无配置，请导入或创建新配置</p>
    </div>
    
    <div v-else class="config-editor">
      <div class="form-group">
        <label>配置名称</label>
        <input v-model="currentConfig.meta.name" type="text" />
      </div>
      
      <div class="form-group">
        <label>描述</label>
        <textarea v-model="currentConfig.meta.description" rows="2"></textarea>
      </div>
      
      <div class="form-group">
        <label>项目类型</label>
        <input v-model="currentConfig.context.projectType" type="text" placeholder="例如: web, api, library" />
      </div>
      
      <div class="form-group">
        <label>规则 ({{ currentConfig.rules.length }})</label>
        <div class="rules-list">
          <div v-for="(rule, index) in currentConfig.rules" :key="index" class="rule-item">
            <input v-model="rule.name" placeholder="规则名称" />
            <textarea v-model="rule.content" placeholder="规则内容" rows="3"></textarea>
            <button @click="removeRule(index)" class="delete-btn">删除</button>
          </div>
          <button @click="addRule" class="add-btn">+ 添加规则</button>
        </div>
      </div>
      
      <div class="form-group">
        <label>允许的命令</label>
        <div class="tags-input">
          <span v-for="(cmd, index) in currentConfig.context.allowedCommands" :key="index" class="tag">
            {{ cmd }}
            <button @click="removeCommand(index)">&times;</button>
          </span>
          <input 
            v-model="newCommand" 
            @keydown.enter="addCommand"
            placeholder="输入命令后按回车添加" 
          />
        </div>
      </div>
      
      <div class="form-group">
        <label>MCP服务器</label>
        <div class="mcp-list">
          <div v-for="(server, index) in (currentConfig.mcpServers || [])" :key="index" class="mcp-item">
            <input v-model="server.name" placeholder="名称" />
            <input v-model="server.command" placeholder="命令" />
            <input v-model="server.argsStr" placeholder="参数 (用空格分隔)" @change="updateMcpArgs(index)" />
            <button @click="removeMcp(index)" class="delete-btn">删除</button>
          </div>
          <button @click="addMcp" class="add-btn">+ 添加MCP服务器</button>
        </div>
      </div>
    </div>
    
    <div v-if="showImport" class="modal">
      <div class="modal-content">
        <h3>导入配置</h3>
        <div class="form-group">
          <label>工具类型</label>
          <select v-model="importTool">
            <option value="cursor">Cursor</option>
            <option value="windsurf">Windsurf</option>
            <option value="zed">Zed</option>
            <option value="bolt">Bolt</option>
            <option value="copilot">GitHub Copilot</option>
          </select>
        </div>
        <div class="form-group">
          <label>配置文件内容</label>
          <textarea v-model="importContent" rows="10" placeholder="粘贴配置内容..."></textarea>
        </div>
        <div class="modal-actions">
          <button @click="importConfig">导入</button>
          <button @click="showImport = false" class="secondary">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface AICConfig {
  version: string
  meta: {
    name: string
    description: string
  }
  rules: Array<{
    name: string
    content: string
  }>
  context: {
    projectType: string
    codingStandards: string[]
    allowedCommands: string[]
  }
  mcpServers?: Array<{
    name: string
    command: string
    args: string[]
    argsStr?: string
  }>
}

const currentConfig = ref<AICConfig | null>(null)
const showImport = ref(false)
const importTool = ref('cursor')
const importContent = ref('')
const newCommand = ref('')
const exportTool = ref('cursor')

const defaultConfig = (): AICConfig => ({
  version: '1.0.0',
  meta: {
    name: '新配置',
    description: ''
  },
  rules: [],
  context: {
    projectType: '',
    codingStandards: [],
    allowedCommands: []
  },
  mcpServers: []
})

currentConfig.value = defaultConfig()

function addRule() {
  if (!currentConfig.value) return
  currentConfig.value.rules.push({
    name: '',
    content: ''
  })
}

function removeRule(index: number) {
  if (!currentConfig.value) return
  currentConfig.value.rules.splice(index, 1)
}

function addCommand() {
  if (!newCommand.value.trim() || !currentConfig.value) return
  currentConfig.value.context.allowedCommands.push(newCommand.value.trim())
  newCommand.value = ''
}

function removeCommand(index: number) {
  if (!currentConfig.value) return
  currentConfig.value.context.allowedCommands.splice(index, 1)
}

function addMcp() {
  if (!currentConfig.value) return
  if (!currentConfig.value.mcpServers) {
    currentConfig.value.mcpServers = []
  }
  currentConfig.value.mcpServers.push({
    name: '',
    command: '',
    args: [],
    argsStr: ''
  })
}

function removeMcp(index: number) {
  if (!currentConfig.value) return
  currentConfig.value.mcpServers?.splice(index, 1)
}

function updateMcpArgs(index: number) {
  if (!currentConfig.value?.mcpServers) return
  const server = currentConfig.value.mcpServers[index]
  server.args = server.argsStr?.split(/\s+/).filter(Boolean) || []
}

function clearConfig() {
  currentConfig.value = defaultConfig()
}

async function importConfig() {
  if (!importContent.value.trim()) return
  
  try {
    const { AdapterFactory } = await import('@aiconfigbridge/core')
    const { CursorAdapter } = await import('@aiconfigbridge/core')
    const { WindsurfAdapter } = await import('@aiconfigbridge/core')
    const { ZedAdapter } = await import('@aiconfigbridge/core')
    const { BoltAdapter } = await import('@aiconfigbridge/core')
    const { CopilotAdapter } = await import('@aiconfigbridge/core')
    
    const factory = new AdapterFactory()
    factory.register(new CursorAdapter())
    factory.register(new WindsurfAdapter())
    factory.register(new ZedAdapter())
    factory.register(new BoltAdapter())
    factory.register(new CopilotAdapter())
    
    const result = await factory.parse(importContent.value, importTool.value as any)
    
    if (!result.success || !result.config) {
      alert('解析失败: ' + result.error)
      return
    }
    
    currentConfig.value = result.config as any
    showImport.value = false
    importContent.value = ''
  } catch (e) {
    alert('导入失败: ' + (e instanceof Error ? e.message : '未知错误'))
  }
}

async function exportConfig() {
  if (!currentConfig.value) return
  
  try {
    const { AdapterFactory } = await import('@aiconfigbridge/core')
    const { CursorAdapter } = await import('@aiconfigbridge/core')
    const { WindsurfAdapter } = await import('@aiconfigbridge/core')
    const { ZedAdapter } = await import('@aiconfigbridge/core')
    const { BoltAdapter } = await import('@aiconfigbridge/core')
    const { CopilotAdapter } = await import('@aiconfigbridge/core')
    
    const factory = new AdapterFactory()
    factory.register(new CursorAdapter())
    factory.register(new WindsurfAdapter())
    factory.register(new ZedAdapter())
    factory.register(new BoltAdapter())
    factory.register(new CopilotAdapter())
    
    const adapter = factory.get(exportTool.value as any)
    if (!adapter) {
      alert('请先选择导出工具类型')
      return
    }
    
    const result = await adapter.serialize(currentConfig.value as any)
    
    if (!result.success) {
      alert('导出失败: ' + result.error)
      return
    }
    
    const blob = new Blob([result.content || ''], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentConfig.value.meta.name}.${getExtension(exportTool.value)}`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    alert('导出失败: ' + (e instanceof Error ? e.message : '未知错误'))
  }
}

function getExtension(tool: string): string {
  const extensions: Record<string, string> = {
    cursor: 'cursorrules',
    windsurf: 'windsurfrules',
    zed: 'json',
    bolt: 'json',
    copilot: 'json'
  }
  return extensions[tool] || 'txt'
}
</script>

<style scoped>
.manage-view h2 {
  margin-bottom: 20px;
  color: #333;
}

.tool-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tool-bar button {
  padding: 8px 16px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.tool-bar button:hover:not(:disabled) {
  background: #357abd;
}

.tool-bar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-bar button.secondary {
  background: #999;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #4a90d9;
}

.rules-list,
.mcp-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item,
.mcp-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.rule-item input,
.mcp-item input {
  flex: 1;
}

.rule-item textarea {
  flex: 2;
}

.delete-btn {
  padding: 8px 12px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.add-btn {
  padding: 10px;
  background: #f5f5f5;
  color: #666;
  border: 2px dashed #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.add-btn:hover {
  border-color: #4a90d9;
  color: #4a90d9;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  min-height: 42px;
}

.tags-input input {
  flex: 1;
  min-width: 150px;
  border: none;
  padding: 4px;
}

.tags-input input:focus {
  outline: none;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #e3f2fd;
  border-radius: 4px;
  font-size: 13px;
}

.tag button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0;
  font-size: 16px;
  line-height: 1;
}

.tag button:hover {
  color: #f44336;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.modal-content h3 {
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.modal-actions button {
  flex: 1;
  padding: 10px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.modal-actions button.secondary {
  background: #999;
}
</style>
