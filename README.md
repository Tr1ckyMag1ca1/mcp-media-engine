# mcp-media-engine

MCP server for [MediaEngine](https://github.com/Tr1ckyMag1ca1/MediaEngine) — AI-powered image, audio, and video generation for Claude, Cursor, and other MCP clients.

## Tools

| Tool | Description |
|------|-------------|
| `generate_image` | Generate images from text prompts — full model catalog (Nano Banana, GPT-Image) |
| `generate_article_hero_image` | Hero banner for blog posts and articles |
| `generate_email_header_image` | Header image for marketing emails |
| `generate_social_teaser_image` | Social media graphics for LinkedIn, Twitter, Instagram |
| `generate_video` | AI video generation with provider-specific params |
| `generate_article_teaser_video` | Short teaser videos from article content |
| `generate_audio` | Text-to-speech synthesis |
| `generate_article_narration` | Audio narration for articles and blog posts |
| `wait_for_job` | Poll until a media job completes |
| `get_job_status` | Check status of a media job |
| `list_jobs` | List media jobs with filtering and pagination |

## Installation

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mediaengine": {
      "command": "npx",
      "args": ["-y", "mcp-media-engine"],
      "env": {
        "MEDIAENGINE_BASE_URL": "https://your-mediaengine-instance.com",
        "MEDIAENGINE_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor

Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mediaengine": {
      "command": "npx",
      "args": ["-y", "mcp-media-engine"],
      "env": {
        "MEDIAENGINE_BASE_URL": "https://your-mediaengine-instance.com",
        "MEDIAENGINE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Configuration

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `MEDIAENGINE_BASE_URL` | Yes | Your MediaEngine API base URL |
| `MEDIAENGINE_API_KEY` | Yes | Your MediaEngine API key |
| `LOG_LEVEL` | No | Log level (debug, info, warn, error). Default: info |

## Quality Tiers

| Tier | Model | Description |
|------|-------|-------------|
| `basic` | Nano Banana | Fast and affordable |
| `standard` | Nano Banana | Balanced quality (default) |
| `premium` | GPT-Image | Highest quality — clean text rendering |

## License

MIT
