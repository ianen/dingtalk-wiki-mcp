# dingtalk-wiki-mcp

一个用于 **钉钉知识库（DingTalk Wiki / Docs）读写** 的 MCP Server。

[English documentation](./README.md)

> 这个项目是对钉钉官方 MCP 的一个实用补充。  
> **钉钉官方 MCP 目前没有提供知识库读写能力**，所以这个开源项目专门用来补上这部分缺口。

---

## 背景

钉钉官方提供了 MCP 相关能力，但在实际使用中，**知识库（Wiki / Docs）读写并没有被完整覆盖**。

如果你希望让 AI Agent 或 MCP Client 直接：

- 列出知识库空间
- 浏览知识库目录/文档节点
- 创建文档、表格、脑图、文件夹
- 查询组织架构和用户信息

那么官方能力并不够用。

**dingtalk-wiki-mcp** 就是为这个场景补上的一个开源实现：
它专注于把钉钉 Wiki / Docs 能力通过 MCP 暴露出来，方便接入 OpenClaw、mcporter 或其他 MCP-compatible client。

---

## 项目定位

这个项目不是为了替代钉钉官方 MCP，而是作为它的**补充模块**：

- 官方 MCP 负责官方已覆盖的能力
- 本项目补充 **知识库读写能力**
- 你可以单独使用它，也可以和官方 MCP 一起使用

---

## 功能特性

### Wiki / Docs
- 列出 Wiki 工作空间
- 获取工作空间详情
- 列出 Wiki 节点（目录 / 文档）
- 创建 Wiki 文档：
  - `DOC`
  - `WORKBOOK`
  - `MIND`
  - `FOLDER`
- 提供跳转式 Wiki 搜索能力

### 组织架构
- 列出部门
- 列出部门成员
- 获取用户信息

### 配置 / 操作者
- 设置当前操作者（`unionId`）
- 查看当前配置
- 使用本地配置中的默认操作者

### 自带 skill
这个仓库不仅是一个独立的 MCP Server，还**自带了 skill 定义文件**：

- `SKILL.md`

这意味着它既可以单独运行，也可以作为 OpenClaw / agent 工作流里的可复用 skill 包来使用。

---

## 适用场景

适合以下场景：

- 给 AI Agent 增加钉钉知识库访问能力
- 在企业内部知识库中自动创建文档
- 结合工作流 / 自动化系统批量生成钉钉文档
- 让 MCP Client 直接读取知识库结构，辅助导航与整理
- 在 OpenClaw 等 agent 系统里作为一个可复用的 skill 使用

---

## 环境要求

- Node.js 18+
- 一个具备相应 API 权限的钉钉应用
- 一个 MCP-compatible client，例如：
  - OpenClaw
  - mcporter
  - 其他 MCP Host / Client

---

## 快速开始

### 1）安装依赖

```bash
npm install
```

### 2）准备环境变量

```bash
cp .env.example .env
```

必填：

```env
DINGTALK_APP_KEY=your-app-key
DINGTALK_APP_SECRET=your-app-secret
```

可选：

```env
DINGTALK_WIKI_CONFIG_PATH=/absolute/path/to/config.json
```

如果不设置 `DINGTALK_WIKI_CONFIG_PATH`，程序默认读取当前目录下的 `config.json`。

### 3）准备配置文件

```bash
cp config.example.json config.json
```

示例：

```json
{
  "defaultUser": "your-default-user",
  "users": {
    "your-default-user": {
      "name": "Your Name",
      "userId": "your-user-id",
      "unionId": "your-union-id"
    }
  },
  "workspaces": {
    "Your Workspace": {
      "id": "your_workspace_id",
      "url": "https://alidocs.dingtalk.com/i/spaces/your-space-id/overview",
      "type": "TEAM"
    }
  },
  "appKey": "your-app-key"
}
```

### 4）运行

```bash
npm start
```

或者：

```bash
node index.js
```

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

### 列出某个知识库的节点

```bash
mcporter call dingtalk-wiki.list_wiki_nodes workspace_id="your_workspace_id"
```

### 创建文档

```bash
mcporter call dingtalk-wiki.create_wiki_doc \
  workspace_id="your_workspace_id" \
  name="新文档标题" \
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

## 权限说明

根据你的使用范围，钉钉应用可能需要以下权限：

- `Document.WorkspaceDocument.Write`
- Wiki 读取权限
- 部门读取权限
- 用户读取权限

具体权限名称和审批要求，请以钉钉开放平台最新文档为准。

---

## 安全说明

- `config.json` 包含你的本地用户和 workspace 配置，**不要提交到 Git 仓库**
- 仓库里已经默认忽略 `config.json` 和 `.env`
- 建议把 AppKey / AppSecret 通过环境变量注入，而不是写死在代码里

---

## 限制说明

- 本项目是社区补充实现，不是钉钉官方项目
- 某些 API 需要企业侧权限审批
- `search_wiki` 当前更偏向“跳转辅助”，而不是完整全文检索实现

---

## 相关链接

- [钉钉开放平台 - 知识库概述](https://open.dingtalk.com/document/development/knowledge-base-overview)
- [创建团队空间文档](https://open.dingtalk.com/document/development/create-team-space-document)

---

## License

MIT
