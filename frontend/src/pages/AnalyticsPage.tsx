import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  Calendar,
  Download,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { api } from '../services/api';
import type { HistoryRecord } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSource, setActiveSource] = useState<'all' | 'history' | 'sample'>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [histRes, sampleRes] = await Promise.allSettled([
        api.getHistory(200),
        api.getSampleDataset(),
      ]);

      if (histRes.status === 'fulfilled') {
        setHistory(histRes.value.items);
      }
      if (sampleRes.status === 'fulfilled') {
        setSampleData(sampleRes.value.sample_rows || []);
      }
    } catch (e) {
      console.error('Failed to load analytics records:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Combine or filter records
  const combinedRecords = React.useMemo(() => {
    let list: any[] = [];
    if (activeSource === 'history') list = history;
    else if (activeSource === 'sample') list = sampleData;
    else list = [...history, ...sampleData];

    if (selectedSentiment !== 'all') {
      list = list.filter(
        (r) => (r.sentiment || r.predicted_sentiment) === selectedSentiment
      );
    }
    return list;
  }, [history, sampleData, activeSource, selectedSentiment]);

  const total = combinedRecords.length;
  const positiveCount = combinedRecords.filter(
    (r) => (r.sentiment || r.predicted_sentiment) === 'positive'
  ).length;
  const negativeCount = combinedRecords.filter(
    (r) => (r.sentiment || r.predicted_sentiment) === 'negative'
  ).length;
  const neutralCount = combinedRecords.filter(
    (r) => (r.sentiment || r.predicted_sentiment) === 'neutral'
  ).length;

  const posPct = total ? Math.round((positiveCount / total) * 100) : 0;
  const negPct = total ? Math.round((negativeCount / total) * 100) : 0;
  const neuPct = total ? Math.round((neutralCount / total) * 100) : 0;

  const pieData = [
    { name: 'Positive', value: positiveCount, color: '#10b981' },
    { name: 'Negative', value: negativeCount, color: '#f43f5e' },
    { name: 'Neutral', value: neutralCount, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: 'Positive', count: positiveCount, fill: '#10b981' },
    { name: 'Neutral', count: neutralCount, fill: '#f59e0b' },
    { name: 'Negative', count: negativeCount, fill: '#f43f5e' },
  ];

  // Daily trend
  const trendData = React.useMemo(() => {
    const datesMap: Record<string, { date: string; positive: number; negative: number; neutral: number }> = {};
    combinedRecords.forEach((r) => {
      const ts = r.created_at || r.timestamp;
      if (!ts) return;
      const dateKey = ts.slice(0, 10);
      if (!datesMap[dateKey]) {
        datesMap[dateKey] = { date: dateKey.slice(5), positive: 0, negative: 0, neutral: 0 };
      }
      const sent = r.sentiment || r.predicted_sentiment;
      if (sent === 'positive') datesMap[dateKey].positive++;
      else if (sent === 'negative') datesMap[dateKey].negative++;
      else if (sent === 'neutral') datesMap[dateKey].neutral++;
    });
    return Object.values(datesMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [combinedRecords]);

  // Export Analytics CSV report
  const handleExportReport = () => {
    if (combinedRecords.length === 0) return;
    const headers = ['id', 'tweet_text', 'sentiment', 'confidence', 'timestamp', 'source'];
    const rows = combinedRecords.map((r, i) => [
      `"${r.id || r.tweet_id || i}"`,
      `"${(r.tweet_text || r.text || '').replace(/"/g, '""')}"`,
      `"${r.sentiment || r.predicted_sentiment || ''}"`,
      `"${r.confidence ? Math.round(r.confidence * 100) + '%' : ''}"`,
      `"${r.created_at || r.timestamp || ''}"`,
      `"${r.source || 'dataset'}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'pulsesentiment_analytics_report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-400" />
            Sentiment Analytics & Distribution
          </h2>
          <p className="text-sm text-slate-400">
            Interactive analytical charts powered by genuine classified tweet records.
          </p>
        </div>
        <Button
          variant="outline"
          size="md"
          icon={<Download className="w-4 h-4" />}
          onClick={handleExportReport}
          disabled={combinedRecords.length === 0}
        >
          Download CSV Report
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl glass-card flex flex-wrap items-center justify-between gap-4">
        {/* Source Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Dataset Scope:</span>
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveSource('all')}
              className={`px-3 py-1 rounded-lg capitalize font-medium ${
                activeSource === 'all' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Combined ({history.length + sampleData.length})
            </button>
            <button
              onClick={() => setActiveSource('history')}
              className={`px-3 py-1 rounded-lg capitalize font-medium ${
                activeSource === 'history' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Inferences ({history.length})
            </button>
            <button
              onClick={() => setActiveSource('sample')}
              className={`px-3 py-1 rounded-lg capitalize font-medium ${
                activeSource === 'sample' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sample Set ({sampleData.length})
            </button>
          </div>
        </div>

        {/* Sentiment Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Sentiment Filter:</span>
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10">
            {['all', 'positive', 'negative', 'neutral'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSentiment(s as any)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium ${
                  selectedSentiment === s
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loader label="Computing analytics..." />
      ) : total === 0 ? (
        <Card className="text-center py-12 text-slate-500">
          <p className="text-sm">No tweet records found for the selected filter combination.</p>
        </Card>
      ) : (
        <>
          {/* Ratio Breakdown Bar */}
          <Card>
            <CardHeader
              title="Polarity Ratio Breakdown"
              subtitle={`${total} total analyzed tweets`}
              icon={<Percent className="w-4 h-4" />}
            />
            <div className="space-y-3">
              <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${posPct}%` }}
                  title={`Positive: ${positiveCount} (${posPct}%)`}
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${neuPct}%` }}
                  title={`Neutral: ${neutralCount} (${neuPct}%)`}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${negPct}%` }}
                  title={`Negative: ${negativeCount} (${negPct}%)`}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-emerald-400">Positive:</span>
                  <span>{positiveCount} tweets ({posPct}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="font-semibold text-amber-400">Neutral:</span>
                  <span>{neutralCount} tweets ({neuPct}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="font-semibold text-rose-400">Negative:</span>
                  <span>{negativeCount} tweets ({negPct}%)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <Card>
              <CardHeader
                title="Sentiment Proportions"
                subtitle="Relative class share"
                icon={<PieIcon className="w-4 h-4" />}
              />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Volume Bar Chart */}
            <Card>
              <CardHeader
                title="Tweet Volume Comparison"
                subtitle="Absolute count per class"
                icon={<BarChart3 className="w-4 h-4" />}
              />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Timeline Chart */}
          {trendData.length > 0 && (
            <Card>
              <CardHeader
                title="Historical Temporal Trajectory"
                subtitle="Class counts over available dates"
                icon={<Calendar className="w-4 h-4" />}
              />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="positive"
                      name="Positive"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="negative"
                      name="Negative"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="neutral"
                      name="Neutral"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
