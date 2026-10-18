import React, { useState } from 'react';
import {
  Settings,
  Server,
  Cpu,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sliders,
  Terminal,
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import type { HealthStatus } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  healthStatus: HealthStatus | null;
  onRefreshHealth: () => void;
  isBackendOnline: boolean;
  isDemoMode: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  healthStatus,
  onRefreshHealth,
  isBackendOnline,
  isDemoMode,
}) => {
  const [apiUrl, setApiUrl] = useState(
    import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
  );
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(60);

  const handleTestConnection = async () => {
    setIsPinging(true);
    setPingStatus(null);
    try {
      const start = performance.now();
      const res = await api.getHealth();
      const latency = Math.round(performance.now() - start);
      setPingStatus(`Connected successfully! Latency: ${latency}ms (Status: ${res.status})`);
      onRefreshHealth();
    } catch (e: any) {
      setPingStatus(`Connection failed: ${e.message}`);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-400" />
          Settings & System Diagnostics
        </h2>
        <p className="text-sm text-slate-400">
          Configure API endpoints, inspect model pipelines, and tune inference parameters.
        </p>
      </div>

      {/* Backend API Configuration */}
      <Card>
        <CardHeader
          title="Backend API Service"
          subtitle="Connection endpoints and latency diagnostics"
          icon={<Server className="w-4 h-4" />}
          action={
            isBackendOnline ? (
              <Badge variant="positive" size="sm" dot>
                Online
              </Badge>
            ) : (
              <Badge variant="negative" size="sm" dot>
                Offline
              </Badge>
            )
          }
        />
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              API Base URL (VITE_API_BASE_URL)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-100 font-mono focus:outline-none focus:border-brand-500/50"
              />
              <Button
                variant="primary"
                size="md"
                isLoading={isPinging}
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={handleTestConnection}
              >
                Test Connection
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Configured via Vite environment variable or local default (http://127.0.0.1:8000/api).
            </p>
          </div>

          {pingStatus && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                pingStatus.startsWith('Connected')
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {pingStatus.startsWith('Connected') ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{pingStatus}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Model Mode Diagnostics */}
      <Card>
        <CardHeader
          title="Machine Learning Engine Diagnostics"
          subtitle="Artifact status, inference mode, and class registry"
          icon={<Cpu className="w-4 h-4" />}
          action={
            isDemoMode ? (
              <Badge variant="demo" size="sm" dot>
                Model Unavailable
              </Badge>
            ) : (
              <Badge variant="positive" size="sm" dot>
                Trained Model
              </Badge>
            )
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 space-y-1">
            <span className="text-slate-400 font-medium">Inference Architecture</span>
            <p className="text-sm font-bold text-white">
              {isDemoMode
                ? 'No prediction model loaded'
                : 'Word/Character/Negation TF-IDF + Logistic Regression'}
            </p>
            <p className="text-[11px] text-slate-500">
              {isDemoMode
                ? 'Prediction scores are disabled until a trained artifact is available'
                : 'Joblib Serialized Pipeline'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 space-y-1">
            <span className="text-slate-400 font-medium">Model Artifact Path</span>
            <p className="text-sm font-mono text-slate-200">models/sentiment_model.joblib</p>
            <p className="text-[11px] text-slate-500">Local filesystem persistence</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 space-y-1">
            <span className="text-slate-400 font-medium">Supported Categories</span>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {healthStatus?.classes.map((c) => (
                <Badge key={c} variant={c as any} size="sm">
                  {c}
                </Badge>
              )) || ['positive', 'negative', 'neutral'].map((c) => (
                <Badge key={c} variant={c as any} size="sm">{c}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Inference Confidence Tuning */}
      <Card>
        <CardHeader
          title="Inference Confidence Threshold"
          subtitle="Highlight high-confidence predictions"
          icon={<Sliders className="w-4 h-4" />}
        />
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-medium">
              High Confidence Marker ({confidenceThreshold}%)
            </span>
            <span className="font-mono text-brand-400 font-bold">{confidenceThreshold}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={95}
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500">
            Predictions above this probability threshold are highlighted as strong emotional indicators.
          </p>
        </div>
      </Card>

      {/* Technology Stack & Architecture Reference */}
      <Card>
        <CardHeader
          title="Technology Stack & Design System"
          subtitle="Engineered with modern full-stack best practices"
          icon={<Terminal className="w-4 h-4" />}
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
            <span className="text-slate-400 block">Frontend</span>
            <span className="font-semibold text-slate-200">React + Vite + TS</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
            <span className="text-slate-400 block">Styling</span>
            <span className="font-semibold text-slate-200">Tailwind CSS (Dark)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
            <span className="text-slate-400 block">Backend</span>
            <span className="font-semibold text-slate-200">FastAPI + Uvicorn</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
            <span className="text-slate-400 block">NLP / ML</span>
            <span className="font-semibold text-slate-200">Scikit-Learn + NLTK</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
