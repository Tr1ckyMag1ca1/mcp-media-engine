#!/usr/bin/env node
import { generateImage } from './commands/generate-image.js';
import { generateVideo } from './commands/generate-video.js';
import { mcpConfig } from './commands/mcp-config.js';
import { runTest } from './commands/test.js';
import { runSetup } from './commands/setup.js';
import { print, printErr, fmt } from './lib/output.js';

const VERSION = '0.1.0';

function parseFlags(args: string[]): { flags: Record<string, string | boolean>; positional: string[] } {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i] ?? '';
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

function printHelp(): void {
  print(`
${fmt.bold('media-engine')} — MediaEngine CLI v${VERSION}

${fmt.bold('Usage:')}
  media-engine <command> [options]

${fmt.bold('Commands:')}
  ${fmt.cyan('generate-image')}   Generate an image from a text prompt
  ${fmt.cyan('generate-video')}   Generate a video from a text prompt
  ${fmt.cyan('mcp-config')}       Print MCP config blocks for Claude Desktop, Claude Code, Paperclip, OpenClaw
  ${fmt.cyan('test')}             Validate connectivity and generate a sample image
  ${fmt.cyan('setup')}            Interactive API key setup

${fmt.bold('Options:')}
  --help, -h        Show help
  --version, -v     Print version

${fmt.bold('Examples:')}
  media-engine setup
  media-engine generate-image --prompt "A mountain lake at dawn"
  media-engine generate-image --prompt "A futuristic city" --wait
  media-engine generate-video --prompt "Ocean waves in slow motion" --wait
  media-engine mcp-config
  media-engine mcp-config --platform claude-desktop
  media-engine test
`);
}

function printGenerateImageHelp(): void {
  print(`
${fmt.bold('media-engine generate-image')}

${fmt.bold('Usage:')}
  media-engine generate-image --prompt <text> [options]

${fmt.bold('Options:')}
  --prompt <text>     Image description (required)
  --provider <name>   Provider override (e.g. dalle3, stability-ai)
  --wait              Wait for job to complete and print output URL
  --json              Output raw JSON
`);
}

function printGenerateVideoHelp(): void {
  print(`
${fmt.bold('media-engine generate-video')}

${fmt.bold('Usage:')}
  media-engine generate-video --prompt <text> [options]

${fmt.bold('Options:')}
  --prompt <text>     Video description (required)
  --provider <name>   Provider override
  --wait              Wait for job to complete and print output URL
  --json              Output raw JSON
`);
}

function printMcpConfigHelp(): void {
  print(`
${fmt.bold('media-engine mcp-config')}

${fmt.bold('Usage:')}
  media-engine mcp-config [options]

${fmt.bold('Options:')}
  --platform <name>   Show config for one platform only
                      Options: claude-desktop, claude-code, paperclip, openclaw
`);
}

async function main(): Promise<void> {
  const [, , command, ...rest] = process.argv;

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === '--version' || command === '-v') {
    print(VERSION);
    return;
  }

  const { flags, positional } = parseFlags(rest);

  if (flags['help'] || flags['h']) {
    switch (command) {
      case 'generate-image': printGenerateImageHelp(); return;
      case 'generate-video': printGenerateVideoHelp(); return;
      case 'mcp-config': printMcpConfigHelp(); return;
      default: printHelp(); return;
    }
  }

  switch (command) {
    case 'generate-image': {
      const prompt = typeof flags['prompt'] === 'string' ? flags['prompt'] : positional[0];
      if (!prompt) {
        printErr(fmt.error('--prompt is required'));
        printGenerateImageHelp();
        process.exit(1);
      }
      await generateImage({
        prompt,
        provider: typeof flags['provider'] === 'string' ? flags['provider'] : undefined,
        wait: flags['wait'] === true,
        json: flags['json'] === true,
      });
      break;
    }

    case 'generate-video': {
      const prompt = typeof flags['prompt'] === 'string' ? flags['prompt'] : positional[0];
      if (!prompt) {
        printErr(fmt.error('--prompt is required'));
        printGenerateVideoHelp();
        process.exit(1);
      }
      await generateVideo({
        prompt,
        provider: typeof flags['provider'] === 'string' ? flags['provider'] : undefined,
        wait: flags['wait'] === true,
        json: flags['json'] === true,
      });
      break;
    }

    case 'mcp-config': {
      mcpConfig({
        platform: typeof flags['platform'] === 'string' ? flags['platform'] : undefined,
      });
      break;
    }

    case 'test': {
      await runTest();
      break;
    }

    case 'setup': {
      await runSetup();
      break;
    }

    default: {
      printErr(fmt.error(`Unknown command: ${command}`));
      print('Run `media-engine --help` for usage.');
      process.exit(1);
    }
  }
}

main().catch((err) => {
  printErr(fmt.error(`Unexpected error: ${String(err)}`));
  process.exit(1);
});
