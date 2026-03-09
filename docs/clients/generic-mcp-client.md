# Generic MCP Client Example

Many MCP clients support stdio-based servers with a configuration block similar to this:

```json
{
  "mcpServers": {
    "dingtalk-wiki": {
      "command": "node",
      "args": ["/absolute/path/to/dingtalk-wiki-mcp/index.js"],
      "env": {
        "DINGTALK_APP_KEY": "your-app-key",
        "DINGTALK_APP_SECRET": "your-app-secret"
      }
    }
  }
}
```

If your client supports environment-file injection, you can also keep secrets in `.env` instead of embedding them directly.
