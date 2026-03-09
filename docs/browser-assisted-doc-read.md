# Browser-assisted normal document read

This helper covers a gap that still exists today:

- you can already browse workspaces and nodes with the MCP server
- but normal DingTalk document body export is still not available through the public OpenAPI used by this project

The bundled script provides a practical workaround by using a **locally logged-in browser session**.

## Command

```bash
npm run read:doc -- --url "https://alidocs.dingtalk.com/i/nodes/<dentryUuid>" --output ./tmp/doc.md
```

You can also pass the UUID directly:

```bash
npm run read:doc -- --dentry-uuid "<dentryUuid>" --output ./tmp/doc.md
```

## What the script does

1. Launches or reuses a local Edge browser with remote debugging enabled
2. Opens the target Alidocs page
3. Waits for DingTalk web login if needed
4. Calls authenticated internal Alidocs endpoints
5. Renders the document body to Markdown
6. Saves the result locally

## Arguments

- `--url`: full Alidocs node URL
- `--dentry-uuid`: node / dentry UUID from the Alidocs URL
- `--output`: output Markdown path

## Optional environment variables

- `DINGTALK_EDGE_PATH`: custom Edge executable path
- `DINGTALK_BROWSER_PORT`: remote debugging port, default `9222`
- `DINGTALK_BROWSER_USER_DATA_DIR`: custom browser profile dir
- `DINGTALK_LOGIN_WAIT_MS`: login wait timeout in milliseconds

## Important notes

- This path depends on a browser login session
- It is **not** an official public API workflow
- It is meant as an experimental export / sync helper
- Notable / `.able` tables should still use the official API tools already included in this repo
