import type {
  HealthStatus,
  PredictResponse,
  BatchPredictResponse,
  ModelMetrics,
  HistoryResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const TIMEOUT_MS = 15000;
const TRAINING_TIMEOUT_MS = 10 * 60 * 1000;

async function requestWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const api = {
  async getHealth(): Promise<HealthStatus> {
    const res = await requestWithTimeout(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health check failed (${res.status})`);
    return res.json();
  },

  async predictSingle(tweet: string, saveToHistory: boolean = true): Promise<PredictResponse> {
    const res = await requestWithTimeout(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tweet, save_to_history: saveToHistory }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Prediction failed (${res.status})`);
    }
    return res.json();
  },

  async predictBatch(
    tweets: { id?: string; tweet: string }[],
    saveToHistory: boolean = true
  ): Promise<BatchPredictResponse> {
    const res = await requestWithTimeout(`${API_BASE_URL}/predict/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tweets, save_to_history: saveToHistory }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Batch prediction failed (${res.status})`);
    }
    return res.json();
  },

  async getMetrics(): Promise<ModelMetrics> {
    const res = await requestWithTimeout(`${API_BASE_URL}/metrics`);
    if (!res.ok) throw new Error(`Failed to load metrics (${res.status})`);
    return res.json();
  },

  async getHistory(limit: number = 50, offset: number = 0, sentiment?: string): Promise<HistoryResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (sentiment && sentiment !== 'all') {
      params.append('sentiment', sentiment);
    }
    const res = await requestWithTimeout(`${API_BASE_URL}/history?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch history (${res.status})`);
    return res.json();
  },

  async clearHistory(): Promise<{ status: string; records_removed: number }> {
    const res = await requestWithTimeout(`${API_BASE_URL}/history`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to clear history (${res.status})`);
    return res.json();
  },

  async getSampleDataset(): Promise<{
    total_rows: number;
    columns: string[];
    class_distribution: Record<string, number>;
    sample_rows: any[];
  }> {
    const res = await requestWithTimeout(`${API_BASE_URL}/dataset/sample`);
    if (!res.ok) throw new Error(`Failed to fetch sample dataset (${res.status})`);
    return res.json();
  },

  async uploadPreview(file: File): Promise<{
    filename: string;
    row_count: number;
    column_count: number;
    columns: string[];
    preview_rows: any[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await requestWithTimeout(`${API_BASE_URL}/dataset/upload-preview`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Upload preview failed (${res.status})`);
    }
    return res.json();
  },

  async trainPipeline(params: {
    data_path?: string;
    test_data_path?: string;
    text_col?: string;
    label_col?: string;
    test_size?: number;
  }): Promise<{ status: string; message: string; metadata: any }> {
    const formData = new FormData();
    if (params.data_path) formData.append('data_path', params.data_path);
    if (params.test_data_path) formData.append('test_data_path', params.test_data_path);
    if (params.text_col) formData.append('text_col', params.text_col);
    if (params.label_col) formData.append('label_col', params.label_col);
    if (params.test_size) formData.append('test_size', params.test_size.toString());

    const res = await requestWithTimeout(`${API_BASE_URL}/train`, {
      method: 'POST',
      body: formData,
    }, TRAINING_TIMEOUT_MS);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Training failed (${res.status})`);
    }
    return res.json();
  }
};
