# Monday.com MCP setup

Connect Cursor to your monday.com workspace so agents can read boards, create items, update columns, and more.

## Quick setup (recommended)

1. Open **Cursor Settings** → **Tools & MCP** (`Ctrl+Shift+J` / `Cmd+Shift+J`)
2. Confirm **monday-mcp** appears (from `.cursor/mcp.json` in this repo)
3. Click **Connect** / **Authenticate** when prompted
4. Authorize monday.com via OAuth in the browser
5. Test: ask the agent **"List my monday.com boards"**

Alternatively, install the verified **monday.com** plugin from the [Cursor Marketplace](https://cursor.com/marketplace).

## Project config

This repo includes `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "monday-mcp": {
      "url": "https://mcp.monday.com/mcp",
      "headers": {
        "Api-Version": "2026-07"
      }
    }
  }
}
```

## Prerequisites

- Active monday.com account with board access
- **AI Connectors** enabled by your admin: Admin → Permissions → AI Connectors
- OAuth consent when Cursor prompts you

## Cloud Agents

For [cursor.com/agents](https://cursor.com/agents):

1. Go to **Dashboard → Integrations & MCP**
2. Add the monday.com HTTP MCP server: `https://mcp.monday.com/mcp`
3. Complete OAuth for your account
4. Enable the server for your cloud agent runs

MCP is **not** configured via `.cursor/environment.json` — use Dashboard MCP settings or `.cursor/mcp.json` (desktop).

## Example prompts

- "List my monday.com boards"
- "Create an item on board X titled 'Review budget'"
- "Show items in the Sprint board with status Stuck"
- "Update the due date on item 12345 to next Friday"

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Authorization failed | Ask admin to enable AI Connectors |
| Tools not appearing | Enable monday-mcp in Cursor MCP settings |
| Connection timeout | Check firewall / corporate proxy |
| Permissions error | Verify your monday.com role on the board |

## Resources

- [Connect monday MCP with Cursor](https://support.monday.com/hc/en-us/articles/28583674426898-Connect-monday-MCP-with-Cursor)
- [Platform MCP overview](https://developer.monday.com/api-reference/docs/monday-mcp-overview)
