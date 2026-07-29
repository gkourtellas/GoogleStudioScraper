import React, { useState } from 'react';
import { Search, RefreshCw, Trophy, Copy, Check, Filter } from 'lucide-react';
import { TipsBySite } from '../types';

interface TipsViewProps {
  tipsBySite: TipsBySite;
  onRefresh: () => void;
}

interface StructuredTip {
  siteKey: string;
  date: string;
  event: string;
  tip: string;
  time: string;
  odds: string;
  formattedLine: string;
}

// Distinct vibrant theme per tipster / bookmaker source
function getSiteTheme(siteName: string) {
  const name = siteName.toLowerCase();
  if (name.includes('foxbet')) {
    return {
      badge: 'bg-[#f59e0b] text-slate-950 font-black border border-amber-400 shadow-sm shadow-amber-500/20',
      bgRow: 'bg-[#1c1810] hover:bg-[#292215]',
      accentText: 'text-amber-400',
    };
  }
  if (name.includes('kingbet')) {
    return {
      badge: 'bg-[#38bdf8] text-slate-950 font-black border border-sky-300 shadow-sm shadow-sky-500/20',
      bgRow: 'bg-[#0f1a2a] hover:bg-[#16273d]',
      accentText: 'text-sky-300',
    };
  }
  if (name.includes('bethome')) {
    return {
      badge: 'bg-[#34d399] text-slate-950 font-black border border-emerald-300 shadow-sm shadow-emerald-500/20',
      bgRow: 'bg-[#0d2119] hover:bg-[#143327]',
      accentText: 'text-emerald-300',
    };
  }
  if (name.includes('sportbet')) {
    return {
      badge: 'bg-[#a78bfa] text-slate-950 font-black border border-purple-300 shadow-sm shadow-purple-500/20',
      bgRow: 'bg-[#1a142c] hover:bg-[#271d42]',
      accentText: 'text-purple-300',
    };
  }
  if (name.includes('sentra')) {
    return {
      badge: 'bg-[#fb7185] text-slate-950 font-black border border-rose-300 shadow-sm shadow-rose-500/20',
      bgRow: 'bg-[#24131b] hover:bg-[#361a27]',
      accentText: 'text-rose-300',
    };
  }
  return {
    badge: 'bg-[#818cf8] text-slate-950 font-black border border-indigo-300 shadow-sm shadow-indigo-500/20',
    bgRow: 'bg-[#15162b] hover:bg-[#202242]',
    accentText: 'text-indigo-300',
  };
}

function parseTip(siteName: string, rawText: string, logDate?: string): StructuredTip {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  let kickoff = '';
  let match = '';
  let prediction = '';
  let odds = '';

  const isSentra = siteName.toLowerCase().includes('sentra');

  // Extract Odds unless sentragoal (where extracted number is stake amount)
  if (!isSentra) {
    const oddsMatch = rawText.match(/(?:Απόδοση:?\s*|Odds:?\s*|\b)(\d+\.\d{2})\b/i);
    if (oddsMatch) {
      odds = oddsMatch[1];
    }
  }

  // Extract Date & Time from kickoff string (e.g. 28/07 20:00 or 28/07)
  const kickoffMatch = rawText.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)(?:\s+(\d{2}:\d{2}))?/);
  let date = '28/07';
  let time = '';

  if (kickoffMatch) {
    date = kickoffMatch[1];
    if (kickoffMatch[2]) {
      time = kickoffMatch[2];
    }
  }

  if (!time) {
    const timeMatch = rawText.match(/\b(\d{2}:\d{2})\b/);
    if (timeMatch) {
      time = timeMatch[1];
    }
  }

  // Parse lines for Match & Prediction
  for (const line of lines) {
    if (line.startsWith('Match:')) {
      match = line.replace(/^Match:\s*/i, '').trim();
    } else if (line.startsWith('Prediction:') || line.startsWith('Prediction/Odds:')) {
      prediction = line.replace(/^Prediction(?:\/Odds)?:\s*/i, '').trim();
    } else if (!isSentra && (line.startsWith('Odds:') || line.startsWith('Απόδοση:'))) {
      if (!odds) odds = line.replace(/^(?:Odds|Απόδοση):\s*/i, '').trim();
    }
  }

  // Fallback for match
  if (!match) {
    match = lines.find((l) => (l.includes('-') || l.includes('vs')) && !l.includes('http')) || lines[0] || 'Match Tip';
  }
  // Fallback for prediction
  if (!prediction) {
    prediction = lines.find((l) => !l.includes('-') && !l.includes('/') && l.length < 40) || '1';
  }

  // Clean match string
  match = match.replace(/^ΒΟΟΚ\s+/i, '').replace(/^(?:28|27)\/\d{2}\s+(?:\d{2}:\d{2}\s+)?/, '').trim();

  if (!match.includes('-') && !match.includes('vs') && !match.includes('VS')) {
    const words = match.split(/\s+/);
    if (words.length === 4) {
      match = `${words[0]} ${words[1]} - ${words[2]} ${words[3]}`;
    } else if (words.length === 3) {
      match = `${words[0]} - ${words[1]} ${words[2]}`;
    } else if (words.length === 2) {
      match = `${words[0]} - ${words[1]}`;
    }
  }

  // Clean prediction: REMOVE @, Prediction:, and inline odds like (1.75)
  prediction = prediction
    .replace(/^@\s*/, '')
    .replace(/^Prediction:\s*/i, '')
    .replace(/\s*\(\d+\.\d{2}\)\s*/, '')
    .replace(/\s*@\s*\d+\.\d{2}\s*/, '')
    .replace(/@/g, '')
    .trim();

  // Format line as requested: [Tipster name] | [date] | [event] | [tip] | [time] | [odds]
  const lineParts = [siteName, date, match, prediction];
  if (time) lineParts.push(time);
  if (odds && !isSentra) lineParts.push(`@${odds}`);

  const formattedLine = lineParts.join(' | ');

  return {
    siteKey: siteName,
    date,
    event: match,
    tip: prediction || '1',
    time: time || '-',
    odds: isSentra || !odds ? '-' : `@${odds}`,
    formattedLine,
  };
}

export const TipsView: React.FC<TipsViewProps> = ({ tipsBySite, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedRowIdx, setCopiedRowIdx] = useState<number | null>(null);

  const sites = Object.keys(tipsBySite);

  // Parse all tips into structured objects
  const allParsedTips: StructuredTip[] = [];
  sites.forEach((site) => {
    const items = tipsBySite[site] || [];
    items.forEach((item) => {
      allParsedTips.push(parseTip(site, item.tip, item.date));
    });
  });

  // Filter tips
  const filteredTips = allParsedTips.filter((tip) => {
    const matchesSearch =
      tip.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tip.siteKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tip.tip.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSite =
      selectedSiteFilter === 'all' ||
      tip.siteKey.toLowerCase() === selectedSiteFilter.toLowerCase();

    return matchesSearch && matchesSite;
  });

  const handleCopyAll = () => {
    const textToCopy = filteredTips.map((t) => t.formattedLine).join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyRow = (line: string, idx: number) => {
    navigator.clipboard.writeText(line);
    setCopiedRowIdx(idx);
    setTimeout(() => setCopiedRowIdx(null), 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Top Header Control Panel */}
      <div className="bg-[#131525] border border-[#282a47] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 sm:space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-orange-500/25 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Matchbook Tips Directory
                <span className="text-[10px] sm:text-[11px] font-mono font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {filteredTips.length} Tips
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-400">
                Structured live feed from Cyprus & Greece bookmaker sources
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Search Box */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search event or team..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#0a0b14] border border-[#2d3052] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopyAll}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#20233d] hover:bg-[#2b2f52] text-amber-300 border border-[#3e426e] font-bold text-xs transition-all active:scale-95 shrink-0 cursor-pointer shadow-md"
                title="Copy all tips formatted to clipboard"
              >
                {copiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedAll ? 'Copied All!' : 'Copy All'}</span>
              </button>

              <button
                onClick={onRefresh}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-orange-600/20 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-[#20223d] scrollbar-none pb-1">
          <button
            onClick={() => setSelectedSiteFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              selectedSiteFilter === 'all'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25'
                : 'bg-[#1d1f38] text-neutral-400 hover:text-white hover:bg-[#282c4f]'
            }`}
          >
            All Tipsters ({allParsedTips.length})
          </button>
          {sites.map((site) => {
            const theme = getSiteTheme(site);
            const isSelected = selectedSiteFilter.toLowerCase() === site.toLowerCase();
            return (
              <button
                key={site}
                onClick={() => setSelectedSiteFilter(site)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all whitespace-nowrap cursor-pointer ${
                  isSelected ? `${theme.badge} shadow-md` : 'bg-[#1d1f38] text-neutral-400 hover:text-white hover:bg-[#282c4f]'
                }`}
              >
                {site}
              </button>
            );
          })}
        </div>
      </div>

      {filteredTips.length === 0 ? (
        <div className="bg-[#131525] border border-[#282a47] rounded-3xl p-12 text-center text-neutral-400 text-xs space-y-2">
          <Filter className="w-8 h-8 text-neutral-500 mx-auto" />
          <p className="font-bold text-white">No tips matching your filter.</p>
        </div>
      ) : (
        <>
          {/* MOBILE CARD VIEW (visible on small screens < md) */}
          <div className="block md:hidden space-y-3">
            {filteredTips.map((tip, idx) => {
              const theme = getSiteTheme(tip.siteKey);
              const isCopied = copiedRowIdx === idx;

              return (
                <div
                  key={`mobile-${tip.siteKey}-${idx}`}
                  className={`p-4 rounded-2xl border border-[#282b4a] space-y-2.5 shadow-lg transition-colors ${theme.bgRow}`}
                >
                  {/* Top Bar: Tipster, Date, Time, Copy */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wide ${theme.badge}`}>
                        {tip.siteKey}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-[11px] font-mono">
                        {tip.date}
                      </span>
                      {tip.time !== '-' && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold text-[11px] font-mono">
                          {tip.time}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopyRow(tip.formattedLine, idx)}
                      className="p-2 rounded-xl bg-[#1e2036] hover:bg-orange-500 text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
                      title="Copy formatted line"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Event Title */}
                  <div className="text-white font-black text-sm tracking-tight leading-snug">
                    {tip.event}
                  </div>

                  {/* Bottom Bar: Tip badge + Odds badge */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs shadow-inner">
                      {tip.tip}
                    </span>

                    {tip.odds !== '-' && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 font-mono">
                        {tip.odds}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (visible on md+ screens) */}
          <div className="hidden md:block bg-[#131424] border border-[#272a47] rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-[#0b0c16] border-b border-[#262846] text-[11px] font-black uppercase tracking-wider text-neutral-400">
                    <th className="py-3.5 px-4 w-[180px]">Tipster Name</th>
                    <th className="py-3.5 px-3 w-[90px] text-center">Date</th>
                    <th className="py-3.5 px-4">Event / Match</th>
                    <th className="py-3.5 px-4 w-[220px]">Tip / Market</th>
                    <th className="py-3.5 px-3 w-[80px] text-center">Time</th>
                    <th className="py-3.5 px-4 w-[90px] text-center">Odds</th>
                    <th className="py-3.5 px-3 w-[60px] text-right">Copy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f223d] font-mono text-xs">
                  {filteredTips.map((tip, idx) => {
                    const theme = getSiteTheme(tip.siteKey);
                    const isCopied = copiedRowIdx === idx;

                    return (
                      <tr
                        key={`desktop-${tip.siteKey}-${idx}`}
                        className={`transition-colors ${theme.bgRow}`}
                      >
                        {/* Column 1: Tipster Name */}
                        <td className="py-3.5 px-4 font-sans">
                          <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wide truncate ${theme.badge}`}>
                            {tip.siteKey}
                          </span>
                        </td>

                        {/* Column 2: Date */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-xs">
                            {tip.date}
                          </span>
                        </td>

                        {/* Column 3: Event / Match */}
                        <td className="py-3.5 px-4 font-sans font-black text-white text-sm tracking-tight">
                          {tip.event}
                        </td>

                        {/* Column 4: Tip / Market */}
                        <td className="py-3.5 px-4 font-sans">
                          <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs shadow-inner">
                            {tip.tip}
                          </span>
                        </td>

                        {/* Column 5: Time */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold text-xs">
                            {tip.time}
                          </span>
                        </td>

                        {/* Column 6: Odds */}
                        <td className="py-3.5 px-4 text-center">
                          {tip.odds !== '-' ? (
                            <span className="inline-block px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20">
                              {tip.odds}
                            </span>
                          ) : (
                            <span className="text-neutral-500 font-bold">-</span>
                          )}
                        </td>

                        {/* Column 7: Quick Copy Line */}
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleCopyRow(tip.formattedLine, idx)}
                            className="p-1.5 rounded-lg bg-[#1e2036] hover:bg-orange-500 text-neutral-400 hover:text-white transition-all cursor-pointer"
                            title="Copy formatted line"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
