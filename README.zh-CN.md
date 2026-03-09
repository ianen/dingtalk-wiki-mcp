# dingtalk-wiki-mcp

[![Release](https://img.shields.io/github/v/release/ianen/dingtalk-wiki-mcp?display_name=tag)](https://github.com/ianen/dingtalk-wiki-mcp/releases)
[![License](https://img.shields.io/github/license/ianen/dingtalk-wiki-mcp)](./LICENSE)
[![Stars](https://img.shields.io/github/stars/ianen/dingtalk-wiki-mcp?style=social)](https://github.com/ianen/dingtalk-wiki-mcp)
[![JavaScript](https://img.shields.io/badge/language-JavaScript-f7df1e)](./package.json)

**一个补足钉钉官方 MCP 空白的开源项目：让 AI / MCP 客户端真正读写钉钉 Wiki / Docs。**

[English docs](./README.md)

> 钉钉官方 MCP 目前**没有提供 Wiki / Docs 读写能力**。  
> 这个项目专门补上这一块，让 AI Agent 和 MCP 客户端可以真正做到：**浏览工作空间、浏览目录节点、创建文档 / 文件夹 / 脑图**。

## 为什么这个仓库值得看

希望用户 5 秒内就能理解：

- **官方 MCP 有空白**：没有覆盖 Wiki / Docs 读写
- **这个项目补上了**：支持 workspace、node 浏览和文档创建
- **MCP 兼容**：兼容 stdio 模式的 MCP client
- **Agent 友好**：自带 `SKILL.md`，可直接作为 skill 复用

---

## 快速开始

### 1）安装依赖

```bash
npm install
```

### 2）配置环境变量

```bash
cp .env.example .env
```

必填：

```env
DINGTALK_APP_KEY=your-app-key
DINGTALK_APP_SECRET=your-app-secret
```

### 3）准备本地配置

```bash
cp config.example.json config.json
```

### 4）运行

```bash
npm start
```

或者：

```bash
node index.js
```

> `npx dingtalk-wiki-mcp` 是后续可扩展的分发路径。  
> 当前仓库已经具备正确的 CLI 入口（`bin`），但 npm 发布不在这次版本范围内。

---

## 官方 DingTalk MCP vs 本项目

| 能力 | 钉钉官方 MCP | dingtalk-wiki-mcp |
|---|---:|---:|
| Wiki 读取 | 未覆盖 | ✅ |
| Wiki 写入 | 未覆盖 | ✅ |
| 创建 docs | 未覆盖 | ✅ |
| 创建 folder | 未覆盖 | ✅ |
| 创建 mind map | 未覆盖 | ✅ |
| 浏览 workspace | 未覆盖 | ✅ |
| 浏览 nodes / 目录 | 未覆盖 | ✅ |
| MCP 客户端兼容性 | 官方范围内 | ✅ stdio 兼容 |
| OpenClaw skill 化复用 | 无 | ✅ 自带 `SKILL.md` |

**定位原则：**本项目不是替代官方 MCP，而是**补足官方没覆盖的 Wiki / Docs 能力**。

---

## 核心能力

### Wiki / Docs
- 列出 Wiki 工作空间
- 获取工作空间详情
- 列出 Wiki 节点（目录 / 文档）
- 创建：
  - `DOC`
  - `WORKBOOK`
  - `MIND`
  - `FOLDER`
- 提供跳转式 Wiki 搜索能力

### 组织架构
- 列出部门
- 列出部门成员
- 获取用户信息

### 操作者 / 配置
- 设置当前操作者（`unionId`）
- 使用本地默认操作者
- 查看当前本地配置

### 自带 skill
这个仓库不仅是 MCP Server，还自带：

- `SKILL.md`

所以它也可以作为 **OpenClaw 风格 agent 工作流中的 skill 包** 来复用。

---

## Demo

### 1）列出知识库工作空间

![列出工作空间 Demo](./assets/demo-list-workspaces.svg)

### 2）浏览知识库目录节点

![浏览节点 Demo](./assets/demo-list-nodes.svg)

### 3）创建文档

![创建文档 Demo](./assets/demo-create-doc.svg)

> 这些 Demo 图是基于典型命令与输出流程制作的说明型素材，所有租户相关数据都已移除。

---

## 真实使用场景

### 1）AI 自动创建周报文档
让 Agent 按周在钉钉知识库中自动创建销售、产品或运营周报文档。

### 2）Agent 写入前先浏览知识库结构
在生成内容之前，先读取 workspace / folder 结构，找到正确目录后再写入。

### 3）自动初始化项目知识库目录
新项目开始时，自动生成标准目录结构，例如：

- Project Overview
- Weekly Reports
- Specs
- Release Notes
- Retrospectives

---

## 客户端接入示例

- [OpenClaw 示例](./docs/clients/openclaw.md)
- [mcporter 示例](./docs/clients/mcporter.md)
- [通用 MCP client 示例](./docs/clients/generic-mcp-client.md)

---

## 示例用法

### 查看配置

```bash
mcporter call dingtalk-wiki.show_config
```

### 列出知识库

```bash
mcporter call dingtalk-wiki.list_wiki_workspaces
```

### 列出节点

```bash
mcporter call dingtalk-wiki.list_wiki_nodes workspace_id="your_workspace_id"
```

### 创建文档

```bash
mcporter call dingtalk-wiki.create_wiki_doc \
  workspace_id="your_workspace_id" \
  name="Weekly Summary" \
  doc_type="DOC"
```

### 获取用户信息

```bash
mcporter call dingtalk-wiki.get_user_info userid="your_user_id"
```

---

## 可用 MCP 工具

- `set_operator`
- `show_config`
- `list_wiki_workspaces`
- `get_wiki_workspace`
- `list_wiki_nodes`
- `get_wiki_node`
- `create_wiki_doc`
- `search_wiki`
- `list_departments`
- `get_department_users`
- `get_user_info`

---

## 环境要求

- Node.js 18+
- 一个具备相关 API 权限的钉钉应用
- 一个支持 stdio 的 MCP client，例如：
  - OpenClaw
  - mcporter
  - 其他 MCP Host / Client

---

## 权限说明

根据你的使用范围，钉钉应用可能需要这些权限：

- `Document.WorkspaceDocument.Write`
- Wiki 读取权限
- 部门读取权限
- 用户读取权限

请以钉钉开放平台最新文档和审批要求为准。

---

## 信任材料

- [FAQ](./FAQ.md)
- [Changelog](./CHANGELOG.md)
- [API 测试说明](./API_TEST_REPORT.md)
- [Skill 定义](./SKILL.md)

---

## 安全说明

- `config.json` 包含你的本地用户和 workspace 配置，**不要提交到 Git 仓库**
- 仓库已默认忽略 `config.json` 和 `.env`
- 建议通过环境变量注入 AppKey / AppSecret，而不是写死在代码里

---

## 限制说明

- 本项目是社区补充实现，不是钉钉官方项目
- 部分 API 需要企业侧权限审批
- `search_wiki` 当前更偏向“跳转辅助”，不是完整全文检索实现

---

## 相关链接

- [钉钉开放平台 - 知识库概述](https://open.dingtalk.com/document/development/knowledge-base-overview)
- [创建团队空间文档](https://open.dingtalk.com/document/development/create-team-space-document)

---

## License

MIT
