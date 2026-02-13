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

1. **Phase 1** - 核心引擎（解析器 + 转换器）
2. **Phase 2** - 适配器实现（Cursor, Windsurf, GitHub Copilot）
3. **Phase 3** - CLI工具
4. **Phase 4** - Web可视化界面
5. **Phase 5** - 更多工具支持（Zed, Bolt, Claude Code, Aider）

## 7. 使用方式

### CLI

```bash
# 安装
npm install -g aiconfigbridge

# 转换配置
aiconfigbridge convert --input cursor.json --output windsurf

# 导出为统一格式
aiconfigbridge export --tool cursor --output config.json
```

### Web界面

```bash
cd web
npm install
npm run dev
```

## 8. 许可证

MIT
