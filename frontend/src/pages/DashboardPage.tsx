import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  Eye,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Database,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Skeleton } from '../components/common/Loader';
import type { HistoryRecord, NavPage } from '../types';
import { api } from '../services/api';

interface DashboardPageProps {
  onNavigate: (page: NavPage) => void;
  isBackendOnline?: boolean;
  isDemoMode?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
}) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [sampleDataset, setSampleDataset] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTweet, setSelectedTweet] = useState<HistoryRecord | null>(null);
  const [dataSource, setDataSource] = useState<'history' | 'sample'>('history');

  useEffect(() => {
    loadDashboardData();
  }, [dataSource]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [historyRes, sampleRes] = await Promise.allSettled([
        api.getHistory(50),
        api.getSampleDataset(),
      ]);

      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value.items);
      }
      if (sampleRes.status === 'fulfilled') {
        setSampleDataset(sampleRes.value.sample_rows || []);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Derive counts based on selected source (history or sample dataset)
  const records = dataSource === 'history' && history.length > 0 ? history : sampleDataset;
  const isUsingSample = dataSource === 'sample' || history.length === 0;

  const totalCount = records.length;
  const positiveCount = records.filter(
    (r) => (r.sentiment || r.predicted_sentiment) === 'positive'
  ).length;
  const negativeCount = records.filter(
    (r) => (r.sentiment || r.predicted_sentiment) === 'negative'
  ).length;
  const neutralCount = records.filter(
    (r) => (r.sentiment || r.predicted_sentiment) === 'neutral'
  ).length;

  const posPct = totalCount ? Math.round((positiveCount / totalCount) * 100) : 0;
  const negPct = totalCount ? Math.round((negativeCount / totalCount) * 100) : 0;
  const neuPct = totalCount ? Math.round((neutralCount / totalCount) * 100) : 0;

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

  // Derive trend series from timestamp data
  const trendData = React.useMemo(() => {
    const datesMap: Record<string, { date: string; positive: number; negative: number; neutral: number }> = {};
    records.forEach((r) => {
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
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-3xl p-8 overflow-hidden bg-gradient-to-r from-navy-900 via-brand-950 to-navy-900 border border-brand-500/20 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 text-brand-300 text-xs font-semibold border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Real-Time Sentiment Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Understand the emotion behind every tweet.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Turn social conversations into actionable sentiment insights. Analyze posts in real-time,
            evaluate NLP model precision, and inspect multi-class distribution.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={<Sparkles className="w-4 h-4" />}
              onClick={() => onNavigate('analyze')}
            >
              Analyze New Tweet
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<Database className="w-4 h-4" />}
              onClick={() => onNavigate('dataset')}
            >
              Explore Dataset
            </Button>

            {/* Dataset Selector */}
            <div className="ml-auto flex items-center gap-2 text-xs bg-slate-900/80 p-1.5 rounded-xl border border-white/10">
              <span className="text-slate-400 pl-2">Data Source:</span>
              <button
                onClick={() => setDataSource('history')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  dataSource === 'history'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Inference History ({history.length})
              </button>
              <button
                onClick={() => setDataSource('sample')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  dataSource === 'sample'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sample Dataset ({sampleDataset.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {isUsingSample && history.length === 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm">Notice</Badge>
            <span>
              Showing metrics from <strong>sample Twitter dataset</strong>. Analyze tweets to populate your live inference history!
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => onNavigate('analyze')}>
            Try It Now
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyzed */}
        <Card className="hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Tweets
            </span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                {totalCount.toLocaleString()}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>{isUsingSample ? 'From verified sample set' : 'Persisted in SQLite'}</span>
            </p>
          </div>
        </Card>

        {/* Positive Tweets */}
        <Card className="hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Positive
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Smile className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                  {positiveCount}
                </span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                  {posPct}%
                </span>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">High satisfaction & praise</p>
          </div>
        </Card>

        {/* Negative Tweets */}
        <Card className="hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Negative
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Frown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                  {negativeCount}
                </span>
                <span className="text-xs font-semibold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full">
                  {negPct}%
                </span>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Complaints & critical issues</p>
          </div>
        </Card>

        {/* Neutral Tweets */}
        <Card className="hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Neutral
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Meh className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                  {neutralCount}
                </span>
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                  {neuPct}%
                </span>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Objective & factual posts</p>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart: Sentiment Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader
            title="Sentiment Distribution"
            subtitle="Polarity split across records"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <div className="h-64 flex flex-col items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-xs text-slate-500">No sentiment data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
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
            )}
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Positive ({posPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Negative ({negPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Neutral ({neuPct}%)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Sentiment Volume Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Polarity Volume Comparison"
            subtitle="Absolute record count per category"
            icon={<BarChart className="w-4 h-4" />}
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

      {/* Time-Series Sentiment Trend (if timestamps exist) */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader
            title="Sentiment Timeline Trend"
            subtitle="Temporal trajectory of positive, negative, and neutral tweets"
            icon={<Calendar className="w-4 h-4" />}
          />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
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

      {/* Recent Analyses Table */}
      <Card>
        <CardHeader
          title="Recent Tweet Analyses"
          subtitle="Latest classifications and confidence scores"
          action={
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowUpRight className="w-4 h-4" />}
              onClick={() => onNavigate('history')}
            >
              View Full History
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Tweet Text</th>
                <th className="py-3 px-4">Sentiment</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center">
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No recent analyses found. Try analyzing a tweet!
                  </td>
                </tr>
              ) : (
                records.slice(0, 6).map((item, idx) => {
                  const text = item.tweet_text || item.text;
                  const sentiment = item.sentiment || item.predicted_sentiment || 'neutral';
                  const conf = item.confidence ? `${Math.round(item.confidence * 100)}%` : '—';
                  const ts = (item.created_at || item.timestamp || '').slice(0, 16).replace('T', ' ');

                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 max-w-md">
                        <p className="line-clamp-1 text-slate-200 font-medium">{text}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={sentiment as any}
                          size="sm"
                          dot
                        >
                          {sentiment}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-semibold">{conf}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{ts}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedTweet(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-white/5 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tweet Details Modal */}
      {selectedTweet && (
        <Modal
          isOpen={!!selectedTweet}
          onClose={() => setSelectedTweet(null)}
          title="Analysis Details"
        >
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Tweet Content</span>
              <p className="mt-1 p-3 rounded-xl bg-slate-900/80 border border-white/10 text-slate-100 leading-relaxed font-sans">
                "{selectedTweet.tweet_text || (selectedTweet as any).text}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5">
                <span className="text-xs text-slate-400">Classified Sentiment</span>
                <div className="mt-1">
                  <Badge variant={(selectedTweet.sentiment || (selectedTweet as any).predicted_sentiment) as any} size="md" dot>
                    {selectedTweet.sentiment || (selectedTweet as any).predicted_sentiment}
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5">
                <span className="text-xs text-slate-400">Model Confidence</span>
                <p className="mt-1 text-lg font-bold text-slate-100">
                  {selectedTweet.confidence ? `${Math.round(selectedTweet.confidence * 100)}%` : 'N/A'}
                </p>
              </div>
            </div>

            {selectedTweet.probabilities && Object.keys(selectedTweet.probabilities).length > 0 && (
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">
                  Class Probabilities
                </span>
                <div className="space-y-2 mt-2">
                  {Object.entries(selectedTweet.probabilities).map(([c, p]) => (
                    <div key={c} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize text-slate-300">{c}</span>
                        <span className="font-mono text-slate-400">{Math.round(p * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c === 'positive'
                              ? 'bg-emerald-500'
                              : c === 'negative'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.round(p * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 text-right">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTweet(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
