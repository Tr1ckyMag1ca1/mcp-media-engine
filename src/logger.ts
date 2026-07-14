type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ??
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMsg(level: LogLevel, msg: string, data?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const base = { level, time: ts, service: 'mcp-media-engine', ...(data ?? {}) };
  return `${ts} [${level.toUpperCase()}] ${msg}${Object.keys(data ?? {}).length ? ` ${JSON.stringify(data)}` : ''}`;
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => {
    if (shouldLog('debug')) console.error(formatMsg('debug', msg, data));
  },
  info: (msg: string, data?: Record<string, unknown>) => {
    if (shouldLog('info')) console.error(formatMsg('info', msg, data));
  },
  warn: (msg: string, data?: Record<string, unknown>) => {
    if (shouldLog('warn')) console.error(formatMsg('warn', msg, data));
  },
  error: (msg: string | { err?: unknown }, data?: Record<string, unknown>) => {
    if (typeof msg === 'object') {
      console.error(formatMsg('error', 'Error', { err: String(msg.err), ...data }));
    } else {
      console.error(formatMsg('error', msg, data));
    }
  },
};
