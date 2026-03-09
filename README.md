# dingtalk-wiki-mcp

**中文**：一个用于 **钉钉知识库（DingTalk Wiki / Docs）读写** 的 MCP Server。  
**English**: An MCP server for **reading and writing DingTalk Wiki / Docs**.

> This project exists as a practical complement to DingTalk's official MCP offering.  
> **The official DingTalk MCP does not provide Wiki read/write capabilities**, so this open-source project fills that gap.

---

## 背景 / Background

### 中文
钉钉官方提供了 MCP 相关能力，但在实际使用中，**知识库（Wiki / Docs）读写并没有被完整覆盖**。如果你希望让 AI Agent 或 MCP Client 直接：

- 列出知识库空间
- 浏览知识库目录/文档节点
- 创建文档、表格、脑图、文件夹
- 查询组织架构和用户信息

那么官方能力并不够用。

**dingtalk-wiki-mcp** 就是为这个场景补上的一个开源实现：
它专注于把钉钉 Wiki / Docs 能力通过 MCP 暴露出来，方便接入 OpenClaw、mcporter 或其他 MCP-compatible clients。

### English
DingTalk provides official MCP-related capabilities, but in practice, **Wiki / Docs read-write workflows are not fully covered**.

If you want an AI agent or MCP client to:

- list Wiki workspaces
- browse folders and document nodes
- create docs, spreadsheets, mind maps, and folders
- query departments and user info

then the official offering is not enough.

**dingtalk-wiki-mcp** is an open-source supplement built for that gap. It exposes DingTalk Wiki / Docs functionality through MCP so it can be used by OpenClaw, mcporter, or any other MCP-compatible client.

---

## 项目定位 / Positioning

### 中文
这个项目不是为了替代钉钉官方 MCP，而是作为它的**补充模块**：

- 官方 MCP 负责官方已覆盖的能力
- 本项目补充 **知识库读写能力**
- 你可以单独使用它，也可以和官方 MCP 一起使用

### English
This project is **not** intended to replace DingTalk's official MCP. It is designed as a **complementary extension**:

- the official MCP covers what it already supports
- this project adds **Wiki / Docs read-write support**
- you can use it standalone or alongside the official DingTalk MCP

---

## 功能特性 / Features

### Wiki / Docs
- List Wiki workspaces
- Get workspace details
- List Wiki nodes (folders / docs)
- Create Wiki docs:
  - `DOC`
  - `WORKBOOK`
  - `MIND`
  - `FOLDER`
- Search Wiki by linking users to DingTalk search

### Organization
- List departments
- List department users
- Get user info

### Config / Operator
- Set current operator (`unionId`)
- Show current config
- Use a default operator from local config

---

## 适用场景 / Use Cases

### 中文
适合以下场景：

- 给 AI Agent 增加钉钉知识库访问能力
- 在企业内部知识库中自动创建文档
- 结合工作流/自动化系统批量生成钉钉文档
- 让 MCP Client 直接读取知识库结构，辅助导航与整理

### English
Useful when you want to:

- give an AI agent access to DingTalk Wiki
- create documents in DingTalk automatically
- integrate DingTalk Docs into workflow automation
- let MCP clients inspect and navigate knowledge-base structures

---

## 要求 / Requirements

- Node.js 18+
- A DingTalk app with the required API permissions
- An MCP-compatible client, such as:
  - OpenClaw
  - mcporter
  - other MCP hosts / clients

---

## 快速开始 / Quick Start

### 1) Install

```bash
npm install
```

### 2) Prepare environment variables

```bash
cp .env.example .env
```

Required:

```env
DINGTALK_APP_KEY=your-app-key
DINGTALK_APP_SECRET=your-app-secret
```

Optional:

```env
DINGTALK_WIKI_CONFIG_PATH=/absolute/path/to/config.json
```

If `DINGTALK_WIKI_CONFIG_PATH` is not set, the server reads `./config.json` next to `index.js`.

### 3) Prepare config

```bash
cp config.example.json config.json
```

Example:

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

### 4) Run

```bash
npm start
```

Or:

```bash
node index.js
```

---

## 示例 / Example Usage

### Show config

```bash
mcporter call dingtalk-wiki.show_config
```

### List workspaces

```bash
mcporter call dingtalk-wiki.list_wiki_workspaces
```

### List nodes in a workspace

```bash
mcporter call dingtalk-wiki.list_wiki_nodes workspace_id="your_workspace_id"
```

### Create a document

```bash
mcporter call dingtalk-wiki.create_wiki_doc \
  workspace_id="your_workspace_id" \
  name="New Document" \
  doc_type="DOC"
```

### Get user info

```bash
mcporter call dingtalk-wiki.get_user_info userid="your_user_id"
```

---

## 可用工具 / Available MCP Tools

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

## 权限说明 / Permissions

Depending on what you use, your DingTalk app may need permissions such as:

- `Document.WorkspaceDocument.Write`
- Wiki read permissions
- Department read permissions
- User read permissions

Please refer to the DingTalk Open Platform documentation for the latest permission names and approval requirements.

---

## 安全说明 / Security Notes

### 中文
- `config.json` 包含你的本地用户和 workspace 配置，**不要提交到 Git 仓库**
- 仓库里已经默认忽略 `config.json` 和 `.env`
- 建议把 AppKey / AppSecret 通过环境变量注入，而不是写死到代码里

### English
- `config.json` contains your local user and workspace metadata, so **do not commit it**
- this repository already ignores `config.json` and `.env`
- inject AppKey / AppSecret via environment variables instead of hardcoding them

---

## 限制 / Limitations

### 中文
- 本项目是社区补充实现，不是钉钉官方项目
- 某些 API 需要企业侧权限审批
- `search_wiki` 当前更偏向“跳转辅助”，而不是完整全文检索实现

### English
- This is a community-maintained complement, not an official DingTalk project
- some APIs require enterprise approval on the DingTalk side
- `search_wiki` is currently more of a search-entry helper than a full-text search implementation

---

## 相关链接 / Related Links

- [DingTalk Open Platform - Knowledge Base Overview](https://open.dingtalk.com/document/development/knowledge-base-overview)
- [Create Team Space Document](https://open.dingtalk.com/document/development/create-team-space-document)

---

## License

MIT
