# FAQ

## Is this an official DingTalk project?

No. This is a community-maintained open-source project.

## What gap does it fill?

It fills the **Wiki / Docs read-write gap** left by DingTalk's official MCP offering.

## Can it replace DingTalk official MCP?

No. The intended positioning is **complementary**, not replacement.

## What can it do today?

- list Wiki workspaces
- browse nodes
- create docs / workbooks / mind maps / folders
- query departments and users

## Does it require DingTalk permissions?

Yes. Your DingTalk app must have the relevant permissions approved on the DingTalk side.

## What is `operator_id`?

It is the DingTalk `unionId` used as the acting user for Wiki operations.

## Can I use it with OpenClaw?

Yes. This repository includes `SKILL.md`, so it can be used as a reusable skill package in agent workflows.

## Can I use it with mcporter or other MCP clients?

Yes. The server runs over stdio and can be launched by MCP-compatible clients.

## Can I run it with `npx dingtalk-wiki-mcp`?

Not yet by default, unless the package is published to npm. The repository already has a CLI entry (`bin`), so npm publishing can be added later.
