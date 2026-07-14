import { print, fmt } from '../lib/output.js';
import { resolveApiKey } from '../lib/config.js';

export interface McpConfigArgs {
  platform?: string;
}

const MCP_PACKAGE = 'mcp-media-engine';

function buildEnv(apiKey: string) {
  return {
    MEDIAENGINE_API_KEY: apiKey,
  };
}

function claudeDesktopConfig(apiKey: string) {
  return {
    mcpServers: {
      mediaengine: {
        command: 'npx',
        args: ['-y', MCP_PACKAGE],
        env: buildEnv(apiKey),
      },
    },
  };
}

function claudeCodeSnippet(apiKey: string): string {
  return `claude mcp add mediaengine --command "npx -y ${MCP_PACKAGE}" --env MEDIAENGINE_API_KEY=${apiKey}`;
}

function paperclipConfig(apiKey: string) {
  return {
    name: 'mediaengine',
    command: 'npx',
    args: ['-y', MCP_PACKAGE],
    env: buildEnv(apiKey),
  };
}

function openClawConfig(apiKey: string) {
  return {
    mcpServers: {
      mediaengine: {
        command: 'npx',
        args: ['-y', MCP_PACKAGE],
        env: buildEnv(apiKey),
      },
    },
  };
}

const PLATFORMS = ['claude-desktop', 'claude-code', 'paperclip', 'openclaw'];

export function mcpConfig(args: McpConfigArgs): void {
  const apiKey = resolveApiKey() ?? 'me_live_YOUR_KEY_HERE';
  const platform = args.platform?.toLowerCase();

  if (platform && !PLATFORMS.includes(platform)) {
    print(`Unknown platform "${platform}". Valid options: ${PLATFORMS.join(', ')}`);
    process.exit(1);
  }

  const showAll = !platform;

  if (showAll || platform === 'claude-desktop') {
    print(fmt.header('Claude Desktop'));
    print('Add to ~/Library/Application Support/Claude/claude_desktop_config.json');
    print('(Windows: %APPDATA%\\Claude\\claude_desktop_config.json)\n');
    print(JSON.stringify(claudeDesktopConfig(apiKey), null, 2));
  }

  if (showAll || platform === 'claude-code') {
    print(fmt.header('Claude Code'));
    print('Run this command in your terminal:\n');
    print(`  ${claudeCodeSnippet(apiKey)}`);
  }

  if (showAll || platform === 'paperclip') {
    print(fmt.header('Paperclip'));
    print('Add to your Paperclip agent MCP config:\n');
    print(JSON.stringify(paperclipConfig(apiKey), null, 2));
  }

  if (showAll || platform === 'openclaw') {
    print(fmt.header('OpenClaw'));
    print('Add to your OpenClaw MCP config:\n');
    print(JSON.stringify(openClawConfig(apiKey), null, 2));
  }

  if (showAll) {
    print('');
    print(fmt.dim('Tip: media-engine mcp-config --platform claude-desktop   to show one platform'));
    print(fmt.dim(`Tip: set MEDIAENGINE_API_KEY to auto-fill your key`));
  }
}
