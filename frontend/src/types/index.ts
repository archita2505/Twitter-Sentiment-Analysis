export type SentimentType = 'positive' | 'negative' | 'neutral';

export interface SentimentProbability {
  sentiment: string;
  probability: number;
}

export interface PredictResponse {
  tweet: string;
  predicted_sentiment: string;
  confidence: number;
  probabilities: Record<string, number>;
  probabilities_list: SentimentProbability[];
  interpretation: string;
  timestamp: string;
  model_version: string;
  is_demo_mode: boolean;
}

export interface BatchPredictItem {
  id?: string;
  tweet: string;
}

export interface BatchPredictResult {
  id?: string;
  tweet: string;
  predicted_sentiment: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface BatchPredictResponse {
  total: number;
  sentiment_counts: Record<string, number>;
  results: BatchPredictResult[];
  model_version: string;
  is_demo_mode: boolean;
}

export interface HistoryRecord {
  id: number;
  tweet_text: string;
  sentiment: string;
  confidence: number;
  probabilities: Record<string, number>;
  created_at: string;
  source: string;
}

export interface HistoryResponse {
  total: number;
  items: HistoryRecord[];
  limit: number;
  offset: number;
}

export interface PerClassMetric {
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface ModelMetrics {
  status: 'trained' | 'not_trained';
  model_name?: string;
  model_version?: string;
  algorithm?: string;
  training_timestamp?: string;
  dataset_name?: string;
  evaluation_dataset_name?: string;
  total_dataset_rows?: number;
  train_samples?: number;
  test_samples?: number;
  classes?: string[];
  num_classes?: number;
  class_distribution?: Record<string, number>;
  training_class_distribution?: Record<string, number>;
  test_class_distribution?: Record<string, number>;
  scikit_learn_version?: string;
  metrics?: {
    accuracy: number;
    macro_precision: number;
    macro_recall: number;
    macro_f1: number;
    per_class: Record<string, PerClassMetric>;
    confusion_matrix: {
      labels: string[];
      matrix: number[][];
    };
  };
  hyperparameters?: Record<string, any>;
  message?: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  model_loaded: boolean;
  model_mode: 'trained_model' | 'not_trained';
  classes: string[];
  version: string;
}

export type NavPage = 'dashboard' | 'analyze' | 'dataset' | 'analytics' | 'model' | 'history' | 'settings';
