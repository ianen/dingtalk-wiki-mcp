# dingtalk-wiki-mcp

An MCP server for **reading and writing DingTalk Wiki / Docs**.

[中文说明 / Chinese documentation](./README.zh-CN.md)

> This project exists as a practical complement to DingTalk's official MCP offering.
> **The official DingTalk MCP does not provide Wiki read/write capabilities**, so this open-source project fills that gap.

---

## Background

DingTalk provides official MCP-related capabilities, but in practice, **Wiki / Docs read-write workflows are not fully covered**.

If you want an AI agent or MCP client to:

- list Wiki workspaces
- browse folders and document nodes
- create docs, spreadsheets, mind maps, and folders
- query departments and user info

then the official offering is not enough.

**dingtalk-wiki-mcp** is an open-source supplement built for that gap. It exposes DingTalk Wiki / Docs functionality through MCP so it can be used by OpenClaw, mcporter, or any other MCP-compatible client.

---

## Positioning

This project is **not** intended to replace DingTalk's official MCP. It is designed as a **complementary extension**:

- the official MCP covers what it already supports
- this project adds **Wiki / Docs read-write support**
- you can use it standalone or alongside the official DingTalk MCP

---

## Features

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

### Skill included
This repository also includes an **OpenClaw / agent skill definition**:

- `SKILL.md`

That means the project can be used not only as a standalone MCP server, but also as a reusable skill package in agent-based workflows.

---

## Use Cases

Useful when you want to:

- give an AI agent access to DingTalk Wiki
- create documents in DingTalk automatically
- integrate DingTalk Docs into workflow automation
- let MCP clients inspect and navigate knowledge-base structures
- reuse the project as a skill-based building block in OpenClaw-style agent setups

---

## Requirements

- Node.js 18+
- A DingTalk app with the required API permissions
- An MCP-compatible client, such as:
  - OpenClaw
  - mcporter
  - other MCP hosts / clients

---

## Quick Start

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

## Example Usage

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

## Available MCP Tools

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

## Permissions

Depending on what you use, your DingTalk app may need permissions such as:

- `Document.WorkspaceDocument.Write`
- Wiki read permissions
- Department read permissions
- User read permissions

Please refer to the DingTalk Open Platform documentation for the latest permission names and approval requirements.

---

## Security Notes

- `config.json` contains your local user and workspace metadata, so **do not commit it**
- this repository already ignores `config.json` and `.env`
- inject AppKey / AppSecret via environment variables instead of hardcoding them

---

## Limitations

- This is a community-maintained complement, not an official DingTalk project
- some APIs require enterprise approval on the DingTalk side
- `search_wiki` is currently more of a search-entry helper than a full-text search implementation

---

## Related Links

- [DingTalk Open Platform - Knowledge Base Overview](https://open.dingtalk.com/document/development/knowledge-base-overview)
- [Create Team Space Document](https://open.dingtalk.com/document/development/create-team-space-document)

---

## License

MIT
