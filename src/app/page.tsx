'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  Plus,
  Target,
  FileText,
  Folder,
  FileCode,
  GitBranch,
  Star,
  Download
} from 'lucide-react';

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

interface Goal {
  id: string;
  title: string;
  description: string;
  status: string;
  prompt?: string;
  assigned_agent?: string;
  created_at: string;
}

interface DailyReport {
  id: string;
  report_date: string;
  content: string;
  summary_short: string;
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [tasks, setTasks] = useState<IssueTask[]>([]);
  const [activeRepo, setActiveRepo] = useState<any>(null);
  
  // State untuk Goals
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalPrompt, setNewGoalPrompt] = useState('');
  const [assignedAgent, setAssignedAgent] = useState('UI Agent');
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  // State untuk Antigravity Auto-Reports
  const [antigravityReports, setAntigravityReports] = useState<any[]>([]);

  // State untuk GitHub Repositories
  const [gitToken, setGitToken] = useState<string | null>(null);
  const [gitRepos, setGitRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState('');

  // State untuk Repo Explorer
  const [repoDetails, setRepoDetails] = useState<RepoDetails | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // State untuk form simulator
  const [selectedAgent, setSelectedAgent] = useState('UI Agent');
  const [simMessage, setSimMessage] = useState('feat(login): [x] UI redesign login page responsive');
  const [filesCount, setFilesCount] = useState(3);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStatus, setSimStatus] = useState('');

  // Ref untuk menghindari stale closure pada fetchData
  const activeRepoRef = useRef<any>(null);
  useEffect(() => {
    activeRepoRef.current = activeRepo;
  }, [activeRepo]);

  // Fetch initial data
  const fetchData = async (overrideRepo?: any) => {
    // 1. Get Repo
    let currentRepo = overrideRepo || activeRepoRef.current;
    
    if (!currentRepo) {
      const { data: repos } = await supabase.from('repositories').select('*').limit(1);
      if (repos && repos.length > 0) {
        currentRepo = repos[0];
        setActiveRepo(currentRepo);
      }
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

    // 4. Get active tasks & goals & reports
    if (currentRepo) {
      const { data: tasksData } = await supabase
        .from('issues_tasks')
        .select('*')
        .eq('repo_id', currentRepo.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (tasksData) setTasks(tasksData);

      // Get Goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('repo_id', currentRepo.id)
        .order('created_at', { ascending: false });
      if (goalsData) setGoals(goalsData);

      // Get Antigravity Live Reports
      fetch('/api/antigravity-report')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAntigravityReports(data.reports.reverse()); // terbaru di atas
          }
        })
        .catch(console.error);
    }
  };

  // Tangkap token github dari url callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token');
    if (token) {
      setGitToken(token);
      localStorage.setItem('gh_access_token', token);
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

    const goalsSubscription = supabase
      .channel('goals-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => {
        fetchData();
      })
      .subscribe();

    const reportsSubscription = supabase
      .channel('reports-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_reports' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(agentsSubscription);
      supabase.removeChannel(commitsSubscription);
      supabase.removeChannel(tasksSubscription);
      supabase.removeChannel(goalsSubscription);
      supabase.removeChannel(reportsSubscription);
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

  // Fetch Repo Details saat activeRepo berubah
  useEffect(() => {
    if (activeRepo && gitToken) {
      setIsFetchingDetails(true);
      fetch('/api/github/repo-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: gitToken,
          owner: activeRepo.owner,
          repo: activeRepo.name
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRepoDetails(data);
        }
      })
      .catch(console.error)
      .finally(() => setIsFetchingDetails(false));
    } else {
      setRepoDetails(null);
    }
  }, [activeRepo, gitToken]);

  const selectRepo = async (repo: GitHubRepo) => {
    try {
      // 1. Cek apakah ada di DB
      let { data: existingRepo, error: selectError } = await supabase
        .from('repositories')
        .select('*')
        .eq('github_repo_id', repo.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError; // error selain Not Found
      }

      // 2. Jika tidak ada, insert
      if (!existingRepo) {
        const { data: newRepo, error: insertError } = await supabase
          .from('repositories')
          .insert({
            github_repo_id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            owner: repo.owner,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        existingRepo = newRepo;
      }
      
      setActiveRepo(existingRepo);
      fetchData(existingRepo);
    } catch (err: any) {
      console.warn("Supabase Error (menggunakan fallback lokal):", err.message);
      // Fallback: Set UI menggunakan data GitHub
      const fallbackRepo = { ...repo, id: repo.id.toString() };
      setActiveRepo(fallbackRepo);
      fetchData(fallbackRepo);
    }
  };

  // Fungsi Tambah Goal Baru
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRepo) {
      alert('Koneksikan/pilih repositori aktif terlebih dahulu!');
      return;
    }
    setIsAddingGoal(true);
    try {
      const { error } = await supabase
        .from('goals')
        .insert({
          repo_id: activeRepo.id,
          title: newGoalTitle,
          description: newGoalDesc,
          prompt: newGoalPrompt || null,
          assigned_agent: assignedAgent,
          status: 'In Progress'
        });
      
      if (error) throw error;
      setNewGoalTitle('');
      setNewGoalDesc('');
      setNewGoalPrompt('');
    } catch (err: any) {
      alert(`Gagal membuat Goal: ${err.message}`);
    } finally {
      setIsAddingGoal(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('report-content');
      if (element) {
        // Simpan background asli
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = '#ffffff'; // Set bg putih untuk PDF
        element.style.padding = '20px';
        
        const canvas = await html2canvas(element, { scale: 2 });
        
        // Kembalikan style
        element.style.backgroundColor = originalBg;
        element.style.padding = '';

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('Antigravity_Reports.pdf');
      }
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Gagal membuat PDF. Pastikan jspdf dan html2canvas terinstall.');
    }
  };

  const handleDownloadDoc = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    const footer = "</body></html>";
    let sourceHTML = header + "<h2 style='font-family: sans-serif; color: #1e3a8a;'>ANTIGRAVITY LIVE REPORTS</h2>";
    
    antigravityReports.forEach(report => {
      sourceHTML += `
        <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; font-family: monospace;">
          <p><strong>Time:</strong> ${new Date(report.timestamp || report.receivedAt).toLocaleString()}</p>
          <p><strong>Status:</strong> ${report.status}</p>
          <p><strong>Summary:</strong> ${report.summary}</p>
          <p><strong>Details:</strong><br/>${(report.details || '').replace(/\n/g, '<br/>')}</p>
        </div>
      `;
    });
    
    sourceHTML += footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'Antigravity_Reports.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  // Fungsi Ubah Status Goal (Toggle)
  const toggleGoalStatus = async (goalId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Achieved' ? 'In Progress' : 'Achieved';
    try {
      await supabase
        .from('goals')
        .update({ status: nextStatus })
        .eq('id', goalId);
    } catch (err: any) {
      alert(`Gagal update goal: ${err.message}`);
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

  return (
    <div className="min-h-screen text-blue-700 bg-slate-50 relative selection:bg-blue-500/20 uppercase tracking-wider font-sans text-xs">
      
      {/* Texture Overlay (Gaya Portfolio Hermes) */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.04] mix-blend-multiply" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)\'/%3E%3C/svg%3E")` }}
      />

      {/* Container utama */}
      <div className="max-w-[1600px] mx-auto px-6 py-8 relative z-10 space-y-12">
        
        {/* Header Grid */}
        <header className="grid grid-cols-1 md:grid-cols-4 border-t-2 border-b-2 border-blue-700 text-blue-900 items-center">
          <div className="p-4 border-r border-blue-700 font-serif italic text-2xl font-black tracking-normal text-blue-800">
            ORCHESTRATOR
          </div>
          <div className="p-4 border-r border-blue-700 font-mono text-[10px] tracking-widest text-blue-700/80">
            [ STATUS: <span className="text-emerald-600 font-bold">ACTIVE</span> ]
          </div>
          <div className="p-4 border-r border-blue-700 font-mono text-[10px] tracking-widest text-blue-700/80">
            REPO: {activeRepo ? activeRepo.name : 'NONE CONNECTED'}
          </div>
          <div className="p-4 flex justify-between items-center">
            {!gitToken ? (
              <a 
                href="/api/auth/github"
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-slate-100 font-mono font-bold px-3 py-1.5 border border-blue-800 transition-all text-[10px]"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                CONNECT GITHUB
              </a>
            ) : (
              <button 
                onClick={handleLogoutGitHub}
                className="flex items-center gap-2 bg-rose-700 hover:bg-rose-600 text-slate-100 font-mono font-bold px-3 py-1.5 border border-rose-800 transition-all text-[10px]"
              >
                DISCONNECT
              </button>
            )}
            <button 
              onClick={fetchData}
              className="p-1.5 border border-blue-700/40 hover:bg-blue-700/10 text-blue-700 transition-all rounded"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Section: Pilih Repo */}
        {gitToken && (
          <section className="border border-blue-700/40 p-6 bg-blue-50">
            <h2 className="font-serif italic text-lg font-extrabold text-blue-900 mb-3 flex items-center gap-2">
              <Compass className="h-4 w-4 text-blue-700" />
              PILIH REPOSITORI AKTIF GITHUB
            </h2>
            <p className="text-[10px] text-blue-800/60 font-mono mb-4">KLIK PADA REPO UNTUK MENJADIKANNYA SUMBER UTAMA DASHBOARD</p>
            
            {isLoadingRepos ? (
              <div className="font-mono text-blue-800 text-xs py-2 animate-pulse">Memuat semua repositori GitHub Anda...</div>
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
                        ? 'bg-blue-700 text-white border-blue-800'
                        : 'border-blue-700/20 bg-white hover:bg-blue-50 text-blue-800'
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

        {/* Section: Repo Explorer */}
        {activeRepo && (
          <section className="border border-blue-700/40 p-6 bg-white space-y-4">
             <h2 className="font-serif italic text-lg font-black text-blue-900 flex items-center gap-2 border-b border-blue-700/20 pb-3">
              <Folder className="h-5 w-5 text-blue-700" />
              REPOSITORY EXPLORER: <span className="text-blue-600">{activeRepo.full_name}</span>
            </h2>
            
            {isFetchingDetails ? (
              <div className="font-mono text-blue-800 text-xs py-4 animate-pulse">MEMUAT DETAIL REPOSITORI DARI GITHUB...</div>
            ) : repoDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Detail & Files */}
                <div className="space-y-4">
                   <div className="flex gap-4 font-mono text-[10px] text-blue-800/80 bg-slate-50 p-3 border border-blue-700/10">
                     <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {repoDetails.detail?.stargazers_count} STARS</span>
                     <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> {repoDetails.detail?.default_branch}</span>
                     <span>{repoDetails.detail?.language || 'Unknown Lang'}</span>
                   </div>
                   
                   <div className="border border-blue-700/20">
                     <div className="bg-blue-50 text-blue-900 font-bold p-2 text-[10px] border-b border-blue-700/20">ROOT DIRECTORY</div>
                     <div className="max-h-60 overflow-y-auto bg-white p-2 space-y-1">
                        {repoDetails.contents.length > 0 ? repoDetails.contents.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[10px] font-mono text-blue-900 p-1.5 hover:bg-slate-50 cursor-pointer">
                            {file.type === 'dir' ? <Folder className="h-3.5 w-3.5 text-blue-500" /> : <FileCode className="h-3.5 w-3.5 text-blue-700/60" />}
                            <span className="truncate">{file.name}</span>
                          </div>
                        )) : <div className="text-center text-[9px] text-blue-800/50 p-4">KOSONG</div>}
                     </div>
                   </div>
                </div>

                {/* Recent Commits */}
                <div className="border border-blue-700/20 flex flex-col">
                   <div className="bg-blue-50 text-blue-900 font-bold p-2 text-[10px] border-b border-blue-700/20">RECENT GITHUB COMMITS</div>
                   <div className="max-h-[304px] overflow-y-auto bg-white p-3 space-y-3">
                      {repoDetails.commits.length > 0 ? repoDetails.commits.map((commit, idx) => (
                        <div key={idx} className="border-b border-blue-700/10 pb-2 last:border-0 last:pb-0">
                           <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-[10px] text-blue-800">{commit.author}</span>
                              <span className="text-[9px] text-blue-600/60 font-mono">{new Date(commit.date).toLocaleDateString()}</span>
                           </div>
                           <p className="text-[10px] font-mono text-blue-950/80 mb-1 leading-snug">{commit.message}</p>
                           <a href={commit.html_url} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-blue-600 hover:underline">SHA: {commit.sha.substring(0,7)}</a>
                        </div>
                      )) : <div className="text-center text-[9px] text-blue-800/50 p-4">TIDAK ADA COMMIT</div>}
                   </div>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* Dashboard Grid 3 Kolom */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Kolom Kiri: AI Agent Grid */}
          <div className="space-y-6">
            <h2 className="font-serif italic text-lg font-black text-blue-900 border-b-2 border-blue-700 pb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-700" />
              AI AGENTS STATUS
            </h2>
            
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="border border-blue-700/40 p-4 bg-white hover:border-blue-700 transition-all flex flex-col justify-between h-36">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-blue-900 text-sm tracking-wide">{agent.name}</h3>
                      <span className="text-[10px] text-blue-800/50 uppercase tracking-widest">{agent.role} Agent</span>
                    </div>
                    <span className={`px-2 py-0.5 border text-[9px] font-bold ${
                      agent.status === 'Working' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 animate-pulse' :
                      agent.status === 'Waiting Review' ? 'border-amber-600 bg-amber-50 text-amber-700' :
                      'border-blue-700/20 bg-slate-100 text-blue-800/60'
                    }`}>
                      {agent.status}
                    </span>
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

          {/* Kolom Tengah: Activity Timeline */}
          <div className="space-y-6">
            <h2 className="font-serif italic text-lg font-black text-blue-900 border-b-2 border-blue-700 pb-2 flex items-center gap-2">
              <GitCommit className="h-4 w-4 text-blue-700" />
              ACTIVITY TIMELINE
            </h2>

            <div className="border border-blue-700/40 p-6 bg-white space-y-6 h-[460px] overflow-y-auto">
              {commits.length === 0 ? (
                <div className="text-center py-20 text-blue-800/40 font-mono">
                  BELUM ADA AKTIVITAS COMMIT MASUK
                </div>
              ) : (
                <div className="relative border-l-2 border-blue-700/20 pl-4 space-y-6">
                  {commits.map((commit) => (
                    <div key={commit.id} className="relative">
                      {/* Timeline Dot */}
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
                        <span>{commit.sha.substring(0, 7)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Detail, Daily Report, Goals & Simulator */}
          <div className="space-y-6">
            <h2 className="font-serif italic text-lg font-black text-blue-900 border-b-2 border-blue-700 pb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-700" />
              AI INSIGHT & GOALS
            </h2>

            {/* Fitur Goals */}
            <div className="border border-blue-700/40 p-5 bg-white space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-blue-700/10">
                <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-blue-700" />
                  PROJECT GOALS
                </span>
                <span className="font-mono text-[9px] bg-blue-50 text-blue-700 border border-blue-700/30 px-1.5 py-0.5 font-bold">
                  {goals.filter(g => g.status === 'Achieved').length}/{goals.length} COMPLETED
                </span>
              </div>

              {/* List Goals */}
              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {goals.length === 0 ? (
                  <p className="text-blue-800/40 text-[9px] font-mono text-center py-4">BELUM ADA GOAL. TAMBAHKAN GOAL DI BAWAH.</p>
                ) : (
                  goals.map((goal) => (
                    <div 
                      key={goal.id} 
                      onClick={() => toggleGoalStatus(goal.id, goal.status)}
                      className={`p-2.5 border cursor-pointer transition-all flex items-start gap-2.5 ${
                        goal.status === 'Achieved' 
                          ? 'bg-emerald-50/50 border-emerald-700/30 text-emerald-800 line-through opacity-70' 
                          : 'bg-slate-50 border-blue-700/10 hover:border-blue-700 text-blue-950'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={goal.status === 'Achieved'} 
                        onChange={() => {}}
                        className="mt-0.5 accent-emerald-600"
                      />
                      <div className="text-[10px]">
                        <span className="font-bold block tracking-wide">{goal.title}</span>
                        {goal.description && <span className="opacity-60 text-[9px] block font-mono lowercase mt-0.5">{goal.description}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>

               {/* Form Tambah Goal */}
              <form onSubmit={handleAddGoal} className="pt-3 border-t border-blue-700/10 space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newGoalTitle} 
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="TARGET / GOAL"
                    className="flex-1 bg-slate-50 border border-blue-700/20 p-2 text-blue-950 focus:outline-none text-[10px] font-mono uppercase"
                    required
                  />
                  <select
                    value={assignedAgent}
                    onChange={(e) => setAssignedAgent(e.target.value)}
                    className="w-28 bg-slate-50 border border-blue-700/20 p-1.5 text-blue-950 focus:outline-none text-[9px] font-mono"
                  >
                    <option value="UI Agent">UI AGENT</option>
                    <option value="Backend Agent">BACKEND AGENT</option>
                    <option value="Testing Agent">TESTING AGENT</option>
                    <option value="DevOps Agent">DEVOPS AGENT</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  value={newGoalDesc} 
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                  placeholder="DESKRIPSI TARGET (OPSIONAL)"
                  className="w-full bg-slate-50 border border-blue-700/20 p-2 text-blue-950 focus:outline-none text-[10px] font-mono uppercase"
                />
                {/* Input Prompt Khusus untuk mengirim instruksi kerja ke Agent Worker */}
                <textarea 
                  value={newGoalPrompt} 
                  onChange={(e) => setNewGoalPrompt(e.target.value)}
                  placeholder="AI INSTRUCTION / PROMPT (E.G. BUAT FILE NAVBAR.TSX DI SRC/COMPONENTS)"
                  className="w-full bg-slate-50 border border-blue-700/20 p-2 text-blue-950 focus:outline-none text-[9px] font-mono uppercase h-14"
                />
                <button
                  type="submit"
                  disabled={isAddingGoal}
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white font-mono font-bold py-1.5 border border-blue-800 transition-all text-[9px] flex items-center justify-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  {isAddingGoal ? 'ASSIGNING TASK...' : 'ASSIGN TASK TO AGENT'}
                </button>
              </form>
            </div>

            {/* Daily Report Interaktif buatan Antigravity */}
            <div className="border border-blue-700/40 p-5 bg-white space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-blue-700/10">
                <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-700" />
                  ANTIGRAVITY LIVE REPORTS
                </span>
                <span className="text-[9px] font-mono text-blue-800/60 font-bold bg-slate-50 px-2 py-0.5 border border-blue-700/10">
                  AUTO-SYNC
                </span>
                <div className="flex gap-1 ml-auto">
                  <button onClick={handleDownloadPDF} title="Download PDF" className="p-1 hover:bg-slate-100 text-blue-700 transition-colors border border-transparent hover:border-blue-700/20 rounded">
                    <span className="text-[8px] font-bold">PDF</span>
                  </button>
                  <button onClick={handleDownloadDoc} title="Download Word (.doc)" className="p-1 hover:bg-slate-100 text-blue-700 transition-colors border border-transparent hover:border-blue-700/20 rounded">
                    <span className="text-[8px] font-bold">DOC</span>
                  </button>
                </div>
              </div>

              <div id="report-content" className="pt-2">
                {antigravityReports.length > 0 ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {antigravityReports.map((report, idx) => (
                      <div key={idx} className="space-y-2 border-b border-blue-700/10 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-mono font-bold text-emerald-700">{new Date(report.timestamp || report.receivedAt).toLocaleString()}</span>
                           <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-1 border border-blue-700/20">{report.status}</span>
                        </div>
                        <div className="p-2 border border-blue-700/10 bg-slate-50 text-[10px] font-mono text-blue-900">
                          <strong>summary:</strong> {report.summary}
                        </div>
                        <div className="text-[10px] font-mono text-blue-950 space-y-1 whitespace-pre-wrap">
                          {report.details}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-blue-800/40 text-[9px] font-mono mb-3">BELUM ADA LAPORAN DARI ANTIGRAVITY.</p>
                    <p className="text-blue-800/30 text-[8px] font-mono uppercase">Laporan akan masuk otomatis saat saya (Antigravity) selesai bekerja.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Agent Simulator */}
            <div className="border border-blue-700/40 p-5 bg-white space-y-4">
              <span className="font-bold text-blue-900 block text-xs">SIMULATE AGENT COMMIT</span>
              <form onSubmit={handleSimulate} className="space-y-3">
                <div className="flex gap-2">
                  <select 
                    value={selectedAgent} 
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="flex-1 bg-slate-50 border border-blue-700/20 p-2 text-blue-950 focus:outline-none text-[10px]"
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
                    className="w-12 bg-slate-50 border border-blue-700/20 p-2 text-center text-blue-950 focus:outline-none text-[10px]"
                    required
                  />
                </div>
                <input 
                  type="text" 
                  value={simMessage} 
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="COMMIT MESSAGE"
                  className="w-full bg-slate-50 border border-blue-700/20 p-2 text-blue-950 focus:outline-none text-[10px]"
                  required
                />
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-blue-800/60 text-white font-mono font-bold py-2 border border-blue-800 transition-all text-[10px] flex items-center justify-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  {isSimulating ? 'SIMULATING...' : 'SIMULATE COMMIT'}
                </button>
              </form>
              {simStatus && (
                <div className="p-2 border border-blue-700/20 bg-slate-50 font-mono text-[9px] text-blue-950">
                  {simStatus}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <footer className="border-t-2 border-blue-700 pt-4 flex justify-between items-center text-blue-700/60 font-mono text-[9px]">
          <span>© 2026 FIKRI BINTANG PURNOMO - ORCHESTRATOR DASHBOARD</span>
          <span>V1.0.0</span>
        </footer>

      </div>
    </div>
  );
}
