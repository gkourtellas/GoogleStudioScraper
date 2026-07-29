import React, { useState } from 'react';
import { Cpu, HardDrive, Server, Clock, Activity, Power, RotateCw, Play, ShieldCheck, Database, Calendar, Timer, CheckCircle2 } from 'lucide-react';
import { SystemStats, ScraperStatus } from '../types';

interface StatsOverviewProps {
  stats: SystemStats | null;
  status: ScraperStatus | null;
  onAction: (action: string) => void;
  onRunScraper: () => void;
  onUpdateSchedule?: (params: { intervalMinutes?: number; windowEnabled?: boolean; startHour?: number; endHour?: number }) => void;
  activeTargetsCount: number;
  tipsCount: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  status,
  onAction,
  onRunScraper,
  onUpdateSchedule,
  activeTargetsCount,
  tipsCount,
}) => {
  const currentInterval = status?.schedule_interval_minutes ?? 60;
  const isScheduled = currentInterval > 0;
  const windowEnabled = status?.schedule_window_enabled ?? true;
  const startHour = status?.schedule_start_hour ?? 11;
  const endHour = status?.schedule_end_hour ?? 16;

  const [updatingSchedule, setUpdatingSchedule] = useState(false);

  const scheduleOptions = [
    { label: 'Off (Manual)', value: 0 },
    { label: 'Every 1 Hour', value: 60 },
    { label: 'Every 1.5 Hours', value: 90 },
    { label: 'Every 2 Hours', value: 120 },
    { label: 'Every 3 Hours', value: 180 },
    { label: 'Every 6 Hours', value: 360 },
  ];

  const handleSelectInterval = async (val: number) => {
    if (onUpdateSchedule) {
      setUpdatingSchedule(true);
      await onUpdateSchedule({ intervalMinutes: val });
      setUpdatingSchedule(false);
    }
  };

  const handleToggleWindow = async (enabled: boolean) => {
    if (onUpdateSchedule) {
      setUpdatingSchedule(true);
      await onUpdateSchedule({ windowEnabled: enabled });
      setUpdatingSchedule(false);
    }
  };

  const handleChangeHours = async (newStart: number, newEnd: number) => {
    if (onUpdateSchedule) {
      setUpdatingSchedule(true);
      await onUpdateSchedule({ startHour: newStart, endHour: newEnd });
      setUpdatingSchedule(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Banner / Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b1b24] via-[#15151c] to-[#121217] border border-[#2a2a38] p-6 md:p-8 shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Service Status: Active & Synced
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Control Panel & System Metrics
            </h2>
            <p className="text-sm text-neutral-400 max-w-xl">
              Monitors match tips extraction, system resource utilization, and console navigation bookmarks for George's Server.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRunScraper}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-orange-950/40 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              Execute Scraper Run
            </button>
            <button
              onClick={() => onAction('restart_homepage')}
              className="px-4 py-2.5 rounded-xl bg-[#22222d] hover:bg-[#2b2b3a] border border-[#323244] text-neutral-200 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5 text-orange-400" />
              Restart Console Process
            </button>
            <button
              onClick={() => {
                if (window.confirm('Reboot server system?')) onAction('reboot_server');
              }}
              className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
            >
              <Power className="w-3.5 h-3.5" />
              Reboot Server
            </button>
          </div>
        </div>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Uptime */}
        <div className="bg-[#16161e] border border-[#252533] rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-orange-500/30 transition-all">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">System Uptime</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats?.uptime || 'Loading...'}
          </div>
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Started at: {status?.bot_since || 'Active session'}
          </div>
        </div>

        {/* Metric 2: CPU Load */}
        <div className="bg-[#16161e] border border-[#252533] rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-orange-500/30 transition-all">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Load Average</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats?.load || 'Loading...'}
          </div>
          <div className="text-xs text-neutral-500">
            1m, 5m, 15m CPU load metrics
          </div>
        </div>

        {/* Metric 3: Memory */}
        <div className="bg-[#16161e] border border-[#252533] rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-orange-500/30 transition-all">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Memory Usage</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats?.memory || 'Loading...'}
          </div>
          <div className="text-xs text-neutral-500">
            Node.js heap & host RAM usage
          </div>
        </div>

        {/* Metric 4: Disk */}
        <div className="bg-[#16161e] border border-[#252533] rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-orange-500/30 transition-all">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Disk Storage</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats?.disk || 'Loading...'}
          </div>
          <div className="text-xs text-neutral-500">
            Workspace root volume capacity
          </div>
        </div>
      </div>

      {/* Automated Scheduler Card */}
      <div className="bg-gradient-to-r from-[#171722] via-[#1a1a28] to-[#171722] border border-[#2d2d3f] rounded-2xl p-6 space-y-4 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282838] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Automated Background Scheduler</h3>
                {isScheduled ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Auto Scrape Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                    Manual Mode Only
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Automatically extracts predictions from all enabled target sites on a recurring interval.
              </p>
            </div>
          </div>

          {status?.next_scheduled_run && (
            <div className="bg-[#111118] px-3 py-2 rounded-xl border border-[#222232] text-xs font-mono flex items-center gap-2 self-start sm:self-auto">
              <Timer className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <span className="text-neutral-400 block text-[10px]">Next Scheduled Run:</span>
                <span className="text-orange-300 font-bold">{new Date(status.next_scheduled_run).toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2.5">
            Select Scrape Interval:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {scheduleOptions.map((opt) => {
              const isSelected = currentInterval === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelectInterval(opt.value)}
                  disabled={updatingSchedule}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-950/50 ring-1 ring-orange-400'
                      : 'bg-[#1e1e2c] hover:bg-[#28283b] text-neutral-300 border border-[#2b2b3d]'
                  } ${updatingSchedule ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Operating Window Section */}
        {isScheduled && (
          <div className="pt-3 border-t border-[#282838] grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="windowToggle"
                  checked={windowEnabled}
                  onChange={(e) => handleToggleWindow(e.target.checked)}
                  disabled={updatingSchedule}
                  className="rounded border-[#3a3a4f] bg-[#1a1a26] text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="windowToggle" className="text-xs font-bold text-white cursor-pointer select-none">
                  Enable Daily Operating Time Window
                </label>
              </div>
              <p className="text-[11px] text-neutral-400 pl-6">
                Restricts automatic runs to specific daily hours (e.g., 11:00 AM to 4:00 PM). Outside this window, runs wait until the next day.
              </p>
            </div>

            {windowEnabled && (
              <div className="flex items-center gap-3 bg-[#13131c] p-3 rounded-xl border border-[#262638] self-stretch justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-semibold">Start:</span>
                  <select
                    value={startHour}
                    onChange={(e) => handleChangeHours(parseInt(e.target.value, 10), endHour)}
                    disabled={updatingSchedule}
                    className="bg-[#1e1e2d] border border-[#323248] text-white text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
                  >
                    {[8, 9, 10, 11, 12, 13].map((h) => (
                      <option key={h} value={h}>
                        {h < 12 ? `${h}:00 AM` : `${h}:00 PM`} ({h}:00)
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs text-neutral-500 font-bold">→</span>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-semibold">Stop:</span>
                  <select
                    value={endHour}
                    onChange={(e) => handleChangeHours(startHour, parseInt(e.target.value, 10))}
                    disabled={updatingSchedule}
                    className="bg-[#1e1e2d] border border-[#323248] text-white text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
                  >
                    {[14, 15, 16, 17, 18, 19, 20].map((h) => (
                      <option key={h} value={h}>
                        {h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`} ({h}:00)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scraper Engine Status Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#16161e] border border-[#252533] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#252533] pb-4">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-orange-400" />
              <h3 className="text-base font-bold text-white">Scraper Service Status</h3>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              Process Running (PID 1)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
            <div className="bg-[#1c1c27] p-4 rounded-xl border border-[#282838]">
              <span className="text-xs text-neutral-400 block mb-1">Active Scraper Targets</span>
              <span className="text-xl font-bold text-white font-mono">{activeTargetsCount} Targets</span>
            </div>
            <div className="bg-[#1c1c27] p-4 rounded-xl border border-[#282838]">
              <span className="text-xs text-neutral-400 block mb-1">Total Tips Stored</span>
              <span className="text-xl font-bold text-white font-mono">{tipsCount} Entries</span>
            </div>
            <div className="bg-[#1c1c27] p-4 rounded-xl border border-[#282838]">
              <span className="text-xs text-neutral-400 block mb-1">Last Run Timestamp</span>
              <span className="text-xs font-bold text-amber-400 font-mono block truncate">
                {status?.last_run ? new Date(status.last_run).toLocaleTimeString() : 'Just now'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Diagnostic Service Output
            </label>
            <pre className="bg-[#0e0e13] p-4 rounded-xl text-xs text-neutral-300 font-mono overflow-x-auto border border-[#22222f] leading-relaxed">
              {status?.status_output || 'No diagnostic output recorded.'}
            </pre>
          </div>
        </div>

        {/* Quick Tips Summary */}
        <div className="bg-[#16161e] border border-[#252533] rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#252533] pb-4">
              <Database className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Target Data Storage</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Scraper data is synchronized locally to <code className="text-orange-300 bg-[#1e1e2b] px-1.5 py-0.5 rounded">sent_log.json</code> and targets configuration is read from <code className="text-orange-300 bg-[#1e1e2b] px-1.5 py-0.5 rounded">urls.txt</code>.
            </p>
            <ul className="text-xs text-neutral-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                Deduplication via SHA/Url keys
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                Formatted Telegram & Web output
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                Automatic line-trim filtering
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-[#252533]">
            <div className="text-xs text-neutral-400 flex items-center justify-between">
              <span>Host OS:</span>
              <span className="text-white font-semibold">Linux x86_64</span>
            </div>
            <div className="text-xs text-neutral-400 flex items-center justify-between mt-1">
              <span>Environment:</span>
              <span className="text-white font-semibold">Cloud Container</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
