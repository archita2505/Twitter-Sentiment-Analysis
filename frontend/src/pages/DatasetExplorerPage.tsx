import React, { useState, useEffect } from 'react';
import {
  Upload,
  Database,
  Search,
  Filter,
  Download,
  Play,
  AlertTriangle,
  CheckCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { api } from '../services/api';

interface TweetRow {
  tweet_id?: string;
  id?: string;
  text: string;
  sentiment?: string;
  predicted_sentiment?: string;
  confidence?: number;
  timestamp?: string;
}

export const DatasetExplorerPage: React.FC = () => {
  const [datasetRows, setDatasetRows] = useState<TweetRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [classDistribution, setClassDistribution] = useState<Record<string, number>>({});
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<TweetRow | null>(null);

  // Upload & Mapping state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [textColumn, setTextColumn] = useState('text');
  const [labelColumn, setLabelColumn] = useState('sentiment');
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  const pageSize = 10;

  useEffect(() => {
    loadSampleDataset();
  }, []);

  const loadSampleDataset = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSampleDataset();
      setTotalRows(data.total_rows);
      setColumns(data.columns);
      setClassDistribution(data.class_distribution || {});
      setDatasetRows(data.sample_rows || []);
    } catch (err: any) {
      console.error('Failed to load sample dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadError('Invalid file format. Please upload a .csv file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10 MB limit.');
      return;
    }

    setUploadError(null);
    setUploadedFile(file);

    try {
      const preview = await api.uploadPreview(file);
      // Auto-detect columns
      if (preview.columns.includes('text')) setTextColumn('text');
      else if (preview.columns.includes('tweet')) setTextColumn('tweet');
      else setTextColumn(preview.columns[0]);

      if (preview.columns.includes('sentiment')) setLabelColumn('sentiment');
      else if (preview.columns.includes('target')) setLabelColumn('target');
      else setLabelColumn(preview.columns[1] || preview.columns[0]);

      // Populate preview into table
      setColumns(preview.columns);
      setTotalRows(preview.row_count);
      setDatasetRows(
        preview.preview_rows.map((r: any, idx: number) => ({
          tweet_id: r.tweet_id || r.id || `csv_${idx}`,
          text: r[textColumn] || r.text || '',
          sentiment: r[labelColumn] || r.sentiment || undefined,
        }))
      );
    } catch (err: any) {
      setUploadError(err.message || 'Failed to inspect CSV file.');
    }
  };

  // Run Batch Sentiment Classification
  const handleBatchAnalyze = async () => {
    if (datasetRows.length === 0) return;
    setIsBatchAnalyzing(true);
    setBatchSuccessMsg(null);

    try {
      const items = datasetRows.map((r, idx) => ({
        id: r.tweet_id || r.id || `t_${idx}`,
        tweet: r.text,
      }));

      const res = await api.predictBatch(items.slice(0, 50), true);

      // Merge predicted sentiment back into rows
      const updated = datasetRows.map((row, idx) => {
        const pred = res.results.find((p) => p.id === (row.tweet_id || row.id || `t_${idx}`));
        if (pred) {
          return {
            ...row,
            predicted_sentiment: pred.predicted_sentiment,
            confidence: pred.confidence,
          };
        }
        return row;
      });

      setDatasetRows(updated);
      setClassDistribution(res.sentiment_counts);
      setBatchSuccessMsg(`Successfully classified ${res.results.length} tweets in batch!`);
    } catch (err: any) {
      setUploadError(err.message || 'Batch classification failed.');
    } finally {
      setIsBatchAnalyzing(false);
    }
  };

  // Export current classified table as CSV
  const handleDownloadCSV = () => {
    if (datasetRows.length === 0) return;
    const headers = ['tweet_id', 'text', 'sentiment', 'predicted_sentiment', 'confidence'];
    const rows = datasetRows.map((r) => [
      `"${r.tweet_id || r.id || ''}"`,
      `"${(r.text || '').replace(/"/g, '""')}"`,
      `"${r.sentiment || ''}"`,
      `"${r.predicted_sentiment || ''}"`,
      `"${r.confidence ? Math.round(r.confidence * 100) + '%' : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'pulsesentiment_classified_tweets.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search
  const filteredRows = datasetRows.filter((r) => {
    const matchesSearch = r.text.toLowerCase().includes(searchTerm.toLowerCase());
    const sent = r.predicted_sentiment || r.sentiment || '';
    const matchesSentiment = sentimentFilter === 'all' || sent.toLowerCase() === sentimentFilter.toLowerCase();
    return matchesSearch && matchesSentiment;
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-brand-400" />
            Dataset Explorer & Batch Classifier
          </h2>
          <p className="text-sm text-slate-400">
            Upload custom tweet datasets or explore verified sample data with instant NLP batch inference.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownloadCSV}
            disabled={datasetRows.length === 0}
          >
            Export Classified CSV
          </Button>
          <Button
            variant="primary"
            size="md"
            isLoading={isBatchAnalyzing}
            icon={<Play className="w-4 h-4" />}
            onClick={handleBatchAnalyze}
            disabled={datasetRows.length === 0}
          >
            Batch Classify All
          </Button>
        </div>
      </div>

      {/* CSV Upload & Validation Area */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Import CSV Tweet Dataset
            </span>
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 hover:border-brand-500/50 rounded-2xl cursor-pointer bg-slate-900/40 hover:bg-slate-900/60 transition-all">
              <Upload className="w-8 h-8 text-brand-400 mb-2" />
              <span className="text-sm font-semibold text-slate-200">
                {uploadedFile ? uploadedFile.name : 'Click to upload or drag & drop CSV'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Supports Sentiment140, Twitter Airline, or custom CSV (Max 10 MB)
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {uploadError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {batchSuccessMsg && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{batchSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Dataset Schema Summary */}
          <div className="w-full lg:w-80 p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Dataset Statistics
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5">
                <span className="text-slate-400">Total Rows</span>
                <p className="text-lg font-bold text-white mt-0.5">{totalRows.toLocaleString()}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5">
                <span className="text-slate-400">Columns</span>
                <p className="text-lg font-bold text-white mt-0.5">{columns.length}</p>
              </div>
            </div>

            {/* Label Distribution */}
            {Object.keys(classDistribution).length > 0 && (
              <div className="space-y-2 pt-1 border-t border-white/5 text-xs">
                <span className="text-slate-400 font-medium">Discovered Labels:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(classDistribution).map(([label, count]) => (
                    <Badge key={label} variant={label as any} size="sm">
                      {label}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-card">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search tweet text..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
          />
        </div>

        {/* Sentiment Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10 text-xs font-medium">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          {['all', 'positive', 'negative', 'neutral'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setSentimentFilter(tab);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                sentimentFilter === tab
                  ? 'bg-brand-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tweet Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Tweet Text</th>
                <th className="py-3 px-4">Ground Truth</th>
                <th className="py-3 px-4">Model Prediction</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <Loader label="Loading tweets..." />
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No tweets matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const sent = row.sentiment || '—';
                  const pred = row.predicted_sentiment;
                  const conf = row.confidence ? `${Math.round(row.confidence * 100)}%` : '—';

                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {row.tweet_id || row.id || `tw_${idx}`}
                      </td>
                      <td className="py-3 px-4 max-w-lg">
                        <p className="line-clamp-2 text-slate-200 font-medium leading-relaxed">
                          {row.text}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {sent !== '—' ? (
                          <Badge variant={sent as any} size="sm">
                            {sent}
                          </Badge>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {pred ? (
                          <Badge variant={pred as any} size="sm" dot>
                            {pred}
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Not classified</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-300">{conf}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedRow(row)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-white/5"
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

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-400">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} tweets
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-white/5 disabled:opacity-40 hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-white/5 disabled:opacity-40 hover:bg-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Row Detail Modal */}
      {selectedRow && (
        <Modal
          isOpen={!!selectedRow}
          onClose={() => setSelectedRow(null)}
          title="Tweet Details"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-100 text-sm leading-relaxed">
              "{selectedRow.text}"
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5">
                <span className="text-slate-400">Ground Truth</span>
                <div className="mt-1">
                  {selectedRow.sentiment ? (
                    <Badge variant={selectedRow.sentiment as any} size="md">
                      {selectedRow.sentiment}
                    </Badge>
                  ) : (
                    'Unlabeled'
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5">
                <span className="text-slate-400">Model Prediction</span>
                <div className="mt-1">
                  {selectedRow.predicted_sentiment ? (
                    <Badge variant={selectedRow.predicted_sentiment as any} size="md" dot>
                      {selectedRow.predicted_sentiment} ({Math.round((selectedRow.confidence || 0) * 100)}%)
                    </Badge>
                  ) : (
                    'Not classified'
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
