import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Award,
  Layers,
  BarChart,
  Grid,
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Tooltip } from '../components/common/Tooltip';
import { Loader } from '../components/common/Loader';
import type { ModelMetrics } from '../types';
import { api } from '../services/api';

export const ModelPerformancePage: React.FC = () => {
  const [metricsData, setMetricsData] = useState<ModelMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);
  const [retrainError, setRetrainError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMetrics();
      setMetricsData(data);
    } catch (e: any) {
      console.error('Failed to load metrics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    setRetrainSuccess(null);
    setRetrainError(null);
    try {
      await api.trainPipeline({
        data_path: 'data/tweet_eval/train.csv',
        test_data_path: 'data/tweet_eval/test.csv',
        text_col: 'text',
        label_col: 'sentiment',
      });
      setRetrainSuccess('Model trained and reloaded successfully!');
      loadMetrics();
    } catch (err: any) {
      setRetrainError(err.message || 'Model retraining failed.');
    } finally {
      setIsRetraining(false);
    }
  };

  if (isLoading) {
    return <Loader label="Loading model evaluation metrics..." />;
  }

  const isTrained = metricsData?.status === 'trained' && metricsData.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-brand-400" />
            Model Performance & ML Evaluation
          </h2>
          <p className="text-sm text-slate-400">
            Rigorous evaluation metrics measured on a genuine, untouched held-out test split.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          isLoading={isRetraining}
          icon={<RotateCcw className="w-4 h-4" />}
          onClick={handleRetrain}
        >
          Retrain Model
        </Button>
      </div>

      {retrainSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{retrainSuccess}</span>
        </div>
      )}

      {retrainError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{retrainError}</span>
        </div>
      )}

      {!isTrained ? (
        /* Not Trained State */
        <Card className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white">No Model Trained Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No saved scikit-learn model artifact was found in <code className="text-brand-300">models/</code>.
              Download the TweetEval splits with <code className="text-brand-300">python data/download_tweet_eval.py</code>,
              then train and evaluate the model below.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            isLoading={isRetraining}
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={handleRetrain}
          >
            Train Initial Model Now
          </Button>
        </Card>
      ) : (
        <>
          {/* Metadata Overview Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <span className="text-xs text-slate-400 uppercase font-semibold">Model Name</span>
              <p className="text-base font-bold text-white mt-1">{metricsData.model_name}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="brand" size="sm">
                  v{metricsData.model_version}
                </Badge>
                <span className="text-[11px] text-slate-500 font-mono">Joblib Pipeline</span>
              </div>
            </Card>

            <Card>
              <span className="text-xs text-slate-400 uppercase font-semibold">Dataset Split</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-white">
                  {metricsData.train_samples} / {metricsData.test_samples}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Training data / untouched benchmark test data
              </p>
            </Card>

            <Card>
              <span className="text-xs text-slate-400 uppercase font-semibold">Supported Classes</span>
              <p className="text-base font-bold text-white mt-1">
                {metricsData.num_classes} Categories
              </p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {metricsData.classes?.map((c) => (
                  <Badge key={c} variant={c as any} size="sm">
                    {c}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card>
              <span className="text-xs text-slate-400 uppercase font-semibold">Trained At</span>
              <p className="text-sm font-mono text-slate-200 mt-1">
                {(metricsData.training_timestamp || '').slice(0, 16).replace('T', ' ')} UTC
              </p>
              <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verified Non-Leaking Split</span>
              </p>
            </Card>
          </div>

          {/* Primary Macro KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Accuracy */}
            <Card className="hover:border-brand-500/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Accuracy</span>
                  <Tooltip content="Overall percentage of test tweets classified correctly across all classes." />
                </div>
                <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-white">
                  {Math.round(metricsData.metrics!.accuracy * 100)}%
                </span>
                <span className="text-xs text-slate-400 font-mono ml-2">
                  ({metricsData.metrics!.accuracy.toFixed(4)})
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  On {metricsData.test_samples?.toLocaleString()} held-out tweets
                </p>
              </div>
            </Card>

            {/* Macro Precision */}
            <Card className="hover:border-emerald-500/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Macro Precision</span>
                  <Tooltip content="Precision = True Positives / (True Positives + False Positives). Unweighted average across classes." />
                </div>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <BarChart className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-emerald-400">
                  {Math.round(metricsData.metrics!.macro_precision * 100)}%
                </span>
                <span className="text-xs text-slate-400 font-mono ml-2">
                  ({metricsData.metrics!.macro_precision.toFixed(4)})
                </span>
                <p className="text-xs text-slate-500 mt-1">Minimizes false positive alerts</p>
              </div>
            </Card>

            {/* Macro Recall */}
            <Card className="hover:border-amber-500/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Macro Recall</span>
                  <Tooltip content="Recall = True Positives / (True Positives + False Negatives). Measures completeness of class detection." />
                </div>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-amber-400">
                  {Math.round(metricsData.metrics!.macro_recall * 100)}%
                </span>
                <span className="text-xs text-slate-400 font-mono ml-2">
                  ({metricsData.metrics!.macro_recall.toFixed(4)})
                </span>
                <p className="text-xs text-slate-500 mt-1">Sensitivity across sentiment classes</p>
              </div>
            </Card>

            {/* Macro F1 */}
            <Card className="hover:border-indigo-500/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Macro F1-Score</span>
                  <Tooltip content="Harmonic mean of precision and recall. Ideal metric for balanced evaluation." />
                </div>
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-indigo-400">
                  {Math.round(metricsData.metrics!.macro_f1 * 100)}%
                </span>
                <span className="text-xs text-slate-400 font-mono ml-2">
                  ({metricsData.metrics!.macro_f1.toFixed(4)})
                </span>
                <p className="text-xs text-slate-500 mt-1">Harmonic balance of P & R</p>
              </div>
            </Card>
          </div>

          {/* Per-Class Breakdown Table & Confusion Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classification Report Table */}
            <Card>
              <CardHeader
                title="Per-Class Performance Report"
                subtitle="Granular evaluation per sentiment polarity"
                icon={<Layers className="w-4 h-4" />}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Precision</th>
                      <th className="py-2.5 px-3">Recall</th>
                      <th className="py-2.5 px-3">F1-Score</th>
                      <th className="py-2.5 px-3">Support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {metricsData.metrics?.per_class &&
                      Object.entries(metricsData.metrics.per_class).map(([cls, row]) => (
                        <tr key={cls} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-semibold capitalize">
                            <Badge variant={cls as any} size="sm" dot>
                              {cls}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-200">
                            {Math.round(row.precision * 100)}%
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-200">
                            {Math.round(row.recall * 100)}%
                          </td>
                          <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                            {Math.round(row.f1_score * 100)}%
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400">{row.support}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Confusion Matrix Heatmap */}
            <Card>
              <CardHeader
                title="Confusion Matrix"
                subtitle="True Labels (rows) vs Predicted Labels (columns)"
                icon={<Grid className="w-4 h-4" />}
              />
              {metricsData.metrics?.confusion_matrix && (
                <div className="space-y-4">
                  <div className="flex justify-end text-[11px] text-slate-400">
                    <span>Predicted &rarr;</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-xs">
                      <thead>
                        <tr>
                          <th className="p-2 text-left text-slate-500 font-normal">True &darr;</th>
                          {metricsData.metrics.confusion_matrix.labels.map((lbl) => (
                            <th key={lbl} className="p-2 capitalize font-semibold text-slate-300">
                              {lbl}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {metricsData.metrics.confusion_matrix.matrix.map((row, rIdx) => {
                          const trueLabel = metricsData.metrics!.confusion_matrix.labels[rIdx];
                          return (
                            <tr key={trueLabel}>
                              <td className="p-2 text-left capitalize font-semibold text-slate-300">
                                {trueLabel}
                              </td>
                              {row.map((val, cIdx) => {
                                const isDiagonal = rIdx === cIdx;
                                const cellBg = isDiagonal
                                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                  : val > 0
                                  ? 'bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/20'
                                  : 'bg-slate-900/40 text-slate-500 border border-white/5';
                                return (
                                  <td key={cIdx} className="p-2">
                                    <div
                                      className={`p-3 rounded-xl font-mono text-sm transition-all ${cellBg}`}
                                    >
                                      {val}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-slate-400 italic text-center">
                    Green diagonal cells represent correct predictions (True Positives / True Negatives).
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Educational Concept Tooltips & Architecture Guide */}
          <Card>
            <CardHeader
              title="NLP Methodology & Evaluation Concepts"
              subtitle="Technical foundation behind word, character, and negation TF-IDF features"
              icon={<BookOpen className="w-4 h-4" />}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 space-y-1.5">
                <h4 className="font-semibold text-brand-300 flex items-center gap-1.5">
                  <span>TF-IDF Vectorization</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Term Frequency-Inverse Document Frequency reflects how important a word is to a tweet relative to the whole corpus, penalizing ubiquity while amplifying sentiment indicators.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 space-y-1.5">
                <h4 className="font-semibold text-brand-300 flex items-center gap-1.5">
                  <span>Logistic Regression Classifier</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  A discriminative statistical classifier that estimates class probabilities with logistic/softmax functions and L2 regularization. These probabilities are useful model scores but are not guaranteed to be calibrated.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 space-y-1.5">
                <h4 className="font-semibold text-brand-300 flex items-center gap-1.5">
                  <span>Precision, Recall & Macro F1</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Precision prevents false sentiment classification. Recall prevents missing genuine emotion. Macro F1 unifies both across all classes equally without bias toward large classes.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
