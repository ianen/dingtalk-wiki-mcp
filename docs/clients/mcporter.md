# mcporter Example

Use the server directly over stdio:

```bash
mcporter call --stdio "node /absolute/path/to/dingtalk-wiki-mcp/index.js" dingtalk-wiki.list_wiki_workspaces
```

You can also call a specific tool with args:

```bash
mcporter call --stdio "node /absolute/path/to/dingtalk-wiki-mcp/index.js" dingtalk-wiki.create_wiki_doc workspace_id="your_workspace_id" name="Weekly Summary"
```

Before calling, make sure these environment variables are available to the process:

```bash
export DINGTALK_APP_KEY=your-app-key
export DINGTALK_APP_SECRET=your-app-secret
```
