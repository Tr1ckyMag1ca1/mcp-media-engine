const isTTY = process.stdout.isTTY;

const c = {
  reset: isTTY ? '\x1b[0m' : '',
  bold: isTTY ? '\x1b[1m' : '',
  dim: isTTY ? '\x1b[2m' : '',
  green: isTTY ? '\x1b[32m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  blue: isTTY ? '\x1b[34m' : '',
  cyan: isTTY ? '\x1b[36m' : '',
  red: isTTY ? '\x1b[31m' : '',
  gray: isTTY ? '\x1b[90m' : '',
};

export const fmt = {
  success: (s: string) => `${c.green}✓${c.reset} ${s}`,
  error: (s: string) => `${c.red}✗${c.reset} ${s}`,
  info: (s: string) => `${c.blue}ℹ${c.reset} ${s}`,
  warn: (s: string) => `${c.yellow}⚠${c.reset} ${s}`,
  bold: (s: string) => `${c.bold}${s}${c.reset}`,
  dim: (s: string) => `${c.dim}${s}${c.reset}`,
  cyan: (s: string) => `${c.cyan}${s}${c.reset}`,
  gray: (s: string) => `${c.gray}${s}${c.reset}`,
  header: (s: string) => `\n${c.bold}${c.cyan}${s}${c.reset}\n`,
};

export function print(s: string): void {
  process.stdout.write(s + '\n');
}

export function printErr(s: string): void {
  process.stderr.write(s + '\n');
}

export function spinner(label: string): { stop: (final?: string) => void } {
  if (!isTTY) {
    process.stderr.write(label + '\n');
    return { stop: (final?: string) => { if (final) process.stderr.write(final + '\n'); } };
  }
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const id = setInterval(() => {
    process.stderr.write(`\r${c.cyan}${frames[i % frames.length]}${c.reset} ${label}`);
    i++;
  }, 80);
  return {
    stop: (final?: string) => {
      clearInterval(id);
      process.stderr.write('\r\x1b[2K');
      if (final) process.stderr.write(final + '\n');
    },
  };
}
