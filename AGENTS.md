# AIConfigBridge - AI辅助编程工作流程规范

本文档定义了与AI协作开发时的工作流程和规范。

---

## 1. 项目配置文件

### 1.1 CLAUDE.md - 项目规范文件

在项目根目录创建 `CLAUDE.md`，让AI理解项目上下文：

```markdown
# Project: AIConfigBridge

## Tech Stack
- TypeScript
- Node.js (monorepo with workspaces)
- Vite (web frontend)

## Key Commands
- `npm install` - Install all dependencies
- `npm run dev` - Start development (runs all workspaces)
- `npm run build` - Build all packages
- `npm run test` - Run tests

## Architecture
- `/core` - Core engine (parsers, transformers, adapters)
- `/web` - Web UI (Vue 3)
- `/cli` - CLI tool

## Code Style
- Use TypeScript strict mode
- No `any` types
- Use ES modules
- Follow existing code patterns in each module
```

### 1.2 工作目录约定

```
ai-swap/      # 临时工作区 (gitignored) - 用于头脑风暴、临时文件
docs-ai/      # 永久AI文档 - 架构决策、编码规范等
```

---

## 2. 任务执行规范

### 2.1 小任务原则

**每次只完成一个小任务**，避免一次处理多个功能。

✅ 正确:
- "添加Cursor适配器"
- "实现配置解析器"
- "创建Web界面基础结构"

❌ 错误:
- "添加Cursor和Windsurf适配器，同时创建Web界面"

### 2.2 Plan模式

对于复杂任务，先使用Plan模式规划：

1. 描述任务目标
2. 让AI分析需要修改的文件
3. 确认计划后再执行

### 2.3 反馈循环

每个任务完成后，验证功能正常再提交：

```bash
# 示例：实现功能后运行测试
"实现解析器并运行测试，确保通过后再提交"
```

---

## 3. Git提交规范

### 3.1 提交时机

**每完成一个小任务就提交**，不要累积大量修改。

✅ 正确:
- 完成适配器 → 立即提交
- 添加新功能 → 立即提交
- 修复bug → 立即提交

❌ 错误:
- 完成了3个功能后才提交
- 改了一天才提交

### 3.2 提交信息格式

使用清晰的提交信息：

```
[type]: 简短描述

详细说明（可选）
```

类型标识:
- `feat`: 新功能
- `fix`: 修复bug
- `refactor`: 重构
- `docs`: 文档
- `chore`: 构建/工具

示例:
```
feat: 添加Cursor配置适配器

实现Cursor的.cursorrules文件解析和序列化
```

### 3.3 提交流程

每次提交遵循以下流程：

1. 查看变更: `git status` + `git diff`
2. 分析变更内容
3. 编写提交信息
4. 提交: `git add . && git commit -m "..."`

---

## 4. 代码质量规范

### 4.1 编写代码前

- [ ] 理解现有代码结构
- [ ] 遵循项目的代码风格
- [ ] 查看类型定义和接口

### 4.2 编写代码时

- [ ] 使用TypeScript严格模式
- [ ] 添加必要的类型注解
- [ ] 避免使用`any`
- [ ] 遵循单一职责原则

### 4.3 编写代码后

- [ ] 运行 lint 检查
- [ ] 运行类型检查
- [ ] 运行测试
- [ ] 验证功能正常

---

## 5. 对话规范

### 5.1 提供清晰的需求

✅ 好的prompt:
```
在 core/src/adapters/ 目录下创建Cursor适配器，实现:
1. 解析 .cursorrules 文件
2. 序列化为统一格式
3. 使用现有的 Adapter 接口
```

❌ 模糊的prompt:
```
帮我添加Cursor支持
```

### 5.2 指定上下文

- 说明涉及的模块
- 提到相关的现有文件
- 说明预期输出

### 5.3 分步执行

复杂任务拆分成多个步骤：

```
步骤1: 定义配置类型
步骤2: 实现解析器
步骤3: 实现序列化器
步骤4: 编写测试
```

---

## 6. 任务清单示例

使用TodoWrite跟踪进度：

```
- [x] Phase 1: 核心引擎
  - [x] 定义统一配置格式
  - [x] 实现解析器基类
  - [x] 实现转换器
  - [x] 添加Cursor适配器
  - [x] 添加Windsurf适配器
- [x] Phase 2: 适配器
  - [x] 添加Zed适配器
  - [x] 添加Bolt适配器
  - [x] 添加Copilot适配器
- [x] Phase 3: CLI工具
  - [x] 实现命令行界面
  - [x] 添加转换命令
- [x] Phase 4: Web界面
  - [x] 创建Vue项目
  - [x] 实现配置管理界面
- [ ] Phase 5: 更多工具支持
  - [ ] 添加Claude Code适配器
  - [ ] 添加Aider适配器
```

---

## 7. 文档更新规范

### 7.1 Phase完成后必须更新文档

每个Phase完成后，必须更新以下文档：

- **README.md** - 更新开发计划表格，标记Phase状态为"完成"
- **AGENTS.md** - 更新任务清单，标记已完成的任务
- 如果有新增功能或命令，同步更新README.md的使用方式部分

### 7.2 文档更新时机

- 每次完成一个Phase后立即更新文档
- 添加新功能后更新README.md的相关说明
- 提交信息中使用 `docs:` 前缀

---

## 8. 检查清单 (每次提交前)

- [ ] 代码遵循项目规范
- [ ] 类型检查通过
- [ ] 没有语法错误
- [ ] 变更已测试
- [ ] 提交信息清晰
- [ ] 没有提交敏感信息
