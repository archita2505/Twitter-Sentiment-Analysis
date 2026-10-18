import React, { useState } from 'react';
import {
  Sparkles,
  Trash2,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  BarChart2,
  Info,
  Smile,
  Frown,
  Meh,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import type { PredictResponse } from '../types';
import { api } from '../services/api';

const QUICK_EXAMPLES = [
  {
    label: '✨ Loving Apple M3',
    sentiment: 'positive',
    text: 'I am absolutely loving the new M3 MacBook Pro! The battery life is out of this world! #Apple',
  },
  {
    label: '😡 Flight Delay Rant',
    sentiment: 'negative',
    text: 'Flight delayed for the third time today! Stuck at the gate for 5 hours. Awful customer service! >:(',
  },
  {
    label: '📅 Scheduled Maintenance',
    sentiment: 'neutral',
    text: 'The quarterly earnings conference call is scheduled for Thursday at 4 PM Eastern Time.',
  },
  {
    label: '☕ Morning Delight',
    sentiment: 'positive',
    text: 'This warm caramel latte from the local roaster is pure perfection. Good morning everyone! :)',
  },
  {
    label: '⚠️ Crashed App Bug',
    sentiment: 'negative',
    text: 'The latest patch broke every dashboard export feature. App keeps crashing repeatedly! Unusable.',
  },
];

export const AnalyzeTweetPage: React.FC = () => {
  const [tweetText, setTweetText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveToHistory, setSaveToHistory] = useState(true);

  const charCount = tweetText.length;
  const maxChars = 280;

  const handleAnalyze = async () => {
    const text = tweetText.trim();
    if (!text) {
      setErrorMessage('Please enter some tweet text to analyze.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await api.predictSingle(text, saveToHistory);
      setPrediction(res);

      // Trigger celebratory confetti if positive
      if (res.predicted_sentiment === 'positive') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#8b5cf6'],
        });
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to connect to the backend API. Please verify the service is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setTweetText('');
    setPrediction(null);
    setErrorMessage(null);
  };

  const handleSelectExample = (text: string) => {
    setTweetText(text);
    setErrorMessage(null);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="w-8 h-8 text-emerald-400" />;
      case 'negative':
        return <Frown className="w-8 h-8 text-rose-400" />;
      case 'neutral':
        return <Meh className="w-8 h-8 text-amber-400" />;
      default:
        return <Sparkles className="w-8 h-8 text-brand-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-400" />
          Interactive Sentiment Analyzer
        </h2>
        <p className="text-sm text-slate-400">
          Submit any social post or tweet to predict its sentiment polarity and probability distribution.
        </p>
      </div>

      {/* Main Analyzer Card */}
      <Card glow className="space-y-4">
        {/* Quick Example Chips */}
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Quick Test Examples
          </span>
          <div className="flex flex-wrap gap-2">
            {QUICK_EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectExample(ex.text)}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-brand-600/20 border border-white/5 hover:border-brand-500/30 text-xs font-medium text-slate-300 hover:text-white transition-all duration-150"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Area */}
        <div className="space-y-2">
          <div className="relative">
            <textarea
              id="tweet-input"
              rows={4}
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value)}
              placeholder="Paste or type a tweet here (e.g. 'Just tried the latest release and it is amazingly fast! ❤️')..."
              maxLength={1000}
              className="w-full p-4 rounded-2xl bg-navy-900/80 dark:bg-navy-900/80 border border-white/10 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 text-sm leading-relaxed transition-all resize-none font-sans"
            />
          </div>

          {/* Controls & Character Count */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span
                className={`font-mono font-medium ${
                  charCount > maxChars ? 'text-amber-400 font-bold' : 'text-slate-400'
                }`}
              >
                {charCount} / {maxChars} chars
              </span>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToHistory}
                  onChange={(e) => setSaveToHistory(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-brand-600 focus:ring-brand-500"
                />
                <span>Save to History</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              {tweetText && (
                <Button
                  variant="outline"
                  size="md"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={handleClear}
                >
                  Clear
                </Button>
              )}
              <Button
                id="btn-analyze"
                variant="primary"
                size="md"
                isLoading={isLoading}
                icon={<Send className="w-4 h-4" />}
                onClick={handleAnalyze}
              >
                Analyze Sentiment
              </Button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Inference Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Prediction Output Section */}
      {prediction && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
          <CardHeader
            title="Analysis Results"
            subtitle={`Computed via ${prediction.model_version}`}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            action={
              prediction.is_demo_mode ? (
                <Badge variant="demo" size="md" dot>
                  Demo Mode
                </Badge>
              ) : (
                <Badge variant="positive" size="md" dot>
                  Trained Pipeline
                </Badge>
              )
            }
          />

          {/* Result Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Predicted Class Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/5">
                {getSentimentIcon(prediction.predicted_sentiment)}
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Predicted Sentiment
                </span>
                <div className="mt-1">
                  <Badge variant={prediction.predicted_sentiment as any} size="lg" dot>
                    {prediction.predicted_sentiment}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-center">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Top Confidence Score
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">
                  {Math.round(prediction.confidence * 100)}%
                </span>
                <span className="text-xs text-slate-400">model probability estimate</span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-center">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Timestamp
              </span>
              <span className="text-sm font-mono text-slate-200 mt-1">
                {prediction.timestamp.slice(0, 19).replace('T', ' ')} UTC
              </span>
            </div>
          </div>

          {/* Model Interpretation */}
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-start gap-3">
            <Info className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <span className="font-semibold text-brand-300">Model Interpretation</span>
              <p className="text-slate-300 leading-relaxed">{prediction.interpretation}</p>
            </div>
          </div>

          {/* Class Probabilities Progress Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-brand-400" />
                Estimated Probability Distribution
              </span>
              <span className="text-[11px] text-slate-400">
                Logistic Regression output
              </span>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
              {Object.entries(prediction.probabilities).map(([cls, prob]) => {
                const pct = Math.round(prob * 100);
                const isWinner = cls === prediction.predicted_sentiment;
                const barColor =
                  cls === 'positive'
                    ? 'bg-emerald-500'
                    : cls === 'negative'
                    ? 'bg-rose-500'
                    : 'bg-amber-500';

                return (
                  <div key={cls} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`capitalize font-semibold ${
                          isWinner ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {cls} {isWinner && '(Top)'}
                      </span>
                      <span className="font-mono font-bold text-slate-200">{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${barColor} ${
                          isWinner ? 'shadow-sm shadow-current' : 'opacity-80'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Original Analyzed Text */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 text-xs space-y-1">
            <span className="text-slate-400 uppercase font-semibold text-[10px]">
              Original Analyzed Post
            </span>
            <p className="text-slate-200 italic font-sans">"{prediction.tweet}"</p>
          </div>
        </Card>
      )}
    </div>
  );
};
