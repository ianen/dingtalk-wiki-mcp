# mcporter Example

## Direct stdio mode

Use the server directly over stdio. In this mode, call the tool names directly:

```bash
mcporter call --stdio "node /absolute/path/to/dingtalk-wiki-mcp/index.js" show_config
mcporter call --stdio "node /absolute/path/to/dingtalk-wiki-mcp/index.js" list_wiki_workspaces
mcporter call --stdio "node /absolute/path/to/dingtalk-wiki-mcp/index.js" create_wiki_doc workspace_id="your_workspace_id" name="Weekly Summary"
```

## Registered server mode

If you registered the server under the name `dingtalk-wiki`, then use namespaced calls:

```bash
mcporter call dingtalk-wiki.show_config
mcporter call dingtalk-wiki.list_wiki_workspaces
mcporter call dingtalk-wiki.create_wiki_doc workspace_id="your_workspace_id" name="Weekly Summary"
```

## Environment setup

You can either export variables before calling:

```bash
export DINGTALK_APP_KEY=your-app-key
export DINGTALK_APP_SECRET=your-app-secret
```

Or keep them in a local `.env` file next to the repository, which `index.js` now auto-loads.
