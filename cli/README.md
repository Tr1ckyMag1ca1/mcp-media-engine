# mediaengine

**MCP image generation and video generation CLI for Claude, Cursor, and terminal workflows.**

Generate images and videos from the command line, and get copy-paste MCP config snippets for Claude Desktop, Claude Code, Paperclip, and OpenClaw in one command.

```
npm install -g mediaengine
media-engine setup
media-engine mcp-config
```

## Why this CLI?

- **Terminal-first**: Claude Code, Cursor, and other agent tools live in the terminal. This CLI meets you there.
- **One command to MCP**: `media-engine mcp-config` prints ready-made config blocks for every major AI client — copy, paste, done.
- **Test before you commit**: `media-engine test` validates your API key and generates a real image before you wire up any integrations.

## Installation

```bash
npm install -g mediaengine
```

Requires Node.js ≥ 20.

## Quick start

```bash
# 1. Configure your API key
media-engine setup

# 2. Generate a test image to confirm everything works
media-engine test

# 3. Get MCP config snippets for your AI client
media-engine mcp-config
```

Get an API key at [mcpmediaengine.com/dashboard](https://mcpmediaengine.com/dashboard).

## Commands

### `media-engine generate-image`

Generate an image from a text prompt.

```bash
media-engine generate-image --prompt "A mountain lake at dawn, photorealistic"
media-engine generate-image --prompt "Abstract geometric art" --wait
media-engine generate-image --prompt "City skyline at night" --provider dalle3 --wait --json
```

**Options:**

| Flag | Description |
|---|---|
| `--prompt <text>` | Image description (required) |
| `--provider <name>` | Provider override (`dalle3`, `stability-ai`, etc.) |
| `--wait` | Wait for job completion and print the output URL |
| `--json` | Output raw JSON |

### `media-engine generate-video`

Generate a short video from a text prompt.

```bash
media-engine generate-video --prompt "Ocean waves crashing on a rocky shore" --wait
```

**Options:**

| Flag | Description |
|---|---|
| `--prompt <text>` | Video description (required) |
| `--provider <name>` | Provider override |
| `--wait` | Wait for job completion and print the output URL |
| `--json` | Output raw JSON |

### `media-engine mcp-config`

Print ready-made MCP server config blocks for all major AI clients.

```bash
# Show all platforms
media-engine mcp-config

# Show a single platform
media-engine mcp-config --platform claude-desktop
media-engine mcp-config --platform claude-code
media-engine mcp-config --platform paperclip
media-engine mcp-config --platform openclaw
```

Sets `MEDIAENGINE_API_KEY` automatically if `media-engine setup` has been run.

#### Claude Desktop

Add the printed JSON to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows).

#### Claude Code

Run the printed `claude mcp add` command in your terminal.

### `media-engine test`

Validate connectivity and generate a real sample image from a built-in test prompt.

```bash
media-engine test
```

Exits with code 0 on success, 1 on failure.

### `media-engine setup`

Interactive wizard that saves your API key (and optional base URL override) to `~/.mediaengine/config.json`.

```bash
media-engine setup
```

You can also set credentials via environment variables — they take precedence over the config file:

```bash
export MEDIAENGINE_API_KEY=me_live_...
export MEDIAENGINE_BASE_URL=https://api.mcpmediaengine.com  # optional
```

## MCP integration

MediaEngine is an [MCP](https://modelcontextprotocol.io/) server. Once configured, Claude and other MCP clients can generate images and videos directly from conversation.

**Available MCP tools:**

- `generate_article_hero_image` — hero image for a blog post or article
- `generate_email_header_image` — marketing email header banner
- `generate_social_teaser_image` — social media teaser image
- `generate_article_teaser_video` — short teaser video for an article
- `generate_article_narration` — audio narration of article content
- `get_job_status` — check job status by ID
- `list_jobs` — list recent jobs

Run `media-engine mcp-config` for the exact config block to paste into your AI client.

## Links

- [Documentation](https://mcpmediaengine.com/docs)
- [Dashboard & API keys](https://mcpmediaengine.com/dashboard)
- [MCP server package (`mcp-media-engine`)](https://www.npmjs.com/package/mcp-media-engine)
- [TypeScript SDK (`@mediaengine/client`)](https://www.npmjs.com/package/@mediaengine/client)
