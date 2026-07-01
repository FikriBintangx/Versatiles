import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Webhook handler untuk menangkap push events dari GitHub
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Pastikan ini adalah event push
    if (!payload.commits || !payload.repository) {
      return NextResponse.json({ error: 'Bukan push event GitHub yang valid' }, { status: 400 });
    }

    const repoName = payload.repository.name;
    const repoFullName = payload.repository.full_name;
    const repoOwner = payload.repository.owner.name || payload.repository.owner.login;
    const repoGithubId = payload.repository.id;

    // 1. Dapatkan atau daftarkan repository
    let { data: repo, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('github_repo_id', repoGithubId)
      .single();

    if (repoError && repoError.code === 'PGRST116') {
      // Repo belum terdaftar, buat baru
      const { data: newRepo, error: insertRepoError } = await supabase
        .from('repositories')
        .insert({
          github_repo_id: repoGithubId,
          name: repoName,
          full_name: repoFullName,
          owner: repoOwner,
        })
        .select()
        .single();

      if (insertRepoError) {
        return NextResponse.json({ error: 'Gagal meregistrasikan repositori: ' + insertRepoError.message }, { status: 500 });
      }
      repo = newRepo;
    } else if (repoError) {
      return NextResponse.json({ error: 'Database error: ' + repoError.message }, { status: 500 });
    }

    const ref = payload.ref || '';
    const branch = ref.replace('refs/heads/', '');

    // 2. Iterasi setiap commit dari payload push
    for (const commitPayload of payload.commits) {
      const sha = commitPayload.id;
      const message = commitPayload.message;
      const authorName = commitPayload.author.name;
      const commitTime = commitPayload.timestamp;

      // Mendeteksi Agent berdasarkan nama author commit
      // Contoh: "UI Agent", "Backend Agent", dll.
      let agentName = 'Unknown Agent';
      let agentRole = 'Developer';

      if (authorName.toLowerCase().includes('ui agent') || authorName.toLowerCase().includes('claude agent')) {
        agentName = 'UI Agent';
        agentRole = 'UI';
      } else if (authorName.toLowerCase().includes('backend agent')) {
        agentName = 'Backend Agent';
        agentRole = 'Backend';
      } else if (authorName.toLowerCase().includes('testing agent')) {
        agentName = 'Testing Agent';
        agentRole = 'Testing';
      } else if (authorName.toLowerCase().includes('devops agent')) {
        agentName = 'DevOps Agent';
        agentRole = 'DevOps';
      } else if (authorName.toLowerCase().includes('ai agent') || authorName.toLowerCase().includes('orchestrator')) {
        agentName = 'AI Agent';
        agentRole = 'AI';
      } else {
        // Fallback jika nama developer biasa
        agentName = authorName;
      }

      // Upsert Agent ke database & update statusnya menjadi 'Working' atau 'Idle'
      let { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('name', agentName)
        .single();

      if (agentError && agentError.code === 'PGRST116') {
        const { data: newAgent, error: insertAgentError } = await supabase
          .from('agents')
          .insert({
            name: agentName,
            role: agentRole,
            status: 'Working',
            last_active: new Date().toISOString(),
          })
          .select()
          .single();
        if (!insertAgentError) agent = newAgent;
      } else if (agent) {
        // Update status & keaktifan
        await supabase
          .from('agents')
          .update({
            status: 'Working',
            last_active: new Date().toISOString(),
          })
          .eq('id', agent.id);
      }

      // Deteksi baris yang ditambahkan, dihapus, dsb jika ada (simulasi data default)
      const addedLines = commitPayload.added_lines || Math.floor(Math.random() * 80) + 10;
      const deletedLines = commitPayload.deleted_lines || Math.floor(Math.random() * 20) + 2;
      const modifiedFiles = commitPayload.modified || ['src/app/page.tsx'];

      // 3. Simpan data commit
      await supabase
        .from('commits')
        .insert({
          repo_id: repo.id,
          agent_id: agent ? agent.id : null,
          sha: sha,
          message: message,
          author_name: authorName,
          branch: branch,
          added_lines: addedLines,
          deleted_lines: deletedLines,
          modified_files: modifiedFiles,
          commit_time: commitTime,
        });

      // 4. Update otomatis progress subtask jika mendeteksi checklist di issue
      // Contoh pencarian: "close #1" atau "resolve Login Page -> UI"
      // Untuk demo ini, kita cari pola seperti "feat(login): [x] UI" atau "done UI"
      if (message.toLowerCase().includes('ui')) {
        await updateSubtaskProgress(repo.id, 'UI', true);
      }
      if (message.toLowerCase().includes('api') || message.toLowerCase().includes('jwt')) {
        await updateSubtaskProgress(repo.id, 'API', true);
      }
      if (message.toLowerCase().includes('test') || message.toLowerCase().includes('unit test')) {
        await updateSubtaskProgress(repo.id, 'Testing', true);
      }
      if (message.toLowerCase().includes('deploy')) {
        await updateSubtaskProgress(repo.id, 'Deploy', true);
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook diproses sukses' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fungsi pembantu untuk mengupdate status subtask pada issues_tasks
async function updateSubtaskProgress(repoId: string, subtaskName: string, isDone: boolean) {
  // Ambil issue/task aktif paling pertama
  const { data: tasks } = await supabase
    .from('issues_tasks')
    .select('*')
    .eq('repo_id', repoId)
    .limit(1);

  if (tasks && tasks.length > 0) {
    const activeTask = tasks[0];
    const subtasks = activeTask.subtasks || [];
    let updated = false;

    const newSubtasks = subtasks.map((st: any) => {
      if (st.title.toLowerCase() === subtaskName.toLowerCase()) {
        st.done = isDone;
        updated = true;
      }
      return st;
    });

    if (updated) {
      // Hitung progress baru
      const doneCount = newSubtasks.filter((st: any) => st.done).length;
      const progress = Math.round((doneCount / newSubtasks.length) * 100);

      await supabase
        .from('issues_tasks')
        .update({
          subtasks: newSubtasks,
          progress: progress,
          status: progress === 100 ? 'Closed' : 'Open',
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeTask.id);
    }
  }
}
