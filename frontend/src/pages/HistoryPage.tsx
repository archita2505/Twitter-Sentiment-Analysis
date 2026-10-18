import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import type { HistoryRecord } from '../types';
import { api } from '../services/api';

export const HistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const pageSize = 15;

  useEffect(() => {
    loadHistory();
  }, [sentimentFilter, currentPage]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const res = await api.getHistory(pageSize, offset, sentimentFilter);
      setHistoryItems(res.items);
      setTotalCount(res.total);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      await api.clearHistory();
      setHistoryItems([]);
      setTotalCount(0);
      setClearConfirmOpen(false);
    } catch (e: any) {
      alert(`Failed to clear history: ${e.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDownloadHistoryCSV = () => {
    if (historyItems.length === 0) return;
    const headers = ['id', 'tweet_text', 'sentiment', 'confidence', 'created_at', 'source'];
    const rows = historyItems.map((r) => [
      `"${r.id}"`,
      `"${(r.tweet_text || '').replace(/"/g, '""')}"`,
      `"${r.sentiment}"`,
      `"${Math.round(r.confidence * 100)}%"`,
      `"${r.created_at}"`,
      `"${r.source}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'pulsesentiment_analysis_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = historyItems.filter((item) =>
    item.tweet_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="w-6 h-6 text-brand-400" />
            Analysis History & Audit Log
          </h2>
          <p className="text-sm text-slate-400">
            Persistent SQLite database log of single and batch predictions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownloadHistoryCSV}
            disabled={historyItems.length === 0}
          >
            Export History CSV
          </Button>
          <Button
            variant="danger"
            size="md"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setClearConfirmOpen(true)}
            disabled={totalCount === 0}
          >
            Clear All History
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl glass-card flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logged tweet text..."
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

      {/* History Table Card */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Tweet Content</th>
                <th className="py-3 px-4">Predicted Sentiment</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Logged Time</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader label="Loading history records from SQLite..." />
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No analysis history records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">#{item.id}</td>
                    <td className="py-3 px-4 max-w-md">
                      <p className="line-clamp-2 text-slate-200 font-medium">{item.tweet_text}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={item.sentiment as any} size="sm" dot>
                        {item.sentiment}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-300">
                      {Math.round(item.confidence * 100)}%
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {item.created_at.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5">
                        {item.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-white/5"
                        title="View Full Breakdown"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-400">
          <span>
            Total: {totalCount} records (Page {currentPage} of {totalPages})
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

      {/* Confirmation Modal to Clear History */}
      {clearConfirmOpen && (
        <Modal
          isOpen={clearConfirmOpen}
          onClose={() => setClearConfirmOpen(false)}
          title="Confirm Clear Analysis History"
        >
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                Are you sure you want to delete all <strong>{totalCount}</strong> analysis records from the SQLite database? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClearConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isClearing}
                onClick={handleClearHistory}
              >
                Yes, Clear All
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`History Record #${selectedRecord.id}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase">Tweet Text</span>
              <p className="mt-1 p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-100 text-sm leading-relaxed">
                "{selectedRecord.tweet_text}"
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5">
                <span className="text-slate-400">Classified Sentiment</span>
                <div className="mt-1">
                  <Badge variant={selectedRecord.sentiment as any} size="md" dot>
                    {selectedRecord.sentiment}
                  </Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5">
                <span className="text-slate-400">Confidence</span>
                <p className="mt-1 text-base font-bold text-white">
                  {Math.round(selectedRecord.confidence * 100)}%
                </p>
              </div>
            </div>

            {selectedRecord.probabilities && Object.keys(selectedRecord.probabilities).length > 0 && (
              <div className="space-y-2">
                <span className="text-slate-400 font-semibold uppercase">Probabilities</span>
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/40 border border-white/5">
                  {Object.entries(selectedRecord.probabilities).map(([cls, prob]) => (
                    <div key={cls} className="flex justify-between text-xs">
                      <span className="capitalize text-slate-300">{cls}</span>
                      <span className="font-mono text-slate-200">{Math.round(prob * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
