# AIConfigBridge

一个可视化配置管理工具，用于在不同的AI编程工具之间统一管理和转换配置格式。

## 1. 项目概述

**AIConfigBridge** 解决AI编程工具配置格式不兼容的问题，让开发者能够轻松地在不同AI编辑器（Cursor、Windsurf、Zed、Bolt等）和CLI工具（GitHub Copilot、Claude Code、Aider等）之间切换，而无需手动重新配置。

## 2. 核心功能

### 2.1 支持的工具

| 类型 | 工具 | 配置格式 |
|------|------|----------|
| AI代码编辑器 | Cursor | `.cursorrules`, `settings.json` |
| | Windsurf | `.windsurfrules`, `settings.json` |
| | Zed | `config.json`, `.zedrules` |
| | Bolt | `bolt.json` |
| AI CLI工具 | GitHub Copilot | `settings.json` |
| | Claude Code | `claude.json` |
| | Aider | `.aider.conf.yml` |

### 2.2 核心特性

1. **统一配置模型** - 定义标准的中间配置格式，所有工具配置都转换为这种格式
2. **双向转换** - 中间格式 ↔ 目标工具格式
3. **可视化界面** - Web界面管理、编辑、同步配置
4. **预设模板** - 常用配置模板（代码风格、规则、上下文等）
5. **冲突检测** - 检测不同工具配置间的冲突

## 3. 技术架构

```
┌─────────────────────────────────────────────┐
│              Web UI (React/Vue)             │
├─────────────────────────────────────────────┤
│              配置管理引擎                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │
│  │ 解析器   │  │ 转换器  │  │ 合并/冲突处理 │  │
│  └─────────┘  └─────────┘  └─────────────┘  │
├─────────────────────────────────────────────┤
│           适配器层 (Adapter Layer)          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │
│  │Cur-│ │Win-│ │Zed │ │Bolt│ │Co- │ │Aid-│ │
│  │sor │ │surf│ │    │ │    │ │pilot│ │er  │ │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ │
├─────────────────────────────────────────────┤
│              存储层 (本地/云端)              │
└─────────────────────────────────────────────┘
```

## 4. 数据模型

### 统一配置格式 (AICConfig)

```typescript
interface AICConfig {
  version: string;
  meta: {
    name: string;
    description: string;
  };
  rules: {
    files: string[];
    content: string;
  }[];
  context: {
    projectType: string;
    codingStandards: string[];
    allowedCommands: string[];
  };
  mcpServers?: {
    name: string;
    command: string;
    args: string[];
  }[];
  model?: {
    provider: string;
    model: string;
  };
}
```

## 5. 项目结构

```
aiconfigbridge/
├── web/                    # 前端可视化界面
│   ├── src/
│   │   ├── components/    # UI组件
│   │   ├── views/         # 页面视图
│   │   └── stores/        # 状态管理
│   └── package.json
├── core/                   # 核心引擎
│   ├── src/
│   │   ├── adapters/      # 工具适配器
│   │   ├── transformers/  # 转换器
│   │   ├── parser/        # 配置解析
│   │   └── merger/        # 冲突合并
│   └── package.json
├── cli/                    # 命令行工具
│   └── package.json
└── package.json           # 根package.json
```

## 6. 开发计划

| Phase | 状态 | 说明 |
|-------|------|------|
| Phase 1 | ✅ 完成 | 核心引擎（解析器 + 转换器） |
| Phase 2 | ✅ 完成 | 适配器实现（Cursor, Windsurf, Zed, Bolt, Copilot） |
| Phase 3 | ✅ 完成 | CLI工具 |
| Phase 4 | ✅ 完成 | Web可视化界面 |
| Phase 5 | ✅ 完成 | Claude Code适配器 |
| Phase 6 | ✅ 完成 | OpenCode适配器 |
| Phase 7 | ✅ 完成 | Aider适配器 |
| Phase 8 | ✅ 完成 | CLI增强（交互式模式、配置文件支持） |
| Phase 9 | ✅ 完成 | Web界面增强（主题切换、历史记录） |

### 已支持的工具

| 类型 | 工具 | 配置格式 | 状态 |
|------|------|----------|------|
| AI代码编辑器 | Cursor | `.cursorrules` | ✅ |
| | Windsurf | `.windsurfrules` | ✅ |
| | Zed | `config.json`, `.zedrules` | ✅ |
| | Bolt | `bolt.json` | ✅ |
| | OpenCode | `opencode.json` | ✅ |
| AI CLI工具 | GitHub Copilot | `.copilot.json` | ✅ |
| | Claude Code | `settings.json` | ✅ |
| | Aider | `.aider.conf.yml` | ✅ |

## 7. 使用方式

### CLI

```bash
# 安装
npm install -g aiconfigbridge

# 交互式模式
aiconfigbridge interactive

# 转换配置
aiconfigbridge convert -i input.cursorrules -f cursor -t windsurf -o output.windsurfrules

# 解析配置
aiconfigbridge parse -i input.json -o config.json

# 检测类型
aiconfigbridge detect -i .cursorrules

# 列出支持的工具
aiconfigbridge list

# 管理配置
aiconfigbridge config
```

### Web界面

```bash
cd web
npm install
npm run dev
```

## 8. 许可证

MIT
