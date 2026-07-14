import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { loadConfig, saveConfig } from '../lib/config.js';
import { print, fmt } from '../lib/output.js';

export async function runSetup(): Promise<void> {
  print(fmt.header('MediaEngine Setup'));
  print('This wizard saves your API key to ~/.mediaengine/config.json\n');

  const current = loadConfig();

  const rl = readline.createInterface({ input, output });

  try {
    const currentKeyHint = current.apiKey
      ? ` (current: ${current.apiKey.slice(0, 8)}…)`
      : '';
    const apiKey = (
      await rl.question(
        `${fmt.bold('API key')}${currentKeyHint} [get one at https://mcpmediaengine.com/dashboard]: `,
      )
    ).trim();

    if (!apiKey && !current.apiKey) {
      print(fmt.warn('No API key provided. Setup cancelled.'));
      return;
    }

    const currentUrlHint = current.baseUrl ? ` (current: ${current.baseUrl})` : '';
    const baseUrlInput = (
      await rl.question(
        `${fmt.bold('API base URL')}${currentUrlHint} [leave blank for https://api.mcpmediaengine.com]: `,
      )
    ).trim();

    const newConfig = {
      apiKey: apiKey || current.apiKey,
      baseUrl: baseUrlInput || current.baseUrl,
    };

    saveConfig(newConfig);

    print('');
    print(fmt.success('Config saved to ~/.mediaengine/config.json'));
    print('');
    print(fmt.dim('Run `media-engine test` to verify connectivity.'));
    print(fmt.dim('Run `media-engine mcp-config` to get MCP config snippets.'));
  } finally {
    rl.close();
  }
}
