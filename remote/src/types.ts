export interface Env {
  ENVIRONMENT: string;
}

export interface JobListParams {
  cursor?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  createdAfter?: string;
  createdBefore?: string;
  sort?: 'createdAt' | 'completedAt';
  order?: 'asc' | 'desc';
}

export interface ApiClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
}
