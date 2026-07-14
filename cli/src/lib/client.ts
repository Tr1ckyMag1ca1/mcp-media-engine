export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';
export type MediaType = 'image' | 'audio' | 'video';

export interface MediaJob {
  mediaJobId: string;
  type: MediaType;
  status: JobStatus;
  provider: string | null;
  inputParams: Record<string, unknown>;
  outputUrl: string | null;
  errorMessage: string | null;
  estimatedCostCents: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface DownloadUrlResult {
  url: string;
  expiresIn: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class JobFailedError extends Error {
  constructor(public readonly job: MediaJob) {
    super(job.errorMessage ?? `Job ${job.mediaJobId} failed`);
    this.name = 'JobFailedError';
  }
}

export class JobTimeoutError extends Error {
  constructor(jobId: string, timeoutMs: number) {
    super(`Job ${jobId} did not complete within ${timeoutMs / 1000}s`);
    this.name = 'JobTimeoutError';
  }
}

export class MediaEngineApiClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(apiKey: string, baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async createJob(
    type: MediaType,
    inputParams: Record<string, unknown>,
    provider?: string,
  ): Promise<MediaJob> {
    const body: Record<string, unknown> = { type, inputParams };
    if (provider !== undefined) body['provider'] = provider;
    const res = await this.post<{ data: MediaJob }>('/api/jobs', body);
    return res.data;
  }

  async getJob(jobId: string): Promise<MediaJob> {
    const res = await this.get<{ data: MediaJob }>(`/api/jobs/${encodeURIComponent(jobId)}`);
    return res.data;
  }

  async getDownloadUrl(jobId: string): Promise<DownloadUrlResult> {
    const res = await this.get<{ data: DownloadUrlResult }>(
      `/api/jobs/${encodeURIComponent(jobId)}/download`,
    );
    return res.data;
  }

  async waitForJob(
    jobId: string,
    opts: { pollInterval?: number; timeout?: number } = {},
  ): Promise<MediaJob> {
    const { pollInterval = 2000, timeout = 120_000 } = opts;
    const deadline = Date.now() + timeout;
    while (true) {
      const job = await this.getJob(jobId);
      if (job.status === 'done') return job;
      if (job.status === 'failed') throw new JobFailedError(job);
      if (Date.now() >= deadline) throw new JobTimeoutError(jobId, timeout);
      await sleep(Math.min(pollInterval, deadline - Date.now()));
    }
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers });
    return this.parseResponse<T>(res);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    return this.parseResponse<T>(res);
  }

  private async parseResponse<T>(res: Response): Promise<T> {
    const json = (await res.json()) as unknown;
    if (!res.ok) {
      const err = json as { error?: { code?: string; message?: string } };
      throw new ApiError(
        err.error?.message ?? `HTTP ${res.status}`,
        err.error?.code ?? 'UNKNOWN',
        res.status,
      );
    }
    return json as T;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
