# dingtalk-wiki-mcp

A reusable MCP server for reading and writing DingTalk Wiki content.

This project exposes DingTalk Wiki operations through the Model Context Protocol (MCP), so MCP-compatible clients can browse workspaces, inspect nodes, create docs, and query organization data.

## Features

- List wiki workspaces
- Get workspace details
- List wiki nodes (folders / docs)
- Create wiki docs (`DOC`, `WORKBOOK`, `MIND`, `FOLDER`)
- Search wiki by linking users to DingTalk search
- List departments
- List department users
- Get user info
- Set default operator / inspect config

## Requirements

- Node.js 18+
- A DingTalk app with the required API permissions
- MCP-compatible client (for example, mcporter or other MCP hosts)

## Environment Variables

Create a `.env` file from `.env.example`:

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

If `DINGTALK_WIKI_CONFIG_PATH` is not set, the server will read `./config.json` next to `index.js`.

## Config File

Copy the example config:

```bash
cp config.example.json config.json
```

Then fill in your own user and workspace metadata.

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

## Install

```bash
npm install
```

## Run

```bash
npm start
```

Or directly:

```bash
node index.js
```

## Example Usage

### Show config

```bash
mcporter call dingtalk-wiki.show_config
```

### List workspaces

```bash
mcporter call dingtalk-wiki.list_wiki_workspaces
```

### List nodes

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

## Permissions

Depending on which tools you use, your DingTalk app may need permissions such as:

- `Document.WorkspaceDocument.Write`
- Wiki read permissions
- Department / user read permissions

Check DingTalk Open Platform docs for the latest permission names and approval requirements.

## Notes

- `operator_id` uses DingTalk `unionId`.
- If no operator is passed, the server tries to use the configured default user.
- `config.json` is intentionally gitignored so your local identifiers do not get committed.

## License

MIT
