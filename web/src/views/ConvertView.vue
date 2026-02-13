<template>
  <div class="convert-view">
    <h2>配置转换</h2>
    
    <div class="form-group">
      <label>源工具</label>
      <select v-model="fromTool">
        <option value="">选择源工具</option>
        <option value="cursor">Cursor</option>
        <option value="windsurf">Windsurf</option>
        <option value="zed">Zed</option>
        <option value="bolt">Bolt</option>
        <option value="copilot">GitHub Copilot</option>
      </select>
    </div>
    
    <div class="form-group">
      <label>目标工具</label>
      <select v-model="toTool">
        <option value="">选择目标工具</option>
        <option value="cursor">Cursor</option>
        <option value="windsurf">Windsurf</option>
        <option value="zed">Zed</option>
        <option value="bolt">Bolt</option>
        <option value="copilot">GitHub Copilot</option>
      </select>
    </div>
    
    <div class="form-group">
      <label>配置文件</label>
      <textarea 
        v-model="inputContent" 
        placeholder="粘贴配置文件内容或拖拽文件..."
        rows="10"
      ></textarea>
    </div>
    
    <div class="actions">
      <button @click="convert" :disabled="!canConvert">
        转换为 {{ toToolDisplay }}
      </button>
      <button @click="clear" class="secondary">清空</button>
    </div>
    
    <div v-if="outputContent" class="output">
      <h3>转换结果</h3>
      <textarea v-model="outputContent" rows="10" readonly></textarea>
      <button @click="copyOutput">复制</button>
    </div>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-if="warnings.length > 0" class="warnings">
      <h4>警告:</h4>
      <ul>
        <li v-for="(warning, index) in warnings" :key="index">{{ warning }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const fromTool = ref('')
const toTool = ref('')
const inputContent = ref('')
const outputContent = ref('')
const error = ref('')
const warnings = ref<string[]>([])

const toToolDisplay = computed(() => {
  const toolNames: Record<string, string> = {
    cursor: 'Cursor',
    windsurf: 'Windsurf',
    zed: 'Zed',
    bolt: 'Bolt',
    copilot: 'GitHub Copilot'
  }
  return toolNames[toTool.value] || '目标工具'
})

const canConvert = computed(() => {
  return fromTool.value && toTool.value && inputContent.value.trim()
})

async function convert() {
  if (!canConvert.value) return
  
  error.value = ''
  outputContent.value = ''
  warnings.value = []
  
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
    
    const transformer = factory.getTransformer()
    const result = await transformer.convert(
      inputContent.value,
      fromTool.value as any,
      toTool.value as any
    )
    
    if (!result.success) {
      error.value = result.error || '转换失败'
      return
    }
    
    const targetAdapter = factory.get(toolTypeToEnum(tool.value))
    if (!targetAdapter) {
      error.value = '不支持的目标工具'
      return
    }
    
    const serializeResult = await targetAdapter.serialize(result.config!)
    
    if (!serializeResult.success) {
      error.value = serializeResult.error || '序列化失败'
      return
    }
    
    outputContent.value = serializeResult.content || ''
    warnings.value = result.warnings || []
  } catch (e) {
    error.value = e instanceof Error ? e.message : '转换失败'
  }
}

function toolTypeToEnum(tool: string): any {
  const tools: Record<string, any> = {
    cursor: 'cursor',
    windsurf: 'windsurf',
    zed: 'zed',
    bolt: 'bolt',
    copilot: 'copilot'
  }
  return tools[tool]
}

function clear() {
  inputContent.value = ''
  outputContent.value = ''
  error.value = ''
  warnings.value = []
}

function copyOutput() {
  navigator.clipboard.writeText(outputContent.value)
}
</script>

<style scoped>
.convert-view {
  max-width: 800px;
}

.convert-view h2 {
  margin-bottom: 20px;
  color: #333;
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

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4a90d9;
}

.form-group textarea {
  resize: vertical;
}

.actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.actions button {
  padding: 10px 24px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.actions button:hover:not(:disabled) {
  background: #357abd;
}

.actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.actions button.secondary {
  background: #999;
}

.actions button.secondary:hover {
  background: #777;
}

.output {
  margin-top: 20px;
}

.output h3 {
  margin-bottom: 10px;
  color: #333;
}

.output textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: monospace;
  resize: vertical;
  background: #f9f9f9;
}

.output button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.error {
  margin-top: 20px;
  padding: 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 6px;
}

.warnings {
  margin-top: 20px;
  padding: 12px;
  background: #fff3e0;
  border-radius: 6px;
}

.warnings h4 {
  color: #e65100;
  margin-bottom: 8px;
}

.warnings ul {
  margin: 0;
  padding-left: 20px;
  color: #e65100;
}
</style>
