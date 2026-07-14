import { TOOLS, handleToolCall } from './tools.js';
import { MediaEngineClient } from './client.js';
import type { Env } from './types.js';

const API_BASE_URL = 'https://api.mcpmediaengine.com';
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function getClientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') ||
         request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         'unknown';
}

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (now > entry.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

function extractApiKey(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7);
  }

  const url = new URL(request.url);
  const key = url.searchParams.get('api_key');
  if (key) {
    return key;
  }

  return null;
}

function jsonRpcError(code: number, message: string, id?: unknown): Record<string, unknown> {
  return {
    jsonrpc: '2.0',
    error: { code, message },
    ...(id !== undefined && { id }),
  };
}

function jsonRpcResult(result: unknown, id?: unknown): Record<string, unknown> {
  return {
    jsonrpc: '2.0',
    result,
    ...(id !== undefined && { id }),
  };
}

async function handleMcpRequest(body: Record<string, unknown>, apiKey: string | null): Promise<Record<string, unknown>> {
  const method = body.method as string | undefined;
  const params = body.params as Record<string, unknown> | undefined;
  const id = body.id;

  if (!method) {
    return jsonRpcError(-32600, 'Invalid Request', id);
  }

  try {
    switch (method) {
      case 'initialize': {
        return jsonRpcResult({
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'mediaengine-mcp',
            version: '1.0.0',
          },
        }, id);
      }

      case 'resources/list': {
        return jsonRpcResult({
          resources: [],
        }, id);
      }

      case 'tools/list': {
        return jsonRpcResult({
          tools: TOOLS,
        }, id);
      }

      case 'tools/call': {
        if (!apiKey) {
          return jsonRpcError(-32001, 'Configure MEDIAENGINE_API_KEY to use tools', id);
        }

        const toolName = params?.name as string | undefined;
        const toolArgs = params?.arguments as Record<string, unknown> | undefined;

        if (!toolName) {
          return jsonRpcError(-32600, 'Tool name required', id);
        }

        const client = new MediaEngineClient({
          baseUrl: API_BASE_URL,
          apiKey,
          timeoutMs: 30000,
        });

        try {
          const result = await handleToolCall(toolName, toolArgs || {}, client);
          return jsonRpcResult({
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          }, id);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          return jsonRpcError(-32000, errorMsg, id);
        }
      }

      default:
        return jsonRpcError(-32601, `Method not found: ${method}`, id);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return jsonRpcError(-32000, errorMsg, id);
  }
}

async function handleStreamableHttpRequest(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'POST required' }),
      { status: 405, headers: { 'content-type': 'application/json' } }
    );
  }

  const apiKey = extractApiKey(request);
  const clientIp = getClientIp(request);

  if (!apiKey && !checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify(jsonRpcError(-32099, 'Rate limit exceeded for unauthenticated requests')),
      {
        status: 429,
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const response = await handleMcpRequest(body, apiKey);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
        },
      }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify(jsonRpcError(-32000, errorMsg)),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/health') {
    return new Response(
      JSON.stringify({ status: 'ok' }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  if (path === '/mcp') {
    return handleStreamableHttpRequest(request);
  }

  return new Response(
    JSON.stringify({ error: 'Not found' }),
    { status: 404, headers: { 'content-type': 'application/json' } }
  );
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
