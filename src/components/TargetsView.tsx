import React from 'react';
import { Target, ExternalLink, ToggleLeft, ToggleRight, Layers, Play } from 'lucide-react';
import { ScraperTarget } from '../types';

interface TargetsViewProps {
  targets: ScraperTarget[];
  onToggleTarget: (id: number, currentEnabled: boolean) => void;
  onRunScraper: () => void;
}

export const TargetsView: React.FC<TargetsViewProps> = ({
  targets,
  onToggleTarget,
  onRunScraper,
}) => {
  const activeCount = targets.filter((t) => t.enabled).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-[#16161e] border border-[#252533] p-4 sm:p-5 rounded-2xl">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Scraper Target Configuration
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
              urls.txt
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configured websites and CSS selector rules parsed directly from the scraper manifest.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-xs text-neutral-400 px-3 py-1.5 rounded-xl bg-[#0e0e13] border border-[#252533]">
            Active: <span className="text-orange-400 font-bold font-mono">{activeCount} / {targets.length}</span>
          </div>

          <button
            onClick={onRunScraper}
            className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Test Scrape
          </button>
        </div>
      </div>

      {/* MOBILE TARGETS CARD VIEW (< md) */}
      <div className="block md:hidden space-y-3">
        {targets.map((target) => (
          <div
            key={`mobile-target-${target.id}`}
            className={`p-4 rounded-2xl border border-[#252533] space-y-2.5 transition-colors ${
              target.enabled ? 'bg-[#161622]' : 'bg-[#121217] opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-white capitalize flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-orange-400 shrink-0" />
                {target.site_name}
              </div>

              <button
                onClick={() => onToggleTarget(target.id, target.enabled)}
                className="text-neutral-400 hover:text-white transition-all p-1"
                title={target.enabled ? 'Disable target' : 'Enable target'}
              >
                {target.enabled ? (
                  <ToggleRight className="w-7 h-7 text-orange-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-neutral-600" />
                )}
              </button>
            </div>

            <a
              href={target.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-400 hover:text-orange-400 flex items-center gap-1 truncate"
            >
              <span className="truncate">{target.url}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>

            <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-[#222230]">
              <span className="px-2 py-0.5 rounded-md bg-[#22222f] text-orange-300 border border-[#2f2f40]">
                {target.type}
              </span>
              <span className="text-neutral-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-neutral-500" />
                {target.lines_to_trim} trim
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP TARGETS TABLE VIEW (>= md) */}
      <div className="hidden md:block bg-[#16161e] border border-[#252533] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-[#101016] text-neutral-400 uppercase tracking-wider text-[11px] font-semibold border-b border-[#22222f]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Status</th>
                <th className="py-3.5 px-4">Site & Target URL</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">CSS Selector</th>
                <th className="py-3.5 px-4 w-28">Trim Lines</th>
                <th className="py-3.5 px-4 w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#20202c]">
              {targets.map((target) => (
                <tr
                  key={target.id}
                  className={`hover:bg-[#1c1c27] transition-colors ${
                    !target.enabled ? 'opacity-50 bg-[#121217]' : ''
                  }`}
                >
                  {/* Enabled Toggle */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onToggleTarget(target.id, target.enabled)}
                      className="text-neutral-400 hover:text-white transition-all cursor-pointer"
                      title={target.enabled ? 'Disable target' : 'Enable target'}
                    >
                      {target.enabled ? (
                        <ToggleRight className="w-6 h-6 text-orange-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-neutral-600" />
                      )}
                    </button>
                  </td>

                  {/* Site & URL */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white capitalize flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      {target.site_name}
                    </div>
                    <a
                      href={target.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-neutral-400 hover:text-orange-400 flex items-center gap-1 mt-0.5 truncate max-w-md"
                    >
                      <span className="truncate">{target.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-[#22222f] text-orange-300 border border-[#2f2f40]">
                      {target.type}
                    </span>
                  </td>

                  {/* Selector */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="bg-[#0c0c11] px-2.5 py-1 rounded-lg border border-[#20202b] text-neutral-300 truncate max-w-xs" title={target.selector}>
                      {target.selector}
                    </div>
                  </td>

                  {/* Lines to trim */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400">
                    <div className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-neutral-500" />
                      {target.lines_to_trim} lines
                    </div>
                  </td>

                  {/* Quick Toggle Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onToggleTarget(target.id, target.enabled)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        target.enabled
                          ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {target.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
