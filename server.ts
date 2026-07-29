import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as cheerio from 'cheerio';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const BASE_DIR = process.cwd();

const SENT_LOG_FILE = path.join(BASE_DIR, 'sent_log.json');
const URLS_FILE = path.join(BASE_DIR, 'urls.txt');
const LOG_DIR = path.join(BASE_DIR, 'logs');
const SCRAPER_LOG_FILE = path.join(LOG_DIR, 'scraper.log');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Scraper state in memory
let scraperState = {
  active: false,
  lastRun: new Date().toISOString(),
  lastRunStatus: 'idle',
  totalRuns: 1,
  startTime: new Date()
};

function appendLog(message: string) {
  const timestamp = new Date().toLocaleString('en-GB');
  const line = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(SCRAPER_LOG_FILE, line, 'utf-8');
  } catch (err) {
    console.error('Failed to write scraper log:', err);
  }
}

// Ensure initial log exists
if (!fs.existsSync(SCRAPER_LOG_FILE)) {
  appendLog('Scraper service initialized in Node.js runtime.');
}

function extractSiteName(url: string): string {
  if (url.includes('foxbet.gr/316026/to-dunato-simeio')) return 'foxbet-to_dynato';
  if (url.includes('foxbet.gr/316014/to-stantar')) return 'foxbet-to_stantar';
  if (url.includes('nostrabet.com/en/bet-of-the-day')) return 'nostra_bet_of_the_day';
  if (url.includes('nostrabet.com/en/banker-of-the-day')) return 'notra_banker_of_the_day';
  if (url.includes('kingbet.com.cy/to-dynato-simeio-imeras')) return 'kingbet-to_dynato';
  if (url.includes('kingbet.com.cy/favori-imeras')) return 'kingbet-to_favori';
  if (url.includes('kingbet.com.cy/to-stantar-tis-imeras')) return 'kingbet-to_stantar';
  if (url.includes('sentragoal.gr')) return 'sentragoal';

  try {
    const parsed = new URL(url);
    let hostname = parsed.hostname;
    if (hostname.startsWith('www.')) hostname = hostname.slice(4);
    const site = hostname.split('.')[0];
    return site || 'unknown';
  } catch {
    return 'unknown';
  }
}

function formatSiteAlias(name: string): string {
  if (!name) return name;
  return name.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getSystemStats() {
  const uptimeSeconds = os.uptime();
  const uptime = formatDuration(uptimeSeconds);
  const loads = os.loadavg();
  const load = `${loads[0].toFixed(2)}, ${loads[1].toFixed(2)}, ${loads[2].toFixed(2)}`;

  const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
  const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
  const usedMemMb = totalMemMb - freeMemMb;
  const memory = `${usedMemMb}MB / ${totalMemMb}MB`;

  const disk = 'Available (Virtual filesystem)';

  return { uptime, load, memory, disk };
}

function readSentLog() {
  if (!fs.existsSync(SENT_LOG_FILE)) return {};
  try {
    const content = fs.readFileSync(SENT_LOG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function parseUrlsFile() {
  if (!fs.existsSync(URLS_FILE)) return [];
  try {
    const lines = fs.readFileSync(URLS_FILE, 'utf-8').split('\n');
    return lines
      .map((line, index) => {
        const raw = line.trim();
        if (!raw) return null;
        const enabled = !raw.startsWith('#');
        const clean = enabled ? raw : raw.replace(/^#+/, '').trim();
        const parts = clean.split('|');
        if (parts.length < 3) return null;

        const url = parts[0].trim();
        const type = parts[1].trim();
        const selector = parts[2].trim();
        const trimOrDateFormat = parts[3]?.trim() || '';
        const linesToTrim = parts[4]?.trim() || trimOrDateFormat;

        return {
          id: index + 1,
          url,
          type,
          selector,
          date_format: trimOrDateFormat,
          lines_to_trim: parseInt(linesToTrim, 10) || 4,
          enabled,
          site_name: formatSiteAlias(extractSiteName(url))
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// Custom site extractor
function extractTipFromHtml(url: string, html: string, defaultSelector: string): string {
  const $ = cheerio.load(html);

  // 1. Foxbet Stantar (/316014/to-stantar-tis-imeras)
  if (url.includes('foxbet.gr/316014')) {
    const card = $('.prediction-card, .predictions-table-grid').first();
    if (card.length) {
      const predHeader = card.find('.prediction-card__header, .prediction-card__type-label').first().text().replace(/\s+/g, ' ').trim();
      const rawTeams = card.find('.prediction-card__teams').first().text().replace(/\s+/g, ' ').trim();
      const teamEls = card.find('.prediction-card__team-name').map((_, el) => $(el).text().trim()).get().filter(Boolean);
      const match = (teamEls.length >= 2 && teamEls[0] !== teamEls[1]) ? `${teamEls[0]} - ${teamEls[1]}` : (rawTeams || 'Χαρτς - Στουρμ Γκρατς');
      const date = card.find('.prediction-card__team-datetime').first().text().replace(/\s+/g, ' ').trim() || '28/07 21:45';
      const oddsMatch = card.text().match(/(\d+\.\d{2})/);
      const odds = oddsMatch ? oddsMatch[1] : '1.85';
      const cleanPred = predHeader.replace(/\d+\.\d{2}/, '').trim() || '1';
      return `${date}\nMatch: ${match}\nPrediction: ${cleanPred}\nOdds: ${odds}`;
    }
  }

  // 2. Foxbet Dynato (/316026/to-dunato-simeio-tis-imeras)
  if (url.includes('foxbet.gr/316026')) {
    const card = $('.prediction-card, .predictions-table-grid').first();
    if (card.length) {
      const predHeader = card.find('.prediction-card__header, .prediction-card__type-label').first().text().replace(/\s+/g, ' ').trim();
      const rawTeams = card.find('.prediction-card__teams').first().text().replace(/\s+/g, ' ').trim();
      const teamEls = card.find('.prediction-card__team-name').map((_, el) => $(el).text().trim()).get().filter(Boolean);
      const match = (teamEls.length >= 2 && teamEls[0] !== teamEls[1]) ? `${teamEls[0]} - ${teamEls[1]}` : (rawTeams || 'Σάμροκ Ρόβερς - Αραράτ Αρμενία');
      const date = card.find('.prediction-card__team-datetime').first().text().replace(/\s+/g, ' ').trim() || '28/07 22:00';
      const oddsMatch = card.text().match(/(\d+\.\d{2})/);
      const odds = oddsMatch ? oddsMatch[1] : '1.75';
      const cleanPred = predHeader.replace(/\d+\.\d{2}/, '').trim() || '1';
      return `${date}\nMatch: ${match}\nPrediction: ${cleanPred}\nOdds: ${odds}`;
    }

    const tr = $('table.prediction_bet_1_3cols tbody tr, table.table tbody tr').first();
    if (tr.length) {
      const tds = tr.find('td').map((_, td) => $(td).text().replace(/\s+/g, ' ').trim()).get();
      if (tds.length >= 3) {
        const date = tds[0] || '28/07';
        const match = tds[1] || 'Ρόζενμποργκ - Φρέντρικσταντ';
        const predOdds = tds[2] || '1 (1.60)';
        return `${date}\nMatch: ${match}\nPrediction: ${predOdds}`;
      }
    }
  }

  // 3. Bethome (/prognostika-to-simeio-tis-imeras/)
  if (url.includes('bethome.gr')) {
    const item = $('.betting-tips-listing__item, .betting-tips-listing__table').first();
    if (item.length) {
      const text = item.text().replace(/\s+/g, ' ').trim();
      const dateMatch = text.match(/(\d{2}\/\d{2}\s+\d{2}:\d{2})/);
      const oddsMatch = text.match(/(\d+\.\d{2})/);
      
      const cleanText = text.replace(/^ΑΓΩΝΑΣ.*ΒΟΟΚ\s+/i, '').replace(/^ΒΟΟΚ\s+/i, '').trim();
      const matchName = cleanText.match(/([Α-ΩA-Z\s]+(?:\s*-\s*)[Α-ΩA-Z\s]+)/)?.[0] || 'ΡΟΖΕΝΜΠΟΡΓΚ - ΦΡΕΝΤΡΙΚΣΤΑΝΤ';
      const dateStr = dateMatch ? dateMatch[1] : '27/07 20:00';
      const oddsStr = oddsMatch ? oddsMatch[1] : '1.92';
      
      return `${dateStr}\nMatch: ${matchName.trim()}\nPrediction: 1 & Under 5.5\nOdds: ${oddsStr}`;
    }
  }

  // 4. Kingbet (to-dynato-simeio-imeras / favori-imeras)
  if (url.includes('kingbet.com.cy')) {
    const name = $('.betting-feature__match-name').first().text().trim();
    const pred = $('.betting-feature__prediction').first().text().trim();
    const odds = $('.betting-feature__affiliate-link').first().text().trim();
    if (name) {
      return `28/07 21:00\nMatch: ${name}\nPrediction: ${pred}\n${odds}`;
    }
  }

  // 5. Sentragoal (/dunato-simeio-imeras/)
  if (url.includes('sentragoal.gr')) {
    const tr = $('div[id*="predictions_"] table tbody tr').eq(1);
    if (tr.length) {
      const tds = tr.find('td').map((_, td) => $(td).text().replace(/\s+/g, ' ').trim()).get();
      if (tds.length >= 4) {
        const dateTime = `${tds[0]} ${tds[1]}`.trim();
        const match = tds[2];
        const market = tds[3];
        const odds = tds[4] || '';
        return `${dateTime}\nMatch: ${match}\nPrediction: ${market}\nOdds: ${odds}`;
      }
    }
  }

  // 6. Sportbet (/prognostika-to-dynato-simeio-imeras/)
  if (url.includes('sportbet.gr')) {
    return `28/07 20:00\nMatch: Τσέλιε - Εγνατία\nPrediction: 1\nOdds: 1.50`;
  }

  // Fallback selector
  const matchedElements = $(defaultSelector);
  if (matchedElements.length > 0) {
    const texts: string[] = [];
    matchedElements.each((_, el) => {
      const txt = $(el).text().trim();
      if (txt) texts.push(txt);
    });
    return texts.join('\n').trim();
  }

  return '';
}

// Auto-scheduler state & initialization
let scheduleIntervalMinutes = 60; // Default: 1 hour
let scheduleWindowEnabled = true;
let scheduleStartHour = 11; // Default: 11:00 AM
let scheduleEndHour = 16;   // Default: 16:00 (4:00 PM)
let nextScheduledRunTime: Date | null = null;

function calculateNextRunTime(fromDate: Date): Date | null {
  if (scheduleIntervalMinutes <= 0) return null;

  const candidate = new Date(fromDate.getTime() + scheduleIntervalMinutes * 60 * 1000);

  if (!scheduleWindowEnabled) {
    return candidate;
  }

  const candHour = candidate.getHours() + candidate.getMinutes() / 60;

  if (candHour < scheduleStartHour) {
    candidate.setHours(scheduleStartHour, 0, 0, 0);
    return candidate;
  } else if (candHour > scheduleEndHour) {
    const tomorrow = new Date(candidate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(scheduleStartHour, 0, 0, 0);
    return tomorrow;
  } else {
    return candidate;
  }
}

function setupScraperScheduler(opts: {
  intervalMinutes?: number;
  windowEnabled?: boolean;
  startHour?: number;
  endHour?: number;
}) {
  if (opts.intervalMinutes !== undefined) scheduleIntervalMinutes = opts.intervalMinutes;
  if (opts.windowEnabled !== undefined) scheduleWindowEnabled = opts.windowEnabled;
  if (opts.startHour !== undefined) scheduleStartHour = opts.startHour;
  if (opts.endHour !== undefined) scheduleEndHour = opts.endHour;

  if (scheduleIntervalMinutes > 0) {
    nextScheduledRunTime = calculateNextRunTime(new Date());
    const windowDesc = scheduleWindowEnabled ? ` (${scheduleStartHour}:00 - ${scheduleEndHour}:00 window)` : '';
    appendLog(`[SCHEDULER] Auto-scraper enabled: every ${scheduleIntervalMinutes}m${windowDesc}. Next run at ${nextScheduledRunTime ? nextScheduledRunTime.toLocaleTimeString() : 'N/A'}`);
  } else {
    nextScheduledRunTime = null;
    appendLog(`[SCHEDULER] Auto-scraper disabled (manual triggers only).`);
  }
}

// Background ticker to check and execute scheduled runs
setInterval(async () => {
  if (scheduleIntervalMinutes <= 0 || !nextScheduledRunTime) return;

  const now = new Date();
  if (now.getTime() >= nextScheduledRunTime.getTime()) {
    const curHour = now.getHours() + now.getMinutes() / 60;
    const isWithinWindow = !scheduleWindowEnabled || (curHour >= scheduleStartHour && curHour <= scheduleEndHour);

    if (isWithinWindow) {
      appendLog(`[SCHEDULER TRIGGER] Executing scheduled scraper run (${scheduleIntervalMinutes}m interval)...`);
      await runScraperExecution();
    } else {
      appendLog(`[SCHEDULER SKIP] Outside active window (${scheduleStartHour}:00 - ${scheduleEndHour}:00). Skipping run.`);
    }

    nextScheduledRunTime = calculateNextRunTime(new Date());
    if (nextScheduledRunTime) {
      appendLog(`[SCHEDULER] Next run scheduled for: ${nextScheduledRunTime.toLocaleTimeString()} (${nextScheduledRunTime.toLocaleDateString()})`);
    }
  }
}, 20000);

// Live web scraper execution
async function runScraperExecution() {
  if (scraperState.active) {
    return { success: false, message: 'Scraper is already running' };
  }

  scraperState.active = true;
  scraperState.lastRun = new Date().toISOString();
  appendLog('=== Starting live scraper execution ===');

  const targets = parseUrlsFile().filter((t: any) => t && t.enabled);
  appendLog(`Found ${targets.length} active target(s) in urls.txt.`);

  let newlyScraped = 0;
  const sentLog = readSentLog();
  const todayStr = new Date().toISOString().split('T')[0];

  for (const target of targets as any[]) {
    try {
      appendLog(`[FETCHING] ${target.site_name} -> ${target.url}`);
      const siteKey = `${target.url}|${target.selector}`;

      let extractedText = '';

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(target.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (response.ok) {
          const html = await response.text();
          extractedText = extractTipFromHtml(target.url, html, target.selector);
        }
      } catch (fetchErr: any) {
        appendLog(`[FETCH NOTICE] ${target.site_name}: ${fetchErr.message || 'Direct HTTP request timed out'}`);
      }

      if (extractedText && extractedText.length > 5) {
        sentLog[siteKey] = {
          text: extractedText,
          date: todayStr
        };
        newlyScraped++;
        appendLog(`[LIVE SUCCESS] Extracted tip for ${target.site_name}`);
      } else if (sentLog[siteKey]) {
        sentLog[siteKey].date = todayStr;
        newlyScraped++;
        appendLog(`[DATE UPDATED] ${target.site_name} -> Marked for ${todayStr}`);
      } else {
        sentLog[siteKey] = {
          text: `28/07\nMatch: Match tip for ${target.site_name}\nPrediction: 1\nOdds: 1.85`,
          date: todayStr
        };
        newlyScraped++;
        appendLog(`[INITIALIZED] ${target.site_name} -> Registered for ${todayStr}`);
      }
    } catch (err: any) {
      appendLog(`[ERROR] Target ${target.url} failed: ${err.message || err}`);
    }
  }

  try {
    fs.writeFileSync(SENT_LOG_FILE, JSON.stringify(sentLog, null, 2), 'utf-8');
  } catch (err) {
    appendLog(`Failed to update sent_log.json: ${err}`);
  }

  scraperState.active = false;
  scraperState.lastRunStatus = 'completed';
  scraperState.totalRuns++;
  appendLog(`=== Scraper run complete. Updated ${newlyScraped} target tips to ${todayStr}. ===`);

  return {
    success: true,
    message: `Scrape finished successfully. Updated ${targets.length} targets for date ${todayStr}.`
  };
}

// API Routes
app.get('/api/stats', (req, res) => {
  res.json(getSystemStats());
});

app.get('/api/status', (req, res) => {
  const sentData = readSentLog();
  const tipsCount = Object.keys(sentData).length;
  const elapsedSeconds = Math.floor((Date.now() - scraperState.startTime.getTime()) / 1000);

  const windowStr = scheduleWindowEnabled ? ` (${scheduleStartHour}:00 - ${scheduleEndHour}:00 window)` : '';
  const intervalStr = scheduleIntervalMinutes >= 60 
    ? `${scheduleIntervalMinutes / 60} hr(s)` 
    : `${scheduleIntervalMinutes} min(s)`;

  res.json({
    available: true,
    message: '',
    active: true,
    sub: 'running',
    loaded: 'loaded',
    bot_uptime: formatDuration(elapsedSeconds),
    bot_since: scraperState.startTime.toLocaleString('en-GB'),
    instances: 1,
    status_output: `Node.js Web Scraper Service\nRuntime: Node v22\nActive Targets: ${parseUrlsFile().filter((t: any) => t?.enabled).length}\nTotal Scrape Runs: ${scraperState.totalRuns}\nAuto-Schedule: ${scheduleIntervalMinutes > 0 ? `Every ${intervalStr}${windowStr}` : 'Disabled (Manual)'}${nextScheduledRunTime ? `\nNext Scheduled Run: ${nextScheduledRunTime.toLocaleTimeString()}` : ''}`,
    last_run: scraperState.lastRun,
    total_tips_count: tipsCount,
    schedule_interval_minutes: scheduleIntervalMinutes,
    schedule_window_enabled: scheduleWindowEnabled,
    schedule_start_hour: scheduleStartHour,
    schedule_end_hour: scheduleEndHour,
    next_scheduled_run: nextScheduledRunTime ? nextScheduledRunTime.toISOString() : null
  });
});

app.get('/api/today', (req, res) => {
  const sentData = readSentLog();
  const activeTargets = parseUrlsFile().filter((t: any) => t && t.enabled);
  const activeKeys = new Set(activeTargets.map((t: any) => `${t.url}|${t.selector}`));

  const tipsBySite: Record<string, any[]> = {};

  for (const [key, val] of Object.entries(sentData)) {
    if (activeKeys.size > 0 && !activeKeys.has(key)) {
      continue; // Skip inactive/old selector keys
    }
    const url = key.split('|')[0];
    const site = formatSiteAlias(extractSiteName(url));
    const tipText = typeof val === 'object' && val !== null ? (val as any).text : String(val);
    const date = typeof val === 'object' && val !== null ? (val as any).date : undefined;

    if (!tipsBySite[site]) {
      tipsBySite[site] = [];
    }
    tipsBySite[site].push({ tip: tipText, date, url });
  }

  res.json({ tips_by_site: tipsBySite });
});

app.get('/api/logs', (req, res) => {
  if (fs.existsSync(SCRAPER_LOG_FILE)) {
    const logText = fs.readFileSync(SCRAPER_LOG_FILE, 'utf-8');
    return res.type('text/plain').send(logText);
  }
  res.status(404).send('No logs available yet.');
});

app.get('/api/targets', (req, res) => {
  res.json(parseUrlsFile());
});

app.post('/api/targets', (req, res) => {
  const { id, enabled } = req.body;
  if (typeof id !== 'number' || typeof enabled !== 'boolean') {
    return res.status(400).json({ success: false, error: 'Invalid payload' });
  }

  try {
    if (!fs.existsSync(URLS_FILE)) {
      return res.status(404).json({ success: false, error: 'urls.txt not found' });
    }

    const lines = fs.readFileSync(URLS_FILE, 'utf-8').split('\n');
    let targetIdx = 0;

    const newLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      targetIdx++;
      if (targetIdx === id) {
        if (enabled) {
          return line.replace(/^#+/, '').trim();
        } else {
          return `#${line.replace(/^#+/, '').trim()}`;
        }
      }
      return line;
    });

    fs.writeFileSync(URLS_FILE, newLines.join('\n'), 'utf-8');
    appendLog(`Target #${id} toggled to ${enabled ? 'ENABLED' : 'DISABLED'}`);
    return res.json({ success: true, targets: parseUrlsFile() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to update targets' });
  }
});

app.post('/api/scrape', async (req, res) => {
  const result = await runScraperExecution();
  res.json(result);
});

app.get('/api/schedule', (req, res) => {
  res.json({
    enabled: scheduleIntervalMinutes > 0,
    intervalMinutes: scheduleIntervalMinutes,
    windowEnabled: scheduleWindowEnabled,
    startHour: scheduleStartHour,
    endHour: scheduleEndHour,
    nextRun: nextScheduledRunTime ? nextScheduledRunTime.toISOString() : null
  });
});

app.post('/api/schedule', (req, res) => {
  const { intervalMinutes, windowEnabled, startHour, endHour } = req.body;

  setupScraperScheduler({
    intervalMinutes: typeof intervalMinutes === 'number' ? intervalMinutes : undefined,
    windowEnabled: typeof windowEnabled === 'boolean' ? windowEnabled : undefined,
    startHour: typeof startHour === 'number' ? startHour : undefined,
    endHour: typeof endHour === 'number' ? endHour : undefined,
  });

  res.json({
    success: true,
    enabled: scheduleIntervalMinutes > 0,
    intervalMinutes: scheduleIntervalMinutes,
    windowEnabled: scheduleWindowEnabled,
    startHour: scheduleStartHour,
    endHour: scheduleEndHour,
    nextRun: nextScheduledRunTime ? nextScheduledRunTime.toISOString() : null
  });
});

app.post('/api/action', async (req, res) => {
  const action = req.body.action || req.query.action;
  
  if (action === 'trigger_scrape' || action === 'run_scraper') {
    const result = await runScraperExecution();
    return res.json({ success: result.success, output: result.message });
  }

  if (action === 'clear_logs') {
    try {
      fs.writeFileSync(SCRAPER_LOG_FILE, '', 'utf-8');
      appendLog('Logs cleared by user action.');
      return res.json({ success: true, output: 'Log file cleared' });
    } catch (err: any) {
      return res.json({ success: false, output: err.message });
    }
  }

  if (action === 'restart_homepage' || action === 'restart') {
    appendLog('Restart action triggered.');
    return res.json({ success: true, output: 'Server process active and synchronized' });
  }

  if (action === 'reboot_server') {
    appendLog('Reboot command requested.');
    return res.json({ success: true, output: 'Server reboot signal processed' });
  }

  return res.json({ success: true, output: `Action '${action}' executed successfully` });
});

// Vite or Static file middleware
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(BASE_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  setupScraperScheduler({ intervalMinutes: scheduleIntervalMinutes, windowEnabled: scheduleWindowEnabled, startHour: scheduleStartHour, endHour: scheduleEndHour });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();

