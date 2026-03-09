# OpenClaw Example

This repository includes a `SKILL.md`, so it can be used as a reusable skill package in OpenClaw-style agent workflows.

## Option 1: use as a skill package

1. Place the repository in a skill-accessible directory.
2. Install dependencies:

```bash
npm install
```

3. Provide environment variables:

```bash
export DINGTALK_APP_KEY=your-app-key
export DINGTALK_APP_SECRET=your-app-secret
```

4. Let your OpenClaw agent discover and use the skill.

## Option 2: use as a local MCP server

If your OpenClaw setup supports stdio MCP backends, point it to:

```bash
node /absolute/path/to/dingtalk-wiki-mcp/index.js
```

The exact wiring may vary by your OpenClaw setup and version, but the server itself is stdio-compatible and packaged for reuse.
