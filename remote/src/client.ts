import type { JobListParams, ApiClientConfig } from './types.js';

export class MediaEngineClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.headers = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  async createJob(type: string, inputParams: Record<string, unknown>, provider?: string, model?: string): Promise<unknown> {
    const body: Record<string, unknown> = { type, inputParams };
    if (provider !== undefined) body['provider'] = provider;
    if (model !== undefined) body['model'] = model;
    return this.request('POST', '/api/jobs', body);
  }

  async getJob(jobId: string): Promise<unknown> {
    return this.request('GET', `/api/jobs/${encodeURIComponent(jobId)}`);
  }

  async waitForJob(jobId: string, timeoutMs = 300_000, intervalMs = 3_000): Promise<unknown> {
    const deadline = Date.now() + timeoutMs;
    let lastStatus = 'unknown';
    while (true) {
      const job = await this.getJob(jobId);
      const status =
        ((job as { data?: { status?: string } }).data?.status) ??
        ((job as { status?: string }).status) ??
        'unknown';
      lastStatus = status;
      if (status === 'done' || status === 'failed') return job;
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await new Promise<void>((resolve) => setTimeout(resolve, Math.min(intervalMs, remaining)));
    }
    throw new Error(`timeout: job ${jobId} still '${lastStatus}' after ${timeoutMs}ms`);
  }

  async listJobs(params: JobListParams = {}): Promise<unknown> {
    const qs = new URLSearchParams();
    if (params.cursor !== undefined) qs.set('cursor', params.cursor);
    if (params.limit !== undefined) qs.set('limit', String(params.limit));
    if (params.page !== undefined) qs.set('page', String(params.page));
    if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
    if (params.status !== undefined) qs.set('status', params.status);
    if (params.type !== undefined) qs.set('type', params.type);
    if (params.createdAfter !== undefined) qs.set('createdAfter', params.createdAfter);
    if (params.createdBefore !== undefined) qs.set('createdBefore', params.createdBefore);
    if (params.sort !== undefined) qs.set('sort', params.sort);
    if (params.order !== undefined) qs.set('order', params.order);
    const query = qs.toString();
    return this.request('GET', `/api/jobs${query ? `?${query}` : ''}`);
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const init: RequestInit = {
      method,
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeoutMs),
    };
    if (body !== undefined) init.body = JSON.stringify(body);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, init);
      const json = await res.json();
      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return json;
    } catch (err) {
      if (err instanceof TypeError && err.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }
}
