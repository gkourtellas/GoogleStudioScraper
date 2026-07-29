import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { TipsView } from './components/TipsView';
import { TargetsView } from './components/TargetsView';
import { LogsModal } from './components/LogsModal';
import { SystemStats, ScraperStatus, TipsBySite, ScraperTarget } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tips' | 'targets' | 'dashboard'>('tips');

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [status, setStatus] = useState<ScraperStatus | null>(null);
  const [tipsBySite, setTipsBySite] = useState<TipsBySite>({});
  const [targets, setTargets] = useState<ScraperTarget[]>([]);
  const [logs, setLogs] = useState<string>('');

  const [isScraping, setIsScraping] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchStatsAndStatus = useCallback(async () => {
    try {
      const [statsRes, statusRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/status')
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (statusRes.ok) setStatus(await statusRes.json());
    } catch (err) {
      console.error('Failed to fetch stats/status:', err);
    }
  }, []);

  const fetchTips = useCallback(async () => {
    try {
      const res = await fetch('/api/today');
      if (res.ok) {
        const data = await res.json();
        setTipsBySite(data.tips_by_site || {});
      }
    } catch (err) {
      console.error('Failed to fetch tips:', err);
    }
  }, []);

  const fetchTargets = useCallback(async () => {
    try {
      const res = await fetch('/api/targets');
      if (res.ok) {
        setTargets(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch targets:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        setLogs(await res.text());
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchStatsAndStatus(),
      fetchTips(),
      fetchTargets(),
      fetchLogs()
    ]);
  }, [fetchStatsAndStatus, fetchTips, fetchTargets, fetchLogs]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(fetchStatsAndStatus, 8000);
    return () => clearInterval(interval);
  }, [refreshAll, fetchStatsAndStatus]);

  const handleRunScraper = async () => {
    setIsScraping(true);
    showToast('Executing live scraper run on active targets...');
    try {
      const res = await fetch('/api/scrape', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Scraper run completed successfully!');
      } else {
        showToast(`Scrape warning: ${data.message}`);
      }
      await refreshAll();
    } catch (err: any) {
      showToast('Failed to run scraper');
    } finally {
      setIsScraping(false);
    }
  };

  const handleToggleTarget = async (id: number, currentEnabled: boolean) => {
    try {
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !currentEnabled })
      });
      const data = await res.json();
      if (data.success) {
        setTargets(data.targets);
        showToast(`Target #${id} ${!currentEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      showToast('Failed to update target');
    }
  };

  const handleAction = async (actionName: string) => {
    showToast(`Sending action: ${actionName}...`);
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName })
      });
      const data = await res.json();
      showToast(data.output || 'Action triggered');
      await refreshAll();
    } catch (err) {
      showToast('Action failed');
    }
  };

  const handleUpdateSchedule = async (params: { intervalMinutes?: number; windowEnabled?: boolean; startHour?: number; endHour?: number }) => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Auto-scheduler settings updated');
        await fetchStatsAndStatus();
      }
    } catch (err) {
      showToast('Failed to update schedule');
    }
  };

  const handleClearLogs = async () => {
    await handleAction('clear_logs');
    setLogs('');
  };

  const activeTargetsCount = targets.filter((t) => t.enabled).length;
  const totalTipsCount = Object.values(tipsBySite).reduce((acc, items) => acc + items.length, 0);

  return (
    <div className="min-h-screen bg-[#0c0d16] text-[#f3f2ee] flex flex-col font-sans selection:bg-orange-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e2038] border border-amber-500/40 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          {toastMessage}
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunScraper={handleRunScraper}
        onRefresh={refreshAll}
        onOpenLogs={() => setIsLogsOpen(true)}
        isScraping={isScraping}
        activeTargetsCount={activeTargetsCount}
        totalTipsCount={totalTipsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'tips' && (
          <TipsView tipsBySite={tipsBySite} onRefresh={fetchTips} />
        )}

        {activeTab === 'targets' && (
          <TargetsView
            targets={targets}
            onToggleTarget={handleToggleTarget}
            onRunScraper={handleRunScraper}
          />
        )}

        {activeTab === 'dashboard' && (
          <StatsOverview
            stats={stats}
            status={status}
            onAction={handleAction}
            onRunScraper={handleRunScraper}
            onUpdateSchedule={handleUpdateSchedule}
            activeTargetsCount={activeTargetsCount}
            tipsCount={totalTipsCount}
          />
        )}
      </main>

      {/* Logs Modal */}
      <LogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        logs={logs}
        onRefresh={fetchLogs}
        onClear={handleClearLogs}
      />

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-[#1d1f36] bg-[#0a0b12] py-5 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-neutral-400">Matchbook Tips Console • Scraped Tipsters Feed</p>
          <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Feed Connected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
