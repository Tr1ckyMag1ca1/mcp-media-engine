import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './logger.js';
import { MediaEngineClient } from './client.js';
import { registerTools } from './tools.js';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main(): Promise<void> {
  const baseUrl = getRequiredEnv('MEDIAENGINE_BASE_URL');
  const apiKey = getRequiredEnv('MEDIAENGINE_API_KEY');

  const client = new MediaEngineClient({ baseUrl, apiKey });

  const server = new Server(
    { name: 'mcp-media-engine', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('MCP server running on stdio', { service: 'mcp-server' });
}

main().catch((err) => {
  logger.error('MCP server failed to start', { err: String(err) });
  process.exit(1);
});
