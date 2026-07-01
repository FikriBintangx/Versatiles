'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
  ArrowRight
} from 'lucide-react';

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

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [tasks, setTasks] = useState<IssueTask[]>([]);
  const [activeRepo, setActiveRepo] = useState<any>(null);
  
  // State untuk GitHub Repositories
  const [gitToken, setGitToken] = useState<string | null>(null);
  const [gitRepos, setGitRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState('');

  // State untuk form simulator
  const [selectedAgent, setSelectedAgent] = useState('UI Agent');
  const [simMessage, setSimMessage] = useState('feat(login): [x] UI redesign login page responsive');
  const [filesCount, setFilesCount] = useState(3);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStatus, setSimStatus] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    // 1. Get Repo
    const { data: repos } = await supabase.from('repositories').select('*').limit(1);
    if (repos && repos.length > 0) {
      setActiveRepo(repos[0]);
    }

    // 2. Get Agents
    const { data: agentsData } = await supabase
      .from('agents')
      .select('*')
      .order('name', { ascending: true });
    if (agentsData) setAgents(agentsData);

    // 3. Get Commits
    const { data: commitsData } = await supabase
      .from('commits')
      .select('*')
      .order('commit_time', { ascending: false })
      .limit(10);
    if (commitsData) setCommits(commitsData);

    // 4. Get active tasks
    const { data: tasksData } = await supabase
      .from('issues_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (tasksData) setTasks(tasksData);
  };

  // Tangkap token github dari url callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token');
    if (token) {
      setGitToken(token);
      localStorage.setItem('gh_access_token', token);
      // Bersihkan url query parameter agar bersih
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedToken = localStorage.getItem('gh_access_token');
      if (savedToken) setGitToken(savedToken);
    }
    
    fetchData();

    // Set up Realtime subscriptions
    const agentsSubscription = supabase
      .channel('agents-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => {
        fetchData();
      })
      .subscribe();

    const commitsSubscription = supabase
      .channel('commits-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commits' }, () => {
        fetchData();
      })
      .subscribe();

    const tasksSubscription = supabase
      .channel('tasks-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues_tasks' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(agentsSubscription);
      supabase.removeChannel(commitsSubscription);
      supabase.removeChannel(tasksSubscription);
    };
  }, []);

  // Fetch daftar repository GitHub user
  useEffect(() => {
    if (gitToken) {
      setIsLoadingRepos(true);
      fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: gitToken })
      })
        .then(res => res.json())
        .then(data => {
          if (data.repos) {
            setGitRepos(data.repos);
          } else {
            setRepoError(data.error || 'Gagal memuat repositori');
          }
        })
        .catch(err => setRepoError(err.message))
        .finally(() => setIsLoadingRepos(false));
    }
  }, [gitToken]);

  const selectRepo = async (repo: GitHubRepo) => {
    try {
      const { data, error } = await supabase
        .from('repositories')
        .upsert({
          github_repo_id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          owner: repo.owner,
        }, { onConflict: 'github_repo_id' })
        .select()
        .single();
      
      if (error) throw error;
      setActiveRepo(data);
      alert(`Berhasil mengkoneksikan repositori: ${repo.full_name}`);
    } catch (err: any) {
      alert(`Gagal menyimpan repo: ${err.message}`);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimStatus('Mengirimkan commit ke webhook...');
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: selectedAgent,
          commitMessage: simMessage,
          filesCount: filesCount
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setSimStatus(`Sukses! SHA Commit: ${resData.mockSha}`);
        setTimeout(() => setSimStatus(''), 3000);
      } else {
        setSimStatus(`Gagal: ${resData.error}`);
      }
    } catch (err: any) {
      setSimStatus(`Error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLogoutGitHub = () => {
    localStorage.removeItem('gh_access_token');
    setGitToken(null);
    setGitRepos([]);
  };

  // Hitung statistik
  const todayCommits = commits.filter(c => {
    const today = new Date().toISOString().split('T')[0];
    const commitDate = new Date(c.commit_time).toISOString().split('T')[0];
    return today === commitDate;
  });

  return (
    <div className="min-h-screen text-sky-900 bg-slate-50 relative selection:bg-sky-500/20 uppercase tracking-wider font-sans text-xs">
      
      {/* Texture Overlay (Gaya Portfolio Hermes) */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.04] mix-blend-multiply" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* Container utama dengan lebar penuh yang memanjang */}
      <div className="max-w-[1600px] mx-auto px-6 py-8 relative z-10 space-y-12">
        
        {/* Header Grid Border Khas Hermes */}
        <header className="grid grid-cols-1 md:grid-cols-4 border-t border-b border-sky-900/60 text-sky-950 items-center">
          <div className="p-4 border-r border-sky-900/60 font-serif italic text-2xl font-black tracking-normal text-sky-950">
            ORCHESTRATOR
          </div>
          <div className="p-4 border-r border-sky-900/60 font-mono text-[10px] tracking-widest text-sky-900/70">
            [ STATUS: <span className="text-emerald-600 font-bold">ACTIVE</span> ]
          </div>
          <div className="p-4 border-r border-sky-900/60 font-mono text-[10px] tracking-widest text-sky-900/70">
            REPO: {activeRepo ? activeRepo.name : 'NONE CONNECTED'}
          </div>
          <div className="p-4 flex justify-between items-center">
            {!gitToken ? (
              <a 
                href="/api/auth/github"
                className="flex items-center gap-2 bg-sky-900 hover:bg-sky-800 text-slate-100 font-mono font-bold px-3 py-1.5 border border-sky-950 transition-all text-[10px]"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                CONNECT GITHUB
              </a>
            ) : (
              <button 
                onClick={handleLogoutGitHub}
                className="flex items-center gap-2 bg-rose-900 hover:bg-rose-800 text-slate-100 font-mono font-bold px-3 py-1.5 border border-rose-950 transition-all text-[10px]"
              >
                DISCONNECT
              </button>
            )}
            <button 
              onClick={fetchData}
              className="p-1.5 border border-sky-900/40 hover:bg-sky-900/10 text-sky-900 transition-all rounded"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Section 1: Detail Pengambil List Repo */}
        {gitToken && (
          <section className="border border-sky-900/40 p-6 bg-sky-900/[0.02]">
            <h2 className="font-serif italic text-lg font-extrabold text-sky-950 mb-3 flex items-center gap-2">
              <Compass className="h-4 w-4" />
              PILIH REPOSITORI AKTIF GITHUB
            </h2>
            <p className="text-[10px] text-sky-900/60 font-mono mb-4">KLIK PADA REPO UNTUK MENJADIKANNYA SUMBER UTAMA DASHBOARD</p>
            
            {isLoadingRepos ? (
              <div className="font-mono text-sky-800 text-xs py-2">Memuat semua repositori GitHub Anda...</div>
            ) : repoError ? (
              <div className="font-mono text-rose-700 text-xs py-2">Gagal: {repoError}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-56 overflow-y-auto pr-2">
                {gitRepos.map((repo) => (
                  <button 
                    key={repo.id}
                    onClick={() => selectRepo(repo)}
                    className={`text-left p-3 border font-mono text-[10px] transition-all flex flex-col justify-between h-20 ${
                      activeRepo?.github_repo_id === repo.id
                        ? 'bg-sky-900 text-white border-sky-950'
                        : 'border-sky-900/20 bg-white hover:bg-sky-900/5 text-sky-900'
                    }`}
                  >
                    <span className="font-bold truncate w-full">{repo.name}</span>
                    <span className="opacity-60 text-[9px] truncate w-full">{repo.owner}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Dashboard Grid 3 Kolom */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Kolom Kiri: AI Agent Grid */}
          <div className="space-y-6">
            <h2 className="font-serif italic text-lg font-black text-sky-950 border-b border-sky-900/40 pb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              AI AGENTS STATUS
            </h2>
            
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="border border-sky-900/40 p-4 bg-white hover:border-sky-900 transition-all flex flex-col justify-between h-36">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sky-950 text-sm tracking-wide">{agent.name}</h3>
                      <span className="text-[10px] text-sky-900/50 uppercase tracking-widest">{agent.role} Agent</span>
                    </div>
                    <span className={`px-2 py-0.5 border text-[9px] font-bold ${
                      agent.status === 'Working' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 animate-pulse' :
                      agent.status === 'Waiting Review' ? 'border-amber-600 bg-amber-50 text-amber-700' :
                      'border-sky-900/20 bg-slate-100 text-sky-900/60'
                    }`}>
                      {agent.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-sky-900/10 flex justify-between items-center text-[10px] text-sky-900/60">
                    <div>
                      <span className="text-[9px] opacity-50 uppercase font-mono block">LAST ACTIVITY</span>
                      <span className="font-bold text-sky-950 truncate max-w-[200px] block">
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

          {/* Kolom Tengah: Activity Timeline */}
          <div className="space-y-6">
            <h2 className="font-serif italic text-lg font-black text-sky-950 border-b border-sky-900/40 pb-2 flex items-center gap-2">
              <GitCommit className="h-4 w-4" />
              ACTIVITY TIMELINE
            </h2>

            <div className="border border-sky-900/40 p-6 bg-white space-y-6 h-[460px] overflow-y-auto">
              {commits.length === 0 ? (
                <div className="text-center py-20 text-sky-900/40 font-mono">
                  BELUM ADA AKTIVITAS COMMIT MASUK
                </div>
              ) : (
                <div className="relative border-l border-sky-900/20 pl-4 space-y-6">
                  {commits.map((commit) => (
                    <div key={commit.id} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-sky-900 border border-sky-950" />

                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-sky-950">{commit.author_name}</span>
                        <span className="font-mono text-sky-900/50">
                          {new Date(commit.commit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-[11px] font-mono text-sky-900/80 bg-slate-100/60 p-2 border border-sky-900/10 mt-1 uppercase">
                        {commit.message}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-sky-900/40 font-mono">
                        <span className="text-emerald-700">+{commit.added_lines}</span>
                        <span className="text-rose-700">-{commit.deleted_lines}</span>
                        <span>{commit.branch}</span>
                        <span>{commit.sha.substring(0, 7)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Detail & AI Insight */}
          <div className="space-y-6">
            <h2 className="font-serif italic text-lg font-black text-sky-950 border-b border-sky-900/40 pb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI INSIGHT & TRACKER
            </h2>

            {/* Project Progress */}
            <div className="border border-sky-900/40 p-5 bg-white space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sky-950 text-xs">{task.title}</span>
                    <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-600/30">
                      {task.progress}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 border border-sky-900/10">
                    <div className="bg-sky-900 h-full transition-all duration-500" style={{ width: `${task.progress}%` }} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[9px]">
                    {task.subtasks.map((st, i) => (
                      <div 
                        key={i} 
                        className={`flex items-center gap-2 p-1.5 border ${
                          st.done 
                            ? 'bg-emerald-50/50 border-emerald-900/20 text-emerald-800' 
                            : 'bg-white border-sky-900/10 text-sky-900/50'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.done ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        {st.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* AI Summary */}
            <div className="border border-sky-900/40 p-5 bg-white space-y-3">
              <span className="font-bold text-sky-950 block text-xs">AI HEALTH DAILY SUMMARY</span>
              <ul className="space-y-2 text-sky-900/70 font-mono text-[10px] pl-3 list-disc marker:text-sky-900">
                {todayCommits.length === 0 ? (
                  <p className="text-sky-900/40 text-[9px] list-none pl-0">BELUM ADA DATA AKTIVITAS UNTUK HARI INI.</p>
                ) : (
                  <>
                    <li>UI AGENT: MENDESAIN HALAMAN LOGIN RESPONSIVE DAN FUNGSIONAL.</li>
                    <li>BACKEND AGENT: MENERAPKAN JWT AUTHENTIKASI DAN VERIFIKASI TOKEN.</li>
                    <li>TESTING AGENT: MENJALANKAN UNIT TEST DENGAN COVERAGE MENCAPAI 85%.</li>
                  </>
                )}
              </ul>
              <div className="pt-3 border-t border-sky-900/10 flex justify-between items-center text-[10px]">
                <span className="opacity-50 font-mono">SYSTEM HEALTH</span>
                <span className="text-emerald-700 font-bold">🟢 HEALTHY</span>
              </div>
            </div>

            {/* Agent Simulator */}
            <div className="border border-sky-900/40 p-5 bg-white space-y-4">
              <span className="font-bold text-sky-950 block text-xs">SIMULATE AGENT COMMIT</span>
              <form onSubmit={handleSimulate} className="space-y-3">
                <div className="flex gap-2">
                  <select 
                    value={selectedAgent} 
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="flex-1 bg-slate-50 border border-sky-900/20 p-2 text-sky-950 focus:outline-none text-[10px]"
                  >
                    <option value="UI Agent">UI Agent</option>
                    <option value="Backend Agent">Backend Agent</option>
                    <option value="Testing Agent">Testing Agent</option>
                    <option value="DevOps Agent">DevOps Agent</option>
                  </select>
                  <input 
                    type="number" 
                    value={filesCount} 
                    onChange={(e) => setFilesCount(Number(e.target.value))}
                    min="1" 
                    max="10"
                    className="w-12 bg-slate-50 border border-sky-900/20 p-2 text-center text-sky-950 focus:outline-none text-[10px]"
                    required
                  />
                </div>
                <input 
                  type="text" 
                  value={simMessage} 
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="COMMIT MESSAGE"
                  className="w-full bg-slate-50 border border-sky-900/20 p-2 text-sky-950 focus:outline-none text-[10px]"
                  required
                />
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="w-full bg-sky-900 hover:bg-sky-850 disabled:bg-sky-950/60 text-white font-mono font-bold py-2 border border-sky-950 transition-all text-[10px] flex items-center justify-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  {isSimulating ? 'SIMULATING...' : 'SIMULATE COMMIT'}
                </button>
              </form>
              {simStatus && (
                <div className="p-2 border border-sky-900/20 bg-slate-50 font-mono text-[9px] text-sky-950">
                  {simStatus}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <footer className="border-t border-sky-900/60 pt-4 flex justify-between items-center text-sky-900/50 font-mono text-[9px]">
          <span>© 2026 FIKRI BINTANG PURNOMO - ORCHESTRATOR DASHBOARD</span>
          <span>V1.0.0</span>
        </footer>

      </div>
    </div>
  );
}
