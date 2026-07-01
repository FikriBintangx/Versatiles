import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simulasi push webhook github untuk keperluan demonstrasi & testing lokal
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentName, commitMessage, filesCount } = body;

    if (!agentName || !commitMessage) {
      return NextResponse.json({ error: 'agentName dan commitMessage wajib diisi' }, { status: 400 });
    }

    // 1. Definisikan ID Mock Repo
    const mockRepoGithubId = 123456789;
    const mockRepoName = 'AI-Agent-Orchestrator';
    const mockRepoFullName = 'ourscontent/AI-Agent-Orchestrator';

    // Ambil atau buat repository simulasi
    let { data: repo, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('github_repo_id', mockRepoGithubId)
      .single();

    if (repoError && repoError.code === 'PGRST116') {
      const { data: newRepo, error: insertRepoError } = await supabase
        .from('repositories')
        .insert({
          github_repo_id: mockRepoGithubId,
          name: mockRepoName,
          full_name: mockRepoFullName,
          owner: 'ourscontent',
        })
        .select()
        .single();
      
      if (insertRepoError) throw insertRepoError;
      repo = newRepo;
    } else if (repoError) {
      throw repoError;
    }

    if (!repo) {
      return NextResponse.json({ error: 'Repo tidak terdeteksi' }, { status: 500 });
    }

    // Pastikan Issue aktif ada, jika belum, mari kita buat Issue Mock "Login Page" dengan subtasks
    const { data: existingTasks } = await supabase
      .from('issues_tasks')
      .select('*')
      .eq('repo_id', repo.id)
      .limit(1);

    if (!existingTasks || existingTasks.length === 0) {
      await supabase
        .from('issues_tasks')
        .insert({
          repo_id: repo.id,
          title: 'Login Page Redesign',
          status: 'Open',
          progress: 0,
          subtasks: [
            { title: 'UI', done: false },
            { title: 'API', done: false },
            { title: 'Testing', done: false },
            { title: 'Deploy', done: false }
          ]
        });
    }

    // 2. Hubungi endpoint webhook github kita sendiri secara internal
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    const sha = Math.random().toString(16).substring(2, 10) + 'ffff';

    const webhookPayload = {
      ref: 'refs/heads/main',
      repository: {
        id: mockRepoGithubId,
        name: mockRepoName,
        full_name: mockRepoFullName,
        owner: {
          login: 'ourscontent',
          name: 'ourscontent'
        }
      },
      commits: [
        {
          id: sha,
          message: commitMessage,
          timestamp: new Date().toISOString(),
          author: {
            name: agentName,
            email: `${agentName.toLowerCase().replace(/\s/g, '')}@ai-orchestrator.local`
          },
          added_lines: Math.floor(Math.random() * 150) + 10,
          deleted_lines: Math.floor(Math.random() * 50) + 1,
          modified: Array.from({ length: filesCount || 2 }, (_, i) => `src/components/File_${i + 1}.tsx`)
        }
      ]
    };

    const webhookUrl = `${protocol}://${host}/api/webhook/github`;
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    const data = await res.json();
    return NextResponse.json({ success: true, webhookResponse: data, mockSha: sha });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
