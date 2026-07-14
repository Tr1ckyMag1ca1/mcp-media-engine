import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface Config {
  apiKey?: string;
  baseUrl?: string;
}

const CONFIG_DIR = join(homedir(), '.mediaengine');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export function loadConfig(): Config {
  const fromEnv: Config = {};
  if (process.env['MEDIAENGINE_API_KEY']) fromEnv.apiKey = process.env['MEDIAENGINE_API_KEY'];
  if (process.env['MEDIAENGINE_BASE_URL']) fromEnv.baseUrl = process.env['MEDIAENGINE_BASE_URL'];

  let fromFile: Config = {};
  if (existsSync(CONFIG_PATH)) {
    try {
      fromFile = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as Config;
    } catch {
      // ignore parse errors
    }
  }

  return { ...fromFile, ...fromEnv };
}

export function saveConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export function resolveApiKey(): string | undefined {
  return loadConfig().apiKey;
}

export function resolveBaseUrl(): string {
  return loadConfig().baseUrl ?? 'https://api.mcpmediaengine.com';
}
