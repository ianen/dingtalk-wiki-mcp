# DingTalk Wiki API Create Document - Generic Test Notes

## Summary

This file documents the API shape used to create a DingTalk Wiki document.
All tenant-specific IDs and user identifiers have been removed from the public version.

## API Endpoint

```http
POST /v1.0/doc/workspaces/{workspaceId}/docs
```

## Request

### Headers

- `x-acs-dingtalk-access-token`: Access Token
- `Content-Type: application/json`

### Body

- `name` (string, required)
- `docType` (string, required)
  - `DOC`
  - `WORKBOOK`
  - `MIND`
  - `FOLDER`
- `operatorId` (string, required)
- `parentNodeId` (string, optional)

## Example

```bash
curl -X POST "https://api.dingtalk.com/v1.0/doc/workspaces/your_workspace_id/docs" \
  -H "x-acs-dingtalk-access-token: {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Document",
    "docType": "DOC",
    "operatorId": "your_union_id"
  }'
```

## Expected Response Shape

```json
{
  "dentryUuid": "...",
  "docKey": "...",
  "nodeId": "...",
  "url": "https://alidocs.dingtalk.com/i/team/.../docs/...",
  "workspaceId": "..."
}
```

## Required Permission

- `Document.WorkspaceDocument.Write`

## Public Repo Note

In the original private environment, this server was verified against real tenant data.
That data has been removed from the open-source copy.
