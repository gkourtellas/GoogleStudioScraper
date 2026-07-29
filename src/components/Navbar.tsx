import React from 'react';
import { Play, RefreshCw, Terminal, Trophy, FileText, Target, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  activeTab: 'tips' | 'targets' | 'dashboard';
  setActiveTab: (tab: 'tips' | 'targets' | 'dashboard') => void;
  onRunScraper: () => void;
  onRefresh: () => void;
  onOpenLogs: () => void;
  isScraping: boolean;
  activeTargetsCount: number;
  totalTipsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRunScraper,
  onRefresh,
  onOpenLogs,
  isScraping,
  activeTargetsCount,
  totalTipsCount,
}) => {
  return (
    <header className="border-b border-[#22243d] bg-[#121322]/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Top Header Row on Mobile */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-orange-500/20 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight leading-tight">
                Matchbook Tips
              </h1>
              <p className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Tipster Scraper
              </p>
            </div>
          </div>

          {/* Action Controls on Mobile header */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onRunScraper}
              disabled={isScraping}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {isScraping ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white" />
              )}
              <span className="hidden xs:inline">{isScraping ? 'Scraping' : 'Scrape'}</span>
            </button>

            <button
              onClick={onOpenLogs}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#1d2038] hover:bg-[#282b4a] border border-[#32365c] text-neutral-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              title="View Scraper Logs"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Logs</span>
            </button>

            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-[#1d2038] hover:bg-[#282b4a] border border-[#32365c] text-neutral-400 hover:text-white transition-all cursor-pointer"
              title="Refresh All Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher - Horizontal Scroll on Mobile */}
        <div className="flex items-center bg-[#181a2e] p-1 rounded-xl border border-[#2a2d4d] overflow-x-auto scrollbar-none w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('tips')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tips'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Tips ({totalTipsCount})
          </button>

          <button
            onClick={() => setActiveTab('targets')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'targets'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Targets ({activeTargetsCount})
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Overview
          </button>
        </div>
      </div>
    </header>
  );
};
