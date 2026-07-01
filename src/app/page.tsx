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
  AlertCircle
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  last_active: string;
  avatar_url?: string;
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
  agent?: Agent;
}

interface IssueTask {
  id: string;
  title: string;
  status: string;
  progress: number;
  subtasks: { title: string; done: boolean }[];
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [tasks, setTasks] = useState<IssueTask[]>([]);
  const [activeRepo, setActiveRepo] = useState<any>(null);
  
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

    // 3. Get Commits with Agent Join
    const { data: commitsData } = await supabase
      .from('commits')
      .select('*, agent:agents(*)')
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

  useEffect(() => {
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

  // Hitung statistik kontribusi harian secara dinamis dari commit
  const todayCommits = commits.filter(c => {
    const today = new Date().toISOString().split('T')[0];
    const commitDate = new Date(c.commit_time).toISOString().split('T')[0];
    return today === commitDate;
  });

  const getAgentCommitsCount = (agentName: string) => {
    return commits.filter(c => c.author_name === agentName).length;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AI Agent Orchestrator
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            GitHub-driven Realtime project management dashboard & agent monitor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass px-4 py-2 rounded-lg flex items-center gap-3 text-sm">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-mono text-xs">
              {activeRepo ? activeRepo.full_name : 'No Repo Connected'}
            </span>
          </div>
          <button 
            onClick={fetchData}
            className="p-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Kiri & Tengah (Dashboard Konten Utama) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: AI Agent Status */}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              AI Agent Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="glass glass-hover p-5 rounded-xl flex flex-col justify-between h-44">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        {agent.role === 'UI' && <Layers className="h-5 w-5 text-emerald-400" />}
                        {agent.role === 'Backend' && <Server className="h-5 w-5 text-blue-400" />}
                        {agent.role === 'Testing' && <CheckSquare className="h-5 w-5 text-amber-400" />}
                        {agent.role === 'DevOps' && <Terminal className="h-5 w-5 text-purple-400" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{agent.name}</h3>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">{agent.role} Agent</span>
                      </div>
                    </div>
                    
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                      agent.status === 'Working' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      agent.status === 'Waiting Review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-slate-500/10 text-slate-400 border border-slate-500/10'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        agent.status === 'Working' ? 'bg-emerald-400 animate-ping' :
                        agent.status === 'Waiting Review' ? 'bg-amber-400' :
                        'bg-slate-500'
                      }`} />
                      {agent.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Aktivitas Terakhir</p>
                      <p className="font-medium text-slate-300 mt-0.5">
                        {commits.find(c => c.author_name === agent.name)?.message || 'Belum ada commit'}
                      </p>
                    </div>
                    <span className="text-slate-500 text-[10px] whitespace-nowrap ml-2">
                      {new Date(agent.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Activity Timeline */}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <GitCommit className="h-4 w-4 text-emerald-400" />
              Activity Timeline
            </h2>

            <div className="glass rounded-xl p-6 space-y-6">
              {commits.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  Belum ada aktivitas commit. Silakan gunakan panel simulator di samping untuk mengirim commit.
                </div>
              ) : (
                <div className="relative border-l-2 border-white/5 pl-6 space-y-8">
                  {commits.map((commit) => (
                    <div key={commit.id} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </span>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-white hover:underline cursor-pointer">
                            {commit.author_name}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">on {commit.branch}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(commit.commit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-sm font-mono text-slate-300 mt-1 bg-white/5 p-2.5 rounded-lg border border-white/5">
                        {commit.message}
                      </p>

                      <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-500">
                        <span className="font-mono text-emerald-400 font-semibold">+{commit.added_lines} lines</span>
                        <span className="font-mono text-rose-400 font-semibold">-{commit.deleted_lines} lines</span>
                        <span>•</span>
                        <span>{commit.modified_files.length} file diubah</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{commit.sha.substring(0, 7)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Kolom Kanan (Statistik & Simulator Control) */}
        <div className="space-y-8">
          
          {/* Task Progress Tracking */}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-emerald-400" />
              Project Progress
            </h2>

            <div className="glass p-6 rounded-xl space-y-6">
              {tasks.map((task) => (
                <div key={task.id} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-base">{task.title}</h3>
                    <span className="text-xs text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                      {task.progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>

                  {/* Subtask Checklists */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {task.subtasks.map((st, i) => (
                      <div 
                        key={i} 
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-semibold ${
                          st.done 
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                            : 'bg-white/5 border-white/5 text-slate-400'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${st.done ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        {st.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-4 text-slate-500 text-xs">
                  Belum ada issue / progress tracker terdaftar.
                </div>
              )}
            </div>
          </section>

          {/* AI Daily Summary */}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              AI Summary (Daily Insight)
            </h2>

            <div className="glass p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 p-3 rounded-lg border border-white/5">
                <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                <span>Rangkuman aktivitas Agent hari ini:</span>
              </div>
              <ul className="space-y-2 text-sm text-slate-300 pl-4 list-disc marker:text-emerald-400">
                {todayCommits.length === 0 ? (
                  <p className="text-slate-500 text-xs pl-0 list-none">Belum ada commit masuk hari ini untuk dibuat rangkuman.</p>
                ) : (
                  <>
                    <li>
                      <strong>UI Agent</strong>: Mendesain halaman Login responsive dan fungsional.
                    </li>
                    <li>
                      <strong>Backend Agent</strong>: Menerapkan JWT Authentikasi dan verifikasi token.
                    </li>
                    <li>
                      <strong>Testing Agent</strong>: Menjalankan unit test dengan coverage mencapai 85%.
                    </li>
                  </>
                )}
              </ul>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 justify-between">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                  Health Status:
                </span>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                  🟢 Healthy
                </span>
              </div>
            </div>
          </section>

          {/* Webhook & Commit Simulator Control */}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              Agent Commit Simulator
            </h2>

            <form onSubmit={handleSimulate} className="glass p-6 rounded-xl space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Pilih AI Agent</label>
                <select 
                  value={selectedAgent} 
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="UI Agent" className="bg-slate-900">UI Agent</option>
                  <option value="Backend Agent" className="bg-slate-900">Backend Agent</option>
                  <option value="Testing Agent" className="bg-slate-900">Testing Agent</option>
                  <option value="DevOps Agent" className="bg-slate-900">DevOps Agent</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Commit Message</label>
                <input 
                  type="text" 
                  value={simMessage} 
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="e.g. feat(login): redesign login page"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Jumlah File Diubah</label>
                <input 
                  type="number" 
                  value={filesCount} 
                  onChange={(e) => setFilesCount(Number(e.target.value))}
                  min="1" 
                  max="15"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                {isSimulating ? 'Memproses...' : 'Simulasikan Push Commit'}
              </button>

              {simStatus && (
                <div className="text-xs p-2.5 rounded bg-white/5 border border-white/5 text-slate-300 flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-emerald-400" />
                  <span className="font-mono">{simStatus}</span>
                </div>
              )}
            </form>
          </section>

        </div>

      </div>
    </main>
  );
}
