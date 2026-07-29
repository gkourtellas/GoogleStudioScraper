import React, { useState } from 'react';
import { Terminal, RefreshCw, Trash2, X, Search, Copy, Check } from 'lucide-react';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string;
  onRefresh: () => void;
  onClear: () => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({
  isOpen,
  onClose,
  logs,
  onRefresh,
  onClear,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const filteredLogs = logs
    ? logs
        .split('\n')
        .filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase()))
        .join('\n')
    : 'No logs available.';

  const handleCopy = () => {
    navigator.clipboard.writeText(logs);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121218] border border-[#272738] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-[#181822] border-b border-[#252536] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Live Scraper Execution Logs
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#252536] text-neutral-400 font-mono">
                  logs/scraper.log
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Real-time output from scraper runs, HTTP requests, and tip storage.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#222230] hover:bg-[#2c2c3e] text-neutral-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-[#15151f] border-b border-[#222232] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter log lines..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0c0c10] border border-[#252536] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-[#222230] hover:bg-[#2b2b3e] text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {isCopied ? 'Copied' : 'Copy Logs'}
            </button>

            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg bg-[#222230] hover:bg-[#2b2b3e] text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
              Refresh
            </button>

            <button
              onClick={() => {
                if (window.confirm('Clear all log output?')) onClear();
              }}
              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-medium flex items-center gap-1.5 border border-red-800/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Log
            </button>
          </div>
        </div>

        {/* Console Log Area */}
        <div className="p-4 bg-[#09090d] flex-1 overflow-y-auto font-mono text-xs text-neutral-300 leading-relaxed selection:bg-orange-500/30 selection:text-orange-200">
          <pre className="whitespace-pre-wrap">{filteredLogs}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#181822] border-t border-[#252536] text-[11px] text-neutral-400 flex items-center justify-between">
          <span>Log lines: {logs ? logs.split('\n').length : 0}</span>
          <span className="text-orange-400 font-mono">Status: Stream Active</span>
        </div>
      </div>
    </div>
  );
};
