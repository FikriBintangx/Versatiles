const dictionaries = {
  id: {
    title: "FIKRI BINTANG PURNOMO — ORCHESTRATOR DASHBOARD",
    stats: {
      total_agents: "TOTAL AGEN",
      active_workload: "BEBAN AKTIF",
      goals_done: "GOAL SELESAI",
      lines_written: "BARIS DITULIS",
    },
    heatmap: {
      title: "CONTRIBUTION_HEATMAP.SYS",
    },
    workload: {
      title: "AI_AGENT_WORKLOAD.DLL",
      header: "BEBAN KERJA & KINERJA AI AGENT",
      subtitle: "Distribusi Tugas Saat Ini",
    },
    repo_picker: {
      title: "PILIH REPOSITORI GITHUB AKTIF",
      subtitle: "KLIK REPO UNTUK MENJADIKANNYA SUMBER UTAMA DASHBOARD",
      search: "CARI REPO...",
    },
    explorer: {
      title: "REPOSITORY EXPLORER",
      root: "DIREKTORI ROOT",
      commits: "RECENT GITHUB COMMITS",
      empty: "KOSONG",
      no_commits: "TIDAK ADA COMMIT",
    },
    agents: {
      title: "STATUS AGEN AI",
      last_activity: "AKTIVITAS TERAKHIR",
      no_commits: "BELUM ADA COMMIT",
    },
    timeline: {
      title: "LINIMASA AKTIVITAS",
      empty: "BELUM ADA AKTIVITAS",
    },
    goals: {
      title: "INSIGHT & TARGET AI",
      project_goals: "TARGET PROYEK",
      add_goal: "TAMBAH TARGET BARU",
      placeholder_title: "TARGET / GOAL",
      placeholder_desc: "DESKRIPSI (OPSIONAL)",
      placeholder_prompt: "INSTRUKSI AI / PROMPT (MISAL: BUAT NAVBAR.TSX DI SRC/COMPONENTS)",
      button: "TUGASKAN KE AGEN",
      assigning: "MENUGASKAN...",
    },
    vault: {
      title: "PASSWORD SAFE VAULT",
      search: "CARI PASSWORD...",
      empty: "BELUM ADA PASSWORD TERSIMPAN",
      add_new: "TAMBAH PASSWORD BARU",
      label_app: "NAMA AKUN / APLIKASI (MISAL: GITHUB, GMAIL)",
      label_user: "USERNAME / EMAIL",
      label_pass: "PASSWORD",
      label_url: "URL WEBSITE (OPSIONAL)",
      label_notes: "CATATAN",
      save: "SIMPAN PASSWORD",
      saving: "MENYIMPAN...",
    },
    reports: {
      title: "LAPORAN LANGSUNG ANTIGRAVITY",
      empty: "BELUM ADA LAPORAN DARI ANTIGRAVITY.",
      empty_subtitle: "Laporan masuk otomatis saat saya selesai bekerja.",
    },
    simulator: {
      title: "SIMULASIKAN COMMIT AGEN",
      placeholder_msg: "PESAN COMMIT",
      button: "SIMULASIKAN COMMIT",
      simulating: "MENSIMULASIKAN...",
    },
    terminal: {
      title: "SYSTEM CONSOLE TERMINAL",
    }
  },
  en: {
    title: "FIKRI BINTANG PURNOMO — ORCHESTRATOR DASHBOARD",
    stats: {
      total_agents: "TOTAL AGENTS",
      active_workload: "ACTIVE WORKLOAD",
      goals_done: "GOALS DONE",
      lines_written: "LINES WRITTEN",
    },
    heatmap: {
      title: "CONTRIBUTION_HEATMAP.SYS",
    },
    workload: {
      title: "AI_AGENT_WORKLOAD.DLL",
      header: "AI AGENT WORKLOAD & PERFORMANCE",
      subtitle: "Current Task Distribution",
    },
    repo_picker: {
      title: "SELECT ACTIVE GITHUB REPOSITORY",
      subtitle: "CLICK REPO TO MAKE IT THE MAIN DASHBOARD SOURCE",
      search: "SEARCH REPO...",
    },
    explorer: {
      title: "REPOSITORY EXPLORER",
      root: "ROOT DIRECTORY",
      commits: "RECENT GITHUB COMMITS",
      empty: "EMPTY",
      no_commits: "NO COMMITS",
    },
    agents: {
      title: "AI AGENTS STATUS",
      last_activity: "LAST ACTIVITY",
      no_commits: "NO COMMITS YET",
    },
    timeline: {
      title: "ACTIVITY TIMELINE",
      empty: "NO ACTIVITY YET",
    },
    goals: {
      title: "AI INSIGHT & GOALS",
      project_goals: "PROJECT GOALS",
      add_goal: "ADD NEW GOAL",
      placeholder_title: "GOAL TITLE",
      placeholder_desc: "DESCRIPTION (OPTIONAL)",
      placeholder_prompt: "AI INSTRUCTION / PROMPT (E.G. CREATE NAVBAR.TSX IN SRC/COMPONENTS)",
      button: "ASSIGN TASK TO AGENT",
      assigning: "ASSIGNING...",
    },
    vault: {
      title: "PASSWORD SAFE VAULT",
      search: "SEARCH PASSWORDS...",
      empty: "NO PASSWORDS SAVED YET",
      add_new: "ADD NEW PASSWORD",
      label_app: "ACCOUNT / APP NAME (E.G. GITHUB, GMAIL)",
      label_user: "USERNAME / EMAIL",
      label_pass: "PASSWORD",
      label_url: "WEBSITE URL (OPTIONAL)",
      label_notes: "NOTES / CATATAN",
      save: "SAVE PASSWORD",
      saving: "SAVING...",
    },
    reports: {
      title: "ANTIGRAVITY LIVE REPORTS",
      empty: "NO REPORTS RECEIVED YET.",
      empty_subtitle: "Reports sync automatically after I finish tasks.",
    },
    simulator: {
      title: "SIMULATE AGENT COMMIT",
      placeholder_msg: "COMMIT MESSAGE",
      button: "SIMULATE COMMIT",
      simulating: "SIMULATING...",
    },
    terminal: {
      title: "SYSTEM CONSOLE TERMINAL",
    }
  }
};

export type Locale = 'id' | 'en';
export const getDictionary = (locale: Locale) => dictionaries[locale] || dictionaries.id;
