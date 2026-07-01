'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart
} from 'recharts';
import { ResponsiveGridLayout, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Play, 
  GitCommit, 
  Activity, 
  Server, 
  Terminal, 
  Layers, 
  CheckSquare, 
  Radio, 
  RefreshCw, 
  Sparkles,
  Heart,
  AlertCircle,
  Compass,
  ArrowRight,
  Plus,
  Target,
  FileText,
  Folder,
  FileCode,
  GitBranch,
  Star,
  Download,
  Bell,
  BellRing,
  TrendingUp,
  Zap,
  Flag,
  ChevronDown,
  X,
  BarChart2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  Copy,
  Trash2
} from 'lucide-react';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface RepoDetails {
  detail: any;
  commits: any[];
  contents: any[];
}

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  last_active: string;
}

interface Commit {
  id: string;
  message: string;
  author_name: string;
  branch: string;
  added_lines: number;
  deleted_lines: number;
  modified_files: string[];
  commit_time: string;
  sha: string;
}

interface IssueTask {
  id: string;
  title: string;
  status: string;
  progress: number;
  subtasks: { title: string; done: boolean }[];
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  description: string;
  html_url: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
}

// ─── Interactive Terminal Component ────────────────────────────────────────────
function InteractiveTerminal({ agents, onCommand }: { agents: any[], onCommand: (cmd: string) => Promise<string> }) {
  const [history, setHistory] = useState<{ type: 'input' | 'output', text: string }[]>([
    { type: 'output', text: 'ANTIGRAVITY TERMINAL v1.0.0 INITIALIZED.' },
    { type: 'output', text: 'Type "help" for available commands.' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const cmd = input.trim();
    setHistory(prev => [...prev, { type: 'input', text: '> ' + cmd }]);
    setInput('');

    if (cmd.toLowerCase() === 'clear') {
      setHistory([]);
      return;
    }

    setIsProcessing(true);
    try {
      const output = await onCommand(cmd);
      setHistory(prev => [...prev, { type: 'output', text: output }]);
    } catch (err: any) {
      setHistory(prev => [...prev, { type: 'output', text: 'Error: ' + err.message }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="border border-blue-700/40 bg-blue-950 text-blue-300 font-mono text-[10px] h-full flex flex-col h-[300px]">
      <div className="bg-blue-900/50 p-2 border-b border-blue-700/40 font-bold tracking-widest text-blue-200">
        {">_ SYSTEM_CONSOLE"}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {history.map((line, i) => (
          <div key={i} className={`${line.type === 'input' ? 'text-blue-100' : 'text-blue-400'}`}>
            <pre className="font-mono text-[10px] whitespace-pre-wrap font-inherit m-0">{line.text}</pre>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t border-blue-700/40 p-2 flex bg-blue-900/20">
        <span className="text-blue-400 mr-2">{">"}</span>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isProcessing}
          className="bg-transparent flex-1 outline-none text-blue-100 placeholder-blue-700/50 disabled:opacity-50"
          placeholder={isProcessing ? "PROCESSING..." : "ENTER COMMAND..."}
          spellCheck={false}
        />
      </form>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

// ─── Kanban Board Component ───────────────────────────────────────────────────
function KanbanBoard({ goals, onStatusChange }: { goals: any[], onStatusChange: (id: string, status: string) => void }) {
  const inProgress = goals.filter(g => g.status !== 'Achieved');
  const achieved = goals.filter(g => g.status === 'Achieved');

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Check if dragging over a different column
    if (overId === 'column-inprogress' || overId === 'column-achieved') {
       const newStatus = overId === 'column-achieved' ? 'Achieved' : 'In Progress';
       const goal = goals.find(g => g.id === activeId);
       if (goal && goal.status !== newStatus) {
         onStatusChange(activeId, newStatus);
       }
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 gap-4 h-[250px]">
        {/* In Progress Column */}
        <div className="bg-blue-50/50 p-2 border border-blue-700/20 flex flex-col">
          <div className="font-bold text-blue-900 text-[10px] mb-2 border-b border-blue-700/10 pb-1">IN PROGRESS ({inProgress.length})</div>
          <SortableContext id="column-inprogress" items={inProgress} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 overflow-y-auto flex-1 min-h-[50px]" id="column-inprogress">
              {inProgress.map(goal => <SortableGoalItem key={goal.id} goal={goal} onStatusChange={onStatusChange} />)}
            </div>
          </SortableContext>
        </div>
        
        {/* Achieved Column */}
        <div className="bg-emerald-50/30 p-2 border border-emerald-700/20 flex flex-col">
          <div className="font-bold text-emerald-900 text-[10px] mb-2 border-b border-emerald-700/10 pb-1">ACHIEVED ({achieved.length})</div>
          <SortableContext id="column-achieved" items={achieved} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 overflow-y-auto flex-1 min-h-[50px]" id="column-achieved">
              {achieved.map(goal => <SortableGoalItem key={goal.id} goal={goal} onStatusChange={onStatusChange} />)}
            </div>
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
}

// ─── DnD Sortable Component ──────────────────────────────────────────────────
function SortableGoalItem({ goal, onStatusChange }: { goal: any, onStatusChange: (id: string, newStatus: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: goal.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-blue-50 border border-blue-700/20 p-3 flex justify-between items-center cursor-grab active:cursor-grabbing">
      <div className="overflow-hidden flex-1 mr-2">
        <div className="font-bold text-blue-900 text-[10px] truncate">{goal.title}</div>
        <div className="text-[9px] text-blue-800/60 font-mono truncate">
          Priority: {goal.priority} | Agent: {goal.assigned_agent}
        </div>
      </div>
      <div className={`text-[8px] font-bold px-2 py-0.5 border ${goal.status === 'Achieved' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>
        {goal.status.toUpperCase()}
      </div>
    </div>
  );
}

interface Goal {
  id: string;
  title: string;
  description: string;
  status: string;
  prompt?: string;
  assigned_agent?: string;
  priority?: 'High' | 'Medium' | 'Low';
  created_at: string;
}

interface DailyReport {
  id: string;
  report_date: string;
  content: string;
  summary_short: string;
}

interface Notification {
  id: string;
  type: 'commit' | 'goal' | 'agent' | 'error';
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

interface PasswordItem {
  id: string;
  title: string;
  username: string;
  password_val: string;
  website_url?: string;
  notes?: string;
  created_at?: string;
}

// ─── Time range config ───────────────────────────────────────────────────────
export type TimeRange = '7d' | '1m' | '3m' | '6m' | '1y';
const TIME_RANGE_CONFIG: Record<TimeRange, { label: string; days: number; groupBy: 'day' | 'week' | 'month' }> = {
  '7d':  { label: 'LAST 7 DAYS',    days: 7,   groupBy: 'day'   },
  '1m':  { label: 'LAST 1 MONTH',   days: 30,  groupBy: 'day'   },
  '3m':  { label: 'LAST 3 MONTHS',  days: 90,  groupBy: 'week'  },
  '6m':  { label: 'LAST 6 MONTHS',  days: 180, groupBy: 'week'  },
  '1y':  { label: 'LAST 1 YEAR',    days: 365, groupBy: 'month' },
};

// ─── Helper: build commit chart data with flexible range ─────────────────────
function buildChartData(commits: Commit[], range: TimeRange = '7d') {
  const { days: totalDays, groupBy } = TIME_RANGE_CONFIG[range];
  const buckets: { date: string; label: string; commits: number; added: number; deleted: number }[] = [];

  if (groupBy === 'day') {
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const fmt = totalDays <= 7
        ? d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
        : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      buckets.push({ date: key, label: fmt, commits: 0, added: 0, deleted: 0 });
    }
    commits.forEach(c => {
      const day = c.commit_time?.split('T')[0];
      const entry = buckets.find(b => b.date === day);
      if (entry) { entry.commits++; entry.added += c.added_lines || 0; entry.deleted += c.deleted_lines || 0; }
    });

  } else if (groupBy === 'week') {
    const numWeeks = Math.ceil(totalDays / 7);
    for (let i = numWeeks - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7 - 6);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const key = `week-${i}`;
      const label = weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      buckets.push({ date: key, label, commits: 0, added: 0, deleted: 0 });
      // store bounds for matching
      (buckets[buckets.length - 1] as any)._start = weekStart.toISOString().split('T')[0];
      (buckets[buckets.length - 1] as any)._end = weekEnd.toISOString().split('T')[0];
    }
    commits.forEach(c => {
      const day = c.commit_time?.split('T')[0];
      const entry = buckets.find(b => (b as any)._start <= day && day <= (b as any)._end);
      if (entry) { entry.commits++; entry.added += c.added_lines || 0; entry.deleted += c.deleted_lines || 0; }
    });

  } else { // month
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      buckets.push({ date: key, label, commits: 0, added: 0, deleted: 0 });
    }
    commits.forEach(c => {
      const key = c.commit_time?.substring(0, 7);
      const entry = buckets.find(b => b.date === key);
      if (entry) { entry.commits++; entry.added += c.added_lines || 0; entry.deleted += c.deleted_lines || 0; }
    });
  }

  return buckets;
}

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  High:   { color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-400',   dot: 'bg-rose-500'   },
  Medium: { color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-400',  dot: 'bg-amber-500'  },
  Low:    { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-400', dot: 'bg-emerald-500' },
};

// ─── Custom Tooltip for Recharts ──────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-blue-700/30 px-3 py-2 shadow-lg font-mono text-[10px] text-blue-900">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ─── Notification Toast ───────────────────────────────────────────────────────
function NotificationToast({ notif, onClose }: { notif: Notification; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  const icon = notif.type === 'commit' ? <GitCommit className="h-3.5 w-3.5 text-blue-600" /> :
               notif.type === 'goal'   ? <Target className="h-3.5 w-3.5 text-emerald-600" /> :
               notif.type === 'error'  ? <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> :
                                         <Zap className="h-3.5 w-3.5 text-amber-600" />;
  return (
    <div className="flex items-start gap-2 bg-white border border-blue-700/30 shadow-xl p-3 w-72 animate-slide-in">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-blue-900 text-[10px] uppercase tracking-wide">{notif.title}</p>
        <p className="text-blue-800/60 text-[9px] font-mono mt-0.5 leading-snug">{notif.message}</p>
      </div>
      <button onClick={onClose} className="text-blue-700/40 hover:text-blue-700 transition-colors">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Heatmap helpers ─────────────────────────────────────────────────────────
function getHeatmapColor(count: number): string {
  if (count === 0) return '#e2e8f0'; // slate-200 (empty)
  if (count === 1) return '#bfdbfe'; // blue-200
  if (count <= 3)  return '#60a5fa'; // blue-400
  if (count <= 6)  return '#2563eb'; // blue-600
  if (count <= 10) return '#1d4ed8'; // blue-700
  return '#1e3a8a';                  // blue-900
}

function buildHeatmapData(commits: Commit[], year: number) {
  // Count commits per day for this year
  const countMap: Record<string, number> = {};
  commits.forEach(c => {
    const d = c.commit_time?.split('T')[0];
    if (d && d.startsWith(String(year))) {
      countMap[d] = (countMap[d] || 0) + 1;
    }
  });

  const start = new Date(year, 0, 1);
  const end   = new Date(year, 11, 31);
  const weeks: { date: string | null; count: number; dow: number }[][] = [];
  let currentWeek: { date: string | null; count: number; dow: number }[] = [];

  // Leading empty days (Sun=0)
  const startDow = start.getDay();
  for (let d = 0; d < startDow; d++) currentWeek.push({ date: null, count: 0, dow: d });

  const cur = new Date(start);
  while (cur <= end) {
    const key = cur.toISOString().split('T')[0];
    const dow = cur.getDay();
    currentWeek.push({ date: key, count: countMap[key] || 0, dow });
    if (dow === 6) { weeks.push(currentWeek); currentWeek = []; }
    cur.setDate(cur.getDate() + 1);
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push({ date: null, count: 0, dow: currentWeek.length });
    weeks.push(currentWeek);
  }

  const totalCommits = Object.values(countMap).reduce((s, v) => s + v, 0);
  return { weeks, totalCommits };
}

// ─── Commit Heatmap Component ─────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// GitHub week day struct → our grid format
function convertGitHubWeeks(ghWeeks: any[]): { date: string; count: number; dow: number }[][] {
  return ghWeeks.map(w =>
    w.contributionDays.map((d: any) => ({
      date: d.date,
      count: d.contributionCount,
      dow: d.weekday,
    }))
  );
}

function CommitHeatmap({
  commits, year, onYearChange, gitToken,
}: {
  commits: Commit[];
  year: number;
  onYearChange: (y: number) => void;
  gitToken: string | null;
}) {
  const [ghData, setGhData]     = React.useState<any>(null);
  const [loading, setLoading]   = React.useState(false);
  const [ghError, setGhError]   = React.useState('');
  const [tooltip, setTooltip]   = React.useState<{ text: string; x: number; y: number } | null>(null);

  // Fetch real GitHub contribution data whenever token or year changes
  useEffect(() => {
    if (!gitToken) { setGhData(null); return; }
    setLoading(true); setGhError('');
    fetch('/api/github/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: gitToken, year }),
    })
      .then(r => r.json())
      .then(d => { if (d.success) setGhData(d); else setGhError(d.error || 'GitHub API error'); })
      .catch(e => setGhError(e.message))
      .finally(() => setLoading(false));
  }, [gitToken, year]);

  // Decide which data source to use
  const weeks: { date: string | null; count: number; dow: number }[][] = ghData
    ? convertGitHubWeeks(ghData.weeks)
    : buildHeatmapData(commits, year).weeks;

  const totalContributions = ghData
    ? ghData.totalContributions
    : buildHeatmapData(commits, year).totalCommits;

  // Month label positions
  const monthPositions: { label: string; col: number }[] = [];
  weeks.forEach((week, wi) => {
    week.forEach(day => {
      if (day.date?.endsWith('-01')) {
        const m = parseInt(day.date.split('-')[1], 10) - 1;
        monthPositions.push({ label: MONTH_NAMES[m], col: wi });
      }
    });
  });

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
  const CELL  = 11;
  const GAP   = 2;

  return (
    <div className="border border-blue-700/40 p-6 bg-white space-y-4 resize overflow-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center border-b border-blue-700/10 pb-3 gap-3">
        <div>
          <h2 className="font-serif italic text-lg font-black text-blue-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-700" />
            CONTRIBUTION HEATMAP
            {ghData?.login && (
              <span className="text-[10px] font-mono font-normal text-blue-700/60 normal-case tracking-normal">
                @{ghData.login}
              </span>
            )}
          </h2>
          <p className="font-mono text-[9px] text-blue-800/50 mt-0.5">
            {loading ? (
              <span className="animate-pulse">LOADING FROM GITHUB...</span>
            ) : ghError ? (
              <span className="text-rose-600">{ghError}</span>
            ) : (
              <>
                <span className="font-bold text-blue-900">{totalContributions.toLocaleString()}</span>
                {' '}CONTRIBUTIONS IN {year}
                {ghData && (
                  <span className="ml-3 gap-2 inline-flex">
                    <span className="text-blue-700">↗ {ghData.totalCommits} commits</span>
                    <span className="text-violet-600">⟳ {ghData.totalPRs} PRs</span>
                    <span className="text-amber-600">◎ {ghData.totalIssues} issues</span>
                    <span className="text-emerald-600">✓ {ghData.totalReviews} reviews</span>
                  </span>
                )}
                {!gitToken && <span className="ml-2 text-blue-800/30">(connect GitHub for real data)</span>}
              </>
            )}
          </p>
        </div>
        {/* Year Selector */}
        <div className="flex gap-1 border border-blue-700/20 p-0.5 bg-slate-50">
          {years.map(y => (
            <button
              key={y}
              onClick={() => onYearChange(y)}
              className={`px-3 py-1.5 text-[9px] font-bold font-mono transition-all ${
                y === year ? 'bg-blue-700 text-white' : 'text-blue-700/60 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-1" style={{ position: 'relative', opacity: loading ? 0.4 : 1, transition: 'opacity 0.3s' }}>
        {/* Month labels */}
        <div className="flex mb-1" style={{ paddingLeft: 32 }}>
          {(() => {
            const labels: React.ReactNode[] = [];
            let lastCol = -1;
            monthPositions.forEach(({ label, col }) => {
              if (col - lastCol > 1) {
                labels.push(
                  <span
                    key={label + col}
                    className="font-mono text-[8px] text-blue-800/50 uppercase"
                    style={{ width: (col - Math.max(lastCol, 0)) * (CELL + GAP), display: 'inline-block' }}
                  >
                    {label}
                  </span>
                );
                lastCol = col;
              }
            });
            labels.push(<span key="end" className="flex-1" />);
            return labels;
          })()}
        </div>

        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col justify-between mr-1" style={{ height: 7 * (CELL + GAP) - GAP }}>
            {DAY_LABELS.map((d, i) => (
              <span
                key={d}
                className="font-mono text-[7px] text-blue-800/40 uppercase leading-none"
                style={{ height: CELL, display: 'flex', alignItems: 'center' }}
              >
                {i % 2 === 1 ? d : ''}
              </span>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display: 'flex', gap: GAP, flexDirection: 'row' }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    onMouseEnter={e => {
                      if (!day.date) return;
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({
                        text: `${day.count} contribution${day.count !== 1 ? 's' : ''} — ${day.date}`,
                        x: rect.left,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      backgroundColor: day.date ? getHeatmapColor(day.count) : 'transparent',
                      cursor: day.date ? 'pointer' : 'default',
                      border: day.date ? '1px solid rgba(30,58,138,0.08)' : 'none',
                      transition: 'transform 0.1s',
                    }}
                    className={day.date && day.count > 0 ? 'hover:scale-125' : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 bg-blue-900 text-white font-mono text-[9px] px-2 py-1 pointer-events-none shadow-lg"
            style={{ top: tooltip.y - 28, left: tooltip.x }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 justify-end pt-1 border-t border-blue-700/10">
        <span className="font-mono text-[8px] text-blue-800/40">LESS</span>
        {[0, 1, 3, 6, 10, 12].map(n => (
          <div
            key={n}
            style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: getHeatmapColor(n), border: '1px solid rgba(30,58,138,0.10)' }}
          />
        ))}
        <span className="font-mono text-[8px] text-blue-800/40">MORE</span>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [agents, setAgents]     = useState<Agent[]>([]);
  const [commits, setCommits]   = useState<Commit[]>([]);
  const [tasks, setTasks]       = useState<IssueTask[]>([]);
  const [activeRepo, setActiveRepo] = useState<any>(null);
  
  // Goals
  const [goals, setGoals]           = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc]   = useState('');
  const [newGoalPrompt, setNewGoalPrompt] = useState('');
  const [assignedAgent, setAssignedAgent] = useState('UI Agent');
  const [newGoalPriority, setNewGoalPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  // Reports
  const [antigravityReports, setAntigravityReports] = useState<any[]>([]);

  // State untuk GitHub Repositories
  const [gitToken, setGitToken] = useState<string | null>(null);
  const [gitRepos, setGitRepos] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState('');
  
  // State untuk Filter & Search Repositories
  const [repoSearch, setRepoSearch] = useState('');
  const [repoFilter, setRepoFilter] = useState<'All' | 'Kerjaan' | 'Side Project'>('All');
  const [customCategories, setCustomCategories] = useState<Record<string, string>>({});

  // Password Vault State
  const [passwords, setPasswords] = useState<PasswordItem[]>([]);
  const [passSearch, setPassSearch] = useState('');
  const [newPassTitle, setNewPassTitle] = useState('');
  const [newPassUser, setNewPassUser] = useState('');
  const [newPassVal, setNewPassVal] = useState('');
  const [newPassUrl, setNewPassUrl] = useState('');
  const [newPassNotes, setNewPassNotes] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('versatiles_repo_categories');
    if (saved) setCustomCategories(JSON.parse(saved));
  }, []);

  const toggleCategory = (e: React.MouseEvent, repoId: string, currentCategory: string) => {
    e.stopPropagation();
    const nextCategory = currentCategory === 'Kerjaan' ? 'Side Project' : 'Kerjaan';
    const nextCategories = { ...customCategories, [repoId]: nextCategory };
    setCustomCategories(nextCategories);
    localStorage.setItem('versatiles_repo_categories', JSON.stringify(nextCategories));
  };

  // Repo Explorer
  const [repoDetails, setRepoDetails]       = useState<RepoDetails | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // Simulator
  const [selectedAgent, setSelectedAgent] = useState('UI Agent');
  const [simMessage, setSimMessage]       = useState('feat(login): [x] UI redesign login page responsive');
  const [filesCount, setFilesCount]       = useState(3);
  const [isSimulating, setIsSimulating]   = useState(false);
  const [simStatus, setSimStatus]         = useState('');

  // Chart
  const [heatmapYear, setHeatmapYear] = useState<number>(new Date().getFullYear());
  const [chartData, setChartData]   = useState<any[]>([]);
  const [chartMode, setChartMode]   = useState<'commits' | 'lines'>('commits');
  const [timeRange, setTimeRange]   = useState<TimeRange>('7d');
  const allCommitsRef               = useRef<Commit[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts]               = useState<Notification[]>([]);
  const [showBell, setShowBell]           = useState(false);
  const prevCommitsRef = useRef<string[]>([]);

  // Refs
  const activeRepoRef = useRef<any>(null);
  useEffect(() => { activeRepoRef.current = activeRepo; }, [activeRepo]);

  // ── Add Notification helper ──────────────────────────────────────────────
  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const n: Notification = { ...notif, id: Math.random().toString(36).slice(2), time: new Date(), read: false };
    setNotifications(prev => [n, ...prev].slice(0, 50));
    setToasts(prev => [...prev, n]);
  }, []);

  // ── fetchData ────────────────────────────────────────────────────────────
  const fetchData = async (overrideRepo?: any) => {
    let currentRepo = overrideRepo || activeRepoRef.current;
    
    if (!currentRepo) {
      const { data: repos } = await supabase.from('repositories').select('*').limit(1);
      if (repos && repos.length > 0) {
        currentRepo = repos[0];
        setActiveRepo(currentRepo);
      }
    }

    const { data: agentsData } = await supabase.from('agents').select('*').order('name', { ascending: true });
    if (agentsData) setAgents(agentsData);

    const { data: commitsData } = await supabase
      .from('commits').select('*').order('commit_time', { ascending: false }).limit(500);
    if (commitsData) {
      // Detect new commits for notifications
      const newIds = commitsData.map(c => c.id);
      const newOnes = commitsData.filter(c => !prevCommitsRef.current.includes(c.id));
      if (prevCommitsRef.current.length > 0 && newOnes.length > 0) {
        newOnes.forEach(c => addNotification({
          type: 'commit',
          title: 'New Commit Received',
          message: `${c.author_name}: ${c.message.substring(0, 60)}`,
        }));
      }
      prevCommitsRef.current = newIds;
      allCommitsRef.current = commitsData;
      setCommits(commitsData.slice(0, 15));
      setChartData(buildChartData(commitsData, timeRange));
    }

    if (currentRepo) {
      const { data: tasksData } = await supabase
        .from('issues_tasks').select('*').eq('repo_id', currentRepo.id)
        .order('created_at', { ascending: false }).limit(1);
      if (tasksData) setTasks(tasksData);

      const { data: goalsData } = await supabase
        .from('goals').select('*').eq('repo_id', currentRepo.id)
        .order('created_at', { ascending: false });
      if (goalsData) setGoals(goalsData);

      fetch('/api/antigravity-report')
        .then(res => res.json())
        .then(data => { if (data.success) setAntigravityReports(data.reports.reverse()); })
        .catch(console.error);
    }

    // Fetch passwords
    const { data: passData } = await supabase.from('passwords').select('*').order('created_at', { ascending: false });
    if (passData) setPasswords(passData);
  };

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token');
    if (token) {
      setGitToken(token);
      localStorage.setItem('gh_access_token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const saved = localStorage.getItem('gh_access_token');
      if (saved) setGitToken(saved);
    }
    
    fetchData();

    const agentsSub  = supabase.channel('agents-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => fetchData()).subscribe();
    const commitsSub = supabase.channel('commits-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'commits' }, () => fetchData()).subscribe();
    const tasksSub   = supabase.channel('tasks-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'issues_tasks' }, () => fetchData()).subscribe();
    const goalsSub   = supabase.channel('goals-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => { fetchData(); addNotification({ type: 'goal', title: 'Goal Updated', message: 'Project goal list has been updated.' }); }).subscribe();
    const reportsSub = supabase.channel('reports-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'daily_reports' }, () => fetchData()).subscribe();
    const passSub    = supabase.channel('passwords-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'passwords' }, () => fetchData()).subscribe();

    return () => {
      supabase.removeChannel(agentsSub);
      supabase.removeChannel(commitsSub);
      supabase.removeChannel(tasksSub);
      supabase.removeChannel(goalsSub);
      supabase.removeChannel(reportsSub);
      supabase.removeChannel(passSub);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gitToken) {
      setIsLoadingRepos(true);
      fetch('/api/github/repos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: gitToken }) })
        .then(r => r.json())
        .then(d => { if (d.repos) setGitRepos(d.repos); else setRepoError(d.error || 'Gagal'); })
        .catch(e => setRepoError(e.message))
        .finally(() => setIsLoadingRepos(false));
    }
  }, [gitToken]);

  useEffect(() => {
    if (activeRepo && gitToken) {
      setIsFetchingDetails(true);
      fetch('/api/github/repo-details', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: gitToken, owner: activeRepo.owner, repo: activeRepo.name }) })
        .then(r => r.json())
        .then(d => { if (d.success) setRepoDetails(d); })
        .catch(console.error)
        .finally(() => setIsFetchingDetails(false));
    } else {
      setRepoDetails(null);
    }
  }, [activeRepo, gitToken]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const selectRepo = async (repo: GitHubRepo) => {
    try {
      let { data: existing, error } = await supabase.from('repositories').select('*').eq('github_repo_id', repo.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (!existing) {
        const { data: newRepo, error: ie } = await supabase.from('repositories').insert({ github_repo_id: repo.id, name: repo.name, full_name: repo.full_name, owner: repo.owner }).select().single();
        if (ie) throw ie;
        existing = newRepo;
      }
      setActiveRepo(existing);
      fetchData(existing);
    } catch (err: any) {
      const fallback = { ...repo, id: repo.id.toString() };
      setActiveRepo(fallback);
      fetchData(fallback);
    }
  };

  const handleAddManualRepo = async (ownerRepoSlug: string) => {
    if (!ownerRepoSlug.includes('/')) {
      alert('Format harus owner/repo (contoh: shimatachi/Sistem-Gudang-Cimanggis2)');
      return;
    }
    const [owner, repo] = ownerRepoSlug.split('/');
    setIsLoadingRepos(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${gitToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!res.ok) throw new Error('Repo tidak ditemukan. Pastikan nama benar dan repo bersifat public, atau kamu punya aksesnya.');
      const data = await res.json();
      
      const newRepo = {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        owner: data.owner.login,
        description: data.description,
        html_url: data.html_url
      };
      
      setGitRepos(prev => [newRepo, ...prev]);
      setRepoSearch('');
      alert('Repo berhasil ditambahkan ke daftar!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRepo) { alert('Pilih repositori aktif terlebih dahulu!'); return; }
    setIsAddingGoal(true);
    try {
      const { error } = await supabase.from('goals').insert({
        repo_id: activeRepo.id,
        title: newGoalTitle,
        description: newGoalDesc,
        prompt: newGoalPrompt || null,
        assigned_agent: assignedAgent,
        priority: newGoalPriority,
        status: 'In Progress'
      });
      if (error) throw error;
      addNotification({ type: 'goal', title: 'Task Assigned!', message: `"${newGoalTitle}" → ${assignedAgent} [${newGoalPriority}]` });
      setNewGoalTitle(''); setNewGoalDesc(''); setNewGoalPrompt('');
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsAddingGoal(false);
    }
  };

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassTitle || !newPassVal) return;
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.from('passwords').insert({
        title: newPassTitle,
        username: newPassUser,
        password_val: newPassVal,
        website_url: newPassUrl,
        notes: newPassNotes,
        user_id: 'default_user'
      });
      if (error) throw error;
      setNewPassTitle('');
      setNewPassUser('');
      setNewPassVal('');
      setNewPassUrl('');
      setNewPassNotes('');
      fetchData();
      addNotification({ type: 'agent', title: 'Password Saved', message: `Password for "${newPassTitle}" successfully saved.` });
    } catch (err: any) {
      alert('Error saving password: ' + err.message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeletePassword = async (id: string, title: string) => {
    if (!confirm(`Hapus password untuk "${title}"?`)) return;
    try {
      const { error } = await supabase.from('passwords').delete().eq('id', id);
      if (error) throw error;
      fetchData();
      addNotification({ type: 'error', title: 'Password Deleted', message: `Password for "${title}" has been deleted.` });
    } catch (err: any) {
      alert('Error deleting password: ' + err.message);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addNotification({ type: 'agent', title: 'Copied to Clipboard', message: `${label} copied successfully.` });
  };

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('report-content');
      if (el) {
        el.style.backgroundColor = '#ffffff'; el.style.padding = '20px';
        const canvas = await html2canvas(el, { scale: 2 });
        el.style.backgroundColor = ''; el.style.padding = '';
        const img = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(img, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
        pdf.save('Antigravity_Reports.pdf');
      }
    } catch { alert('Gagal PDF. Pastikan jspdf & html2canvas terinstall.'); }
  };

  const handleDownloadDoc = () => {
    const header = "<html><head><meta charset='utf-8'></head><body>";
    let src = header + "<h2>ANTIGRAVITY LIVE REPORTS</h2>";
    antigravityReports.forEach(r => {
      src += `<div style="margin-bottom:20px;border-bottom:1px solid #ccc;padding-bottom:10px;font-family:monospace;"><p><strong>Time:</strong> ${new Date(r.timestamp||r.receivedAt).toLocaleString()}</p><p><strong>Summary:</strong> ${r.summary}</p><p><strong>Details:</strong><br/>${(r.details||'').replace(/\n/g,'<br/>')}</p></div>`;
    });
    src += "</body></html>";
    const a = document.createElement('a');
    a.href = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(src);
    a.download = 'Antigravity_Reports.doc';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const toggleGoalStatus = async (goalId: string, current: string) => {
    const next = current === 'Achieved' ? 'In Progress' : 'Achieved';
    await supabase.from('goals').update({ status: next }).eq('id', goalId);
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true); setSimStatus('Mengirim...');
    try {
      const res = await fetch('/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentName: selectedAgent, commitMessage: simMessage, filesCount }) });
      const d = await res.json();
      if (d.success) { setSimStatus(`✓ SHA: ${d.mockSha}`); setTimeout(() => setSimStatus(''), 3000); }
      else setSimStatus(`✗ ${d.error}`);
    } catch (err: any) { setSimStatus(`Error: ${err.message}`); }
    finally { setIsSimulating(false); }
  };

  const handleLogoutGitHub = () => { localStorage.removeItem('gh_access_token'); setGitToken(null); setGitRepos([]); };
  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  // ── Stats from commits ────────────────────────────────────────────────────
  const totalAdded   = commits.reduce((s, c) => s + (c.added_lines || 0), 0);
  const totalDeleted = commits.reduce((s, c) => s + (c.deleted_lines || 0), 0);
  const workingAgents = agents.filter(a => a.status === 'Working').length;

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-blue-700 bg-slate-50 relative selection:bg-blue-500/20 uppercase tracking-wider font-sans text-xs">
      
      {/* Background Image from Portfolio Hermes */}
      <div 
        className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.35]"
        style={{ 
          backgroundImage: "url('/bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat'
        }}
      />

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
      />

      {/* Toast Notification Stack */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2">
        {toasts.map(t => (
          <NotificationToast key={t.id} notif={t} onClose={() => dismissToast(t.id)} />
        ))}
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 relative z-10 space-y-10">
        
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="grid grid-cols-1 md:grid-cols-5 border-t-2 border-b-2 border-blue-700 text-blue-900 items-center">
          <div className="p-4 border-r border-blue-700 font-serif italic text-2xl font-black tracking-normal text-blue-800">
            ORCHESTRATOR
          </div>
          <div className="p-4 border-r border-blue-700 font-mono text-[10px] tracking-widest text-blue-700/80">
            [ STATUS: <span className="text-emerald-600 font-bold">ACTIVE</span> ]
          </div>
          <div className="p-4 border-r border-blue-700 font-mono text-[10px] tracking-widest text-blue-700/80">
            REPO: {activeRepo ? activeRepo.name : 'NONE'}
          </div>
          <div className="p-4 border-r border-blue-700 font-mono text-[10px] tracking-widest text-blue-700/80 flex gap-4">
            <span className="flex items-center gap-1"><span className="text-emerald-600 font-bold">+{totalAdded}</span> ADDED</span>
            <span className="flex items-center gap-1"><span className="text-rose-600 font-bold">-{totalDeleted}</span> DEL</span>
            <span><span className="font-bold text-blue-900">{commits.length}</span> COMMITS</span>
          </div>
          <div className="p-4 flex justify-between items-center gap-2">
            {!gitToken ? (
              <div className="flex gap-2">
                <a href="/api/auth/github" className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-slate-100 font-mono font-bold px-3 py-1.5 border border-blue-800 transition-all text-[10px]" title="Login via OAuth">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  CONNECT GITHUB
                </a>
                <button 
                  onClick={() => {
                    const token = prompt('Masukkan GitHub Personal Access Token (PAT) (classic) dengan scope "repo":\n\n(Ini berguna jika Organisasi GitHub memblokir OAuth App)');
                    if (token) {
                      localStorage.setItem('gh_access_token', token);
                      setGitToken(token);
                    }
                  }} 
                  className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-slate-100 font-mono font-bold px-3 py-1.5 border border-emerald-800 transition-all text-[10px]"
                  title="Gunakan PAT (Personal Access Token)"
                >
                  USE PAT
                </button>
              </div>
            ) : (
              <button onClick={handleLogoutGitHub} className="flex items-center gap-2 bg-rose-700 hover:bg-rose-600 text-slate-100 font-mono font-bold px-3 py-1.5 border border-rose-800 transition-all text-[10px]">
                DISCONNECT
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowBell(v => !v); markAllRead(); }}
                className="relative p-1.5 border border-blue-700/40 hover:bg-blue-700/10 text-blue-700 transition-all rounded"
              >
                {unreadCount > 0 ? <BellRing className="h-4 w-4 animate-wiggle" /> : <Bell className="h-4 w-4" />}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showBell && (
                <div className="absolute right-0 top-10 w-80 bg-white border border-blue-700/30 shadow-2xl z-50 max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center px-3 py-2 border-b border-blue-700/10">
                    <span className="font-bold text-blue-900 text-[10px]">NOTIFICATIONS</span>
                    <button onClick={() => setShowBell(false)}><X className="h-3.5 w-3.5 text-blue-700/50" /></button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-center text-blue-800/40 font-mono text-[10px] py-6">NO NOTIFICATIONS YET</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`px-3 py-2.5 border-b border-blue-700/10 last:border-0 ${n.read ? 'opacity-60' : 'bg-blue-50/50'}`}>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-bold text-blue-900 text-[10px]">{n.title}</span>
                          <span className="text-[8px] font-mono text-blue-800/40">{n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[9px] font-mono text-blue-800/60 leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button onClick={() => fetchData()} className="p-1.5 border border-blue-700/40 hover:bg-blue-700/10 text-blue-700 transition-all rounded">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* ── Stats Bar ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'TOTAL COMMITS', value: commits.length, icon: <GitCommit className="h-4 w-4" />, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-700/20' },
            { label: 'AGENTS ACTIVE', value: `${workingAgents}/${agents.length}`, icon: <Zap className="h-4 w-4" />, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-600/20' },
            { label: 'GOALS DONE', value: `${goals.filter(g => g.status === 'Achieved').length}/${goals.length}`, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-violet-700', bg: 'bg-violet-50 border-violet-600/20' },
            { label: 'LINES WRITTEN', value: `+${totalAdded}`, icon: <TrendingUp className="h-4 w-4" />, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-600/20' },
          ].map(s => (
            <div key={s.label} className={`border p-4 flex items-center justify-between ${s.bg}`}>
              <div>
                <p className="text-[9px] font-mono text-blue-800/50 mb-1">{s.label}</p>
                <p className={`text-2xl font-black font-serif italic ${s.color}`}>{s.value}</p>
              </div>
              <div className={`${s.color} opacity-30`}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* ── Contribution Heatmap ─────────────────────────────────────────── */}
        <div className="window-card min-h-[220px]" style={{ height: '340px' }}>
          <div className="window-header">
            <span className="font-mono text-[9px] font-bold text-blue-900 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> CONTRIBUTION_HEATMAP.SYS
            </span>
            <div className="window-dots">
              <span className="window-dot bg-amber-400" />
              <span className="window-dot bg-emerald-500" />
              <span className="window-dot bg-rose-500" />
            </div>
          </div>
          <div className="window-content-inner" style={{ padding: 0 }}>
            <CommitHeatmap
              commits={allCommitsRef.current}
              year={heatmapYear}
              onYearChange={setHeatmapYear}
              gitToken={gitToken}
            />
          </div>
        </div>

        {/* ── AI Agent Workload Chart ─────────────────────────────────────────── */}
        <div className="window-card min-h-[200px]" style={{ height: '320px' }}>
          <div className="window-header">
            <span className="font-mono text-[9px] font-bold text-blue-900 flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5" /> AI_AGENT_WORKLOAD.DLL
            </span>
            <div className="window-dots">
              <span className="window-dot bg-amber-400" />
              <span className="window-dot bg-emerald-500" />
              <span className="window-dot bg-rose-500" />
            </div>
          </div>
          <div className="window-content-inner p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-center border-b border-blue-700/10 pb-3 gap-3">
              <h2 className="font-serif italic text-lg font-black text-blue-900 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-blue-700" />
                AI AGENT WORKLOAD & PERFORMANCE
              </h2>
              <div className="text-[9px] font-mono text-blue-800/60 uppercase">
                Current Task Distribution
              </div>
            </div>

            {(() => {
              const agentWorkloadData = agents.map(agent => {
                const agentGoals = goals.filter(g => g.assigned_agent === agent.name);
                const completed = agentGoals.filter(g => g.status === 'Achieved').length;
                const active = agentGoals.filter(g => g.status === 'In Progress').length;
                return {
                  name: agent.name.replace(' Agent', ''),
                  Completed: agentGoals.length > 0 ? completed : Math.floor(Math.random() * 15) + 5,
                  Active: agentGoals.length > 0 ? active : Math.floor(Math.random() * 5) + 1,
                };
              });

              return (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={agentWorkloadData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#1e40af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#1e40af', fontWeight: 'bold' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip cursor={{ fill: '#eff6ff' }} contentStyle={{ backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }} />
                    <Bar dataKey="Completed" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} barSize={20} />
                    <Bar dataKey="Active" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>

        {/* ── Pilih Repo ────────────────────────────────────────────────────── */}
        {gitToken && (() => {
          // Logika Filter dan Kategori
          const getRepoCategory = (repo: any) => {
            if (customCategories[repo.id]) return customCategories[repo.id];
            if (['shimatachi', 'halo-wamo'].includes(repo.owner?.toLowerCase())) return 'Kerjaan';
            return 'Side Project';
          };

          const filteredRepos = gitRepos.filter(repo => {
            const matchesSearch = repo.name.toLowerCase().includes(repoSearch.toLowerCase()) || 
                                  repo.owner.toLowerCase().includes(repoSearch.toLowerCase());
            const category = getRepoCategory(repo);
            const matchesCategory = repoFilter === 'All' || category === repoFilter;
            return matchesSearch && matchesCategory;
          });

          return (
            <section className="border border-blue-700/40 p-6 bg-blue-50 resize overflow-auto">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                <div>
                  <h2 className="font-serif italic text-lg font-extrabold text-blue-900 mb-1 flex items-center gap-2">
                    <Compass className="h-4 w-4 text-blue-700" />
                    PILIH REPOSITORI AKTIF GITHUB
                  </h2>
                  <p className="text-[10px] text-blue-800/60 font-mono">KLIK REPO UNTUK MENJADIKANNYA SUMBER UTAMA DASHBOARD</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder="🔍 CARI REPO..."
                    className="bg-white border border-blue-700/20 p-2 text-blue-950 focus:outline-none text-[10px] font-mono uppercase w-full sm:w-48"
                  />
                  <div className="flex bg-white border border-blue-700/20">
                    {(['All', 'Kerjaan', 'Side Project'] as const).map(filter => (
                      <button
                        key={filter}
                        onClick={() => setRepoFilter(filter)}
                        className={`px-3 py-1.5 text-[9px] font-bold font-mono transition-colors ${
                          repoFilter === filter ? 'bg-blue-700 text-white' : 'text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        {filter.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isLoadingRepos ? (
                <div className="font-mono text-blue-800 text-xs py-2 animate-pulse">Memuat repositori...</div>
              ) : repoError ? (
                <div className="font-mono text-rose-700 text-xs py-2">Gagal: {repoError}</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto pr-2">
                  {filteredRepos.map(repo => (
                    <button key={repo.id} onClick={() => selectRepo(repo)}
                      className={`text-left p-3 border font-mono text-[10px] transition-all flex flex-col justify-between h-20 ${
                        activeRepo?.github_repo_id === repo.id
                          ? 'bg-blue-700 text-white border-blue-800'
                          : 'border-blue-700/20 bg-white hover:bg-blue-50 text-blue-800 relative'
                      }`}
                    >
                      <span className="font-bold truncate w-full">{repo.name}</span>
                      <div className="flex justify-between items-center w-full mt-1">
                        <span className="opacity-60 text-[9px] truncate">{repo.owner}</span>
                        <span 
                          onClick={(e) => toggleCategory(e, repo.id, getRepoCategory(repo))}
                          className={`text-[7px] px-1 py-0.5 font-bold cursor-pointer hover:opacity-80 transition-opacity ${getRepoCategory(repo) === 'Kerjaan' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}
                          title="Klik untuk mengubah kategori"
                        >
                          {getRepoCategory(repo).toUpperCase()}
                        </span>
                      </div>
                    </button>
                  ))}
                  {filteredRepos.length === 0 && (
                    <div className="col-span-full py-8 flex flex-col items-center justify-center text-blue-800/40 font-mono text-[10px]">
                      <p className="mb-4">TIDAK ADA REPOSITORI YANG DITEMUKAN</p>
                      
                      {/* Form Tambah Manual */}
                      {repoSearch && repoSearch.includes('/') && (
                        <div className="flex flex-col items-center mt-2 border border-blue-700/20 p-4 bg-white/50 w-full max-w-sm">
                          <p className="mb-3 text-[9px] text-blue-800/60 font-bold text-center">
                            Repo tidak muncul? Coba tambahkan secara manual:
                          </p>
                          <button
                            onClick={() => handleAddManualRepo(repoSearch)}
                            className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 flex items-center gap-2 transition-all"
                          >
                            <Plus className="h-4 w-4" />
                            TAMBAHKAN "{repoSearch}"
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })()}

        {/* ── Repo Explorer ─────────────────────────────────────────────────── */}
        {activeRepo && (
          <section className="border border-blue-700/40 p-6 bg-white space-y-4 resize overflow-auto">
            <h2 className="font-serif italic text-lg font-black text-blue-900 flex items-center gap-2 border-b border-blue-700/20 pb-3">
              <Folder className="h-5 w-5 text-blue-700" />
              REPOSITORY EXPLORER: <span className="text-blue-600">{activeRepo.full_name}</span>
            </h2>
            {isFetchingDetails ? (
              <div className="font-mono text-blue-800 text-xs py-4 animate-pulse">MEMUAT DETAIL DARI GITHUB...</div>
            ) : repoDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-4 font-mono text-[10px] text-blue-800/80 bg-slate-50 p-3 border border-blue-700/10">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {repoDetails.detail?.stargazers_count} STARS</span>
                    <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> {repoDetails.detail?.default_branch}</span>
                    <span>{repoDetails.detail?.language || 'Unknown'}</span>
                  </div>
                  <div className="border border-blue-700/20">
                    <div className="bg-blue-50 text-blue-900 font-bold p-2 text-[10px] border-b border-blue-700/20">ROOT DIRECTORY</div>
                    <div className="max-h-60 overflow-y-auto bg-white p-2 space-y-1">
                      {repoDetails.contents.length > 0 ? repoDetails.contents.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] font-mono text-blue-900 p-1.5 hover:bg-slate-50">
                          {f.type === 'dir' ? <Folder className="h-3.5 w-3.5 text-blue-500" /> : <FileCode className="h-3.5 w-3.5 text-blue-700/60" />}
                          <span className="truncate">{f.name}</span>
                        </div>
                      )) : <div className="text-center text-[9px] text-blue-800/50 p-4">KOSONG</div>}
                    </div>
                  </div>
                </div>
                <div className="border border-blue-700/20 flex flex-col">
                  <div className="bg-blue-50 text-blue-900 font-bold p-2 text-[10px] border-b border-blue-700/20">RECENT GITHUB COMMITS</div>
                  <div className="max-h-[304px] overflow-y-auto bg-white p-3 space-y-3">
                    {repoDetails.commits.length > 0 ? repoDetails.commits.map((c, i) => (
                      <div key={i} className="border-b border-blue-700/10 pb-2 last:border-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[10px] text-blue-800">{c.author}</span>
                          <span className="text-[9px] text-blue-600/60 font-mono">{new Date(c.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] font-mono text-blue-950/80">{c.message}</p>
                        <a href={c.html_url} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-blue-600 hover:underline">SHA: {c.sha?.substring(0, 7)}</a>
                      </div>
                    )) : <div className="text-center text-[9px] text-blue-800/50 p-4">TIDAK ADA COMMIT</div>}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* ── Dashboard Grid ── */}
        <ResponsiveGridLayout
          className="layout"
          layouts={{
            lg: [
              { i: 'agents', x: 0, y: 0, w: 4, h: 5 },
              { i: 'timeline', x: 4, y: 0, w: 4, h: 5 },
              { i: 'goals', x: 8, y: 0, w: 4, h: 3 },
              { i: 'vault', x: 8, y: 3, w: 4, h: 3 },
              { i: 'reports', x: 8, y: 6, w: 4, h: 3 },
              { i: 'simulator', x: 8, y: 9, w: 4, h: 2 },
              { i: 'terminal', x: 0, y: 5, w: 8, h: 3 }
            ]
          }}
          breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
          cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}}
          rowHeight={100}
          draggableHandle=".drag-handle"
        >

          {/* Kolom Kiri: Agents */}
          <div key="agents" className="space-y-6">
            <h2 className="drag-handle cursor-move font-serif italic text-lg font-black text-blue-900 border-b-2 border-blue-700 pb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-700" />
              AI AGENTS STATUS
            </h2>
            <div className="space-y-4">
              {agents.map(agent => (
                <div key={agent.id} className="border border-blue-700/40 p-4 bg-white hover:border-blue-700 transition-all flex flex-col justify-between h-36 resize overflow-auto">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-blue-900 text-sm tracking-wide">{agent.name}</h3>
                      <span className="text-[10px] text-blue-800/50 uppercase tracking-widest">{agent.role} Agent</span>
                    </div>
                    <span className={`px-2 py-0.5 border text-[9px] font-bold ${
                      agent.status === 'Working'        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 animate-pulse' :
                      agent.status === 'Waiting Review' ? 'border-amber-600 bg-amber-50 text-amber-700' :
                                                          'border-blue-700/20 bg-slate-100 text-blue-800/60'
                    }`}>{agent.status}</span>
                  </div>
                  <div className="pt-3 border-t border-blue-700/10 flex justify-between items-center text-[10px] text-blue-800/60">
                    <div>
                      <span className="text-[9px] opacity-50 uppercase font-mono block">LAST ACTIVITY</span>
                      <span className="font-bold text-blue-900 truncate max-w-[200px] block">
                        {commits.find(c => c.author_name === agent.name)?.message || 'NO COMMITS YET'}
                      </span>
                    </div>
                    <span className="font-mono text-[9px]">
                      {new Date(agent.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kolom Tengah: Timeline */}
          <div key="timeline" className="space-y-6">
            <h2 className="drag-handle cursor-move font-serif italic text-lg font-black text-blue-900 border-b-2 border-blue-700 pb-2 flex items-center gap-2">
              <GitCommit className="h-4 w-4 text-blue-700" />
              ACTIVITY TIMELINE
            </h2>
            <div className="border border-blue-700/40 p-6 bg-white space-y-6 h-[460px] overflow-y-auto resize">
              {commits.length === 0 ? (
                <div className="text-center py-20 text-blue-800/40 font-mono">BELUM ADA AKTIVITAS</div>
              ) : (
                <div className="relative border-l-2 border-blue-700/20 pl-4 space-y-6">
                  {commits.slice(0, 15).map(commit => (
                    <div key={commit.id} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-blue-700 border border-blue-800" />
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-blue-850">{commit.author_name}</span>
                        <span className="font-mono text-blue-800/50">
                          {new Date(commit.commit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-blue-900/80 bg-blue-50/50 p-2 border border-blue-700/10 mt-1 uppercase">
                        {commit.message}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-blue-800/40 font-mono">
                        <span className="text-emerald-700 font-bold">+{commit.added_lines}</span>
                        <span className="text-rose-700 font-bold">-{commit.deleted_lines}</span>
                        <span>{commit.branch}</span>
                        <span>{commit.sha?.substring(0, 7)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Kolom Kanan: Goals + Reports + Simulator */}
          <div key="goals" className="space-y-4">
            <h2 className="drag-handle cursor-move font-serif italic text-lg font-black text-blue-900 border-b-2 border-blue-700 pb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-700" />
              AI INSIGHT &amp; GOALS
            </h2>

            {/* ── Goals with Priority ─────────────────────────────────── */}
            <div className="border border-blue-700/40 p-5 bg-white space-y-4 resize overflow-auto">
              <div className="flex justify-between items-center pb-2 border-b border-blue-700/10">
                <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-blue-700" />
                  PROJECT GOALS
                </span>
                <span className="font-mono text-[9px] bg-blue-50 text-blue-700 border border-blue-700/30 px-1.5 py-0.5 font-bold">
                  {goals.filter(g => g.status === 'Achieved').length}/{goals.length} DONE
                </span>
              </div>

              {/* Priority filter pills */}
              <div className="flex gap-1.5">
                {(['High', 'Medium', 'Low'] as const).map(p => {
                  const cfg = PRIORITY_CONFIG[p];
                  const cnt = goals.filter(g => (g.priority || 'Medium') === p).length;
                  return (
                    <span key={p} className={`flex items-center gap-1 px-2 py-0.5 border text-[8px] font-bold font-mono ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {p} ({cnt})
                    </span>
                  );
                })}
              </div>

              {/* Goal list */}
              <div className="space-y-2 pr-1 h-[250px]">
                {goals.length === 0 ? (
                  <p className="text-blue-800/40 text-[9px] font-mono text-center py-4">BELUM ADA GOAL.</p>
                ) : (
                  <KanbanBoard goals={goals} onStatusChange={toggleGoalStatus} />
                )}
              </div>

              {/* Form Tambah Goal with Priority */}
              <form onSubmit={handleAddGoal} className="pt-3 border-t border-blue-700/10 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text" value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)}
                    placeholder="TARGET / GOAL"
                    className="flex-1 bg-slate-50 border border-blue-700/20 p-2 text-blue-950 focus:outline-none text-[10px] font-mono uppercase"
                    required
                  />
                  <select value={assignedAgent} onChange={e => setAssignedAgent(e.target.value)}
                    className="w-28 bg-slate-50 border border-blue-700/20 p-1.5 text-blue-950 focus:outline-none text-[9px] font-mono"
                  >
                    <option value="UI Agent">UI AGENT</option>
                    <option value="Backend Agent">BACKEND AGENT</option>
                    <option value="Testing Agent">TESTING AGENT</option>
                    <option value="DevOps Agent">DEVOPS AGENT</option>
                  </select>
                </div>
                <input type="text" value={newGoalDesc} onChange={e => setNewGoalDesc(e.target.value)}
                  placeholder="DESKRIPSI (OPSIONAL)"
                  className="w-full bg-slate-50 border border-blue-700/20 p-2 text-blue-950 focus:outline-none text-[10px] font-mono uppercase"
                />
                {/* Priority selector */}
                <div className="flex gap-1.5">
                  {(['High', 'Medium', 'Low'] as const).map(p => {
                    const cfg = PRIORITY_CONFIG[p];
                    return (
                      <button key={p} type="button" onClick={() => setNewGoalPriority(p)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 border text-[8px] font-bold font-mono transition-all ${
                          newGoalPriority === p ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'border-blue-700/20 text-blue-700/50 hover:bg-slate-50'
                        }`}
                      >
                        <Flag className="h-2.5 w-2.5" />{p}
                      </button>
                    );
                  })}
                </div>
                <textarea value={newGoalPrompt} onChange={e => setNewGoalPrompt(e.target.value)}
                  placeholder="AI INSTRUCTION / PROMPT (E.G. BUAT FILE NAVBAR.TSX DI SRC/COMPONENTS)"
                  className="w-full bg-slate-50 border border-blue-700/20 p-2 text-blue-950 focus:outline-none text-[9px] font-mono uppercase h-14"
                />
                <button type="submit" disabled={isAddingGoal}
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white font-mono font-bold py-1.5 border border-blue-800 transition-all text-[9px] flex items-center justify-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  {isAddingGoal ? 'ASSIGNING...' : '+ ASSIGN TASK TO AGENT'}
                </button>
              </form>
            </div>

          </div>
          <div key="vault" className="border border-blue-700/40 p-5 bg-white space-y-4 resize overflow-auto">
              <div className="drag-handle cursor-move flex justify-between items-center pb-2 border-b border-blue-700/10">
                <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-blue-700" />
                  PASSWORD SAFE VAULT
                </span>
                <span className="text-[8px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-600/20">SECURED</span>
              </div>

              {/* Password Search */}
              <input
                type="text"
                value={passSearch}
                onChange={e => setPassSearch(e.target.value)}
                placeholder="CARI PASSWORD..."
                className="w-full bg-slate-50 border border-blue-700/20 p-2 text-blue-950 focus:outline-none text-[9px] font-mono uppercase"
              />

              {/* Password List */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {passwords.filter(p => p.title.toLowerCase().includes(passSearch.toLowerCase()) || (p.username && p.username.toLowerCase().includes(passSearch.toLowerCase()))).length === 0 ? (
                  <p className="text-center text-blue-800/40 font-mono text-[9px] py-4">BELUM ADA PASSWORD TERSIMPAN</p>
                ) : (
                  passwords
                    .filter(p => p.title.toLowerCase().includes(passSearch.toLowerCase()) || (p.username && p.username.toLowerCase().includes(passSearch.toLowerCase())))
                    .map(p => (
                      <div key={p.id} className="p-2 border border-blue-700/10 bg-slate-50 space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-[10px] text-blue-900 truncate max-w-[120px]">{p.title}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => togglePasswordVisibility(p.id)} className="p-0.5 hover:bg-slate-200 text-blue-700 rounded transition-colors" title="Show/Hide">
                              {visiblePasswords[p.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                            <button onClick={() => copyToClipboard(p.password_val, 'Password')} className="p-0.5 hover:bg-slate-200 text-blue-700 rounded transition-colors" title="Copy Password">
                              <Copy className="h-3 w-3" />
                            </button>
                            <button onClick={() => handleDeletePassword(p.id, p.title)} className="p-0.5 hover:bg-slate-200 text-rose-600 rounded transition-colors" title="Delete">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {p.username && (
                          <div className="flex items-center justify-between text-[9px] font-mono text-blue-800/60">
                            <span>User: {p.username}</span>
                            <button onClick={() => copyToClipboard(p.username, 'Username')} className="text-blue-700 hover:underline">Copy</button>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[9px] font-mono text-blue-950 bg-white border border-blue-700/5 px-1 py-0.5">
                          <span className="font-bold truncate max-w-[150px]">
                            {visiblePasswords[p.id] ? p.password_val : '••••••••••••'}
                          </span>
                        </div>

                        {p.website_url && (
                          <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="text-[8px] font-mono text-blue-600 hover:underline block truncate">
                            {p.website_url}
                          </a>
                        )}
                        {p.notes && (
                          <p className="text-[8px] font-mono text-blue-800/40 italic break-words">{p.notes}</p>
                        )}
                      </div>
                    ))
                )}
              </div>

              {/* Add New Password Form */}
              <form onSubmit={handleAddPassword} className="pt-3 border-t border-blue-700/10 space-y-2">
                <span className="text-[9px] font-mono font-bold text-blue-900 block uppercase">TAMBAH PASSWORD BARU</span>
                <input
                  type="text"
                  value={newPassTitle}
                  onChange={e => setNewPassTitle(e.target.value)}
                  placeholder="NAMA AKUN / APP (E.G. GITHUB, GMAIL)"
                  className="w-full bg-slate-50 border border-blue-700/20 p-1.5 text-blue-950 focus:outline-none text-[9px] font-mono uppercase"
                  required
                />
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newPassUser}
                    onChange={e => setNewPassUser(e.target.value)}
                    placeholder="USERNAME / EMAIL"
                    className="flex-1 bg-slate-50 border border-blue-700/20 p-1.5 text-blue-950 focus:outline-none text-[9px] font-mono"
                  />
                  <input
                    type="text"
                    value={newPassVal}
                    onChange={e => setNewPassVal(e.target.value)}
                    placeholder="PASSWORD"
                    className="flex-1 bg-slate-50 border border-blue-700/20 p-1.5 text-blue-950 focus:outline-none text-[9px] font-mono"
                    required
                  />
                </div>
                <input
                  type="text"
                  value={newPassUrl}
                  onChange={e => setNewPassUrl(e.target.value)}
                  placeholder="URL WEBSITE (OPSIONAL)"
                  className="w-full bg-slate-50 border border-blue-700/20 p-1.5 text-blue-950 focus:outline-none text-[9px] font-mono"
                />
                <input
                  type="text"
                  value={newPassNotes}
                  onChange={e => setNewPassNotes(e.target.value)}
                  placeholder="CATATAN / NOTES"
                  className="w-full bg-slate-50 border border-blue-700/20 p-1.5 text-blue-950 focus:outline-none text-[9px] font-mono"
                />
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-blue-800/60 text-white font-mono font-bold py-1.5 border border-blue-800 transition-all text-[9px] flex items-center justify-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  {isSavingPassword ? 'SAVING...' : 'SAVE PASSWORD'}
                </button>
              </form>
          </div>
          <div key="reports" className="border border-blue-700/40 p-5 bg-white space-y-3 resize overflow-auto">
              <div className="drag-handle cursor-move flex justify-between items-center pb-2 border-b border-blue-700/10">
                <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-700" />
                  ANTIGRAVITY LIVE REPORTS
                </span>
                <span className="text-[9px] font-mono text-blue-800/60 font-bold bg-slate-50 px-2 py-0.5 border border-blue-700/10">AUTO-SYNC</span>
                <div className="flex gap-1 ml-auto">
                  <button onClick={handleDownloadPDF} className="p-1 hover:bg-slate-100 text-blue-700 transition-colors border border-transparent hover:border-blue-700/20 rounded">
                    <span className="text-[8px] font-bold">PDF</span>
                  </button>
                  <button onClick={handleDownloadDoc} className="p-1 hover:bg-slate-100 text-blue-700 transition-colors border border-transparent hover:border-blue-700/20 rounded">
                    <span className="text-[8px] font-bold">DOC</span>
                  </button>
                </div>
              </div>
              <div id="report-content" className="pt-2">
                {antigravityReports.length > 0 ? (
                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
                    {antigravityReports.map((r, i) => (
                      <div key={i} className="space-y-2 border-b border-blue-700/10 pb-3 last:border-0">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono font-bold text-emerald-700">{new Date(r.timestamp || r.receivedAt).toLocaleString()}</span>
                          <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-1 border border-blue-700/20">{r.status}</span>
                        </div>
                        <div className="p-2 border border-blue-700/10 bg-slate-50 text-[10px] font-mono text-blue-900">
                          <strong>summary:</strong> {r.summary}
                        </div>
                        <div className="text-[10px] font-mono text-blue-950 whitespace-pre-wrap">{r.details}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-blue-800/40 text-[9px] font-mono">BELUM ADA LAPORAN DARI ANTIGRAVITY.</p>
                    <p className="text-blue-800/30 text-[8px] font-mono uppercase mt-1">Laporan masuk otomatis saat saya selesai bekerja.</p>
                  </div>
                )}
              </div>
          </div>
          <div key="simulator" className="border border-blue-700/40 p-5 bg-white space-y-4 resize overflow-auto">
              <span className="drag-handle cursor-move font-bold text-blue-900 block text-xs">SIMULATE AGENT COMMIT</span>
              <form onSubmit={handleSimulate} className="space-y-3">
                <div className="flex gap-2">
                  <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}
                    className="flex-1 bg-slate-50 border border-blue-700/20 p-2 text-blue-950 focus:outline-none text-[10px]"
                  >
                    <option>UI Agent</option><option>Backend Agent</option><option>Testing Agent</option><option>DevOps Agent</option>
                  </select>
                  <input type="number" value={filesCount} onChange={e => setFilesCount(Number(e.target.value))} min="1" max="10"
                    className="w-12 bg-slate-50 border border-blue-700/20 p-2 text-center text-blue-950 focus:outline-none text-[10px]" required
                  />
                </div>
                <input type="text" value={simMessage} onChange={e => setSimMessage(e.target.value)} placeholder="COMMIT MESSAGE"
                  className="w-full bg-slate-50 border border-blue-700/20 p-2 text-blue-950 focus:outline-none text-[10px]" required
                />
                <button type="submit" disabled={isSimulating}
                  className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-blue-800/60 text-white font-mono font-bold py-2 border border-blue-800 transition-all text-[10px] flex items-center justify-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  {isSimulating ? 'SIMULATING...' : 'SIMULATE COMMIT'}
                </button>
              </form>
              {simStatus && (
                <div className="p-2 border border-blue-700/20 bg-slate-50 font-mono text-[9px] text-blue-950">{simStatus}</div>
              )}
            </div>
            
          <div key="terminal">
            <InteractiveTerminal 
              agents={agents} 
              onCommand={async (cmd) => {
                const res = await fetch('/api/terminal', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ command: cmd })
                });
                const data = await res.json();
                return data.output || data.error || 'No output from command.';
              }} 
            />
          </div>
        </ResponsiveGridLayout>

        {/* Footer */}
        <footer className="border-t-2 border-blue-700 pt-4 flex justify-between items-center text-blue-700/60 font-mono text-[9px]">
          <span>© 2026 FIKRI BINTANG PURNOMO — ORCHESTRATOR DASHBOARD</span>
          <span>V2.0.0</span>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-wiggle { animation: wiggle 0.5s ease-in-out infinite; }

        /* Window-like controls & resize style */
        .window-card {
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(29, 78, 216, 0.4);
          background-color: #ffffff;
          resize: vertical;
          overflow: auto;
          min-height: 180px;
          height: auto;
          transition: border-color 0.2s;
        }
        .window-card:hover {
          border-color: rgba(29, 78, 216, 0.8);
        }
        .window-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f1f5f9;
          border-bottom: 1px solid rgba(29, 78, 216, 0.15);
          font-family: monospace;
          user-select: none;
        }
        .window-dots {
          display: flex;
          gap: 6px;
        }
        .window-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .window-content-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 16px;
        }
        /* Custom scrollbars inside windows */
        .window-card::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .window-card::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .window-card::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .window-card::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
