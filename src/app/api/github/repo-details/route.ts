import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token, owner, repo } = await request.json();

    if (!token || !owner || !repo) {
      return NextResponse.json({ error: 'Parameter token, owner, dan repo dibutuhkan' }, { status: 400 });
    }

    const headers = { 
      'Authorization': `Bearer ${token}`, 
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'Versatiles-Orchestrator'
    };

    // 1. Ambil detail repo (stars, forks, etc)
    const detailRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    let detail = null;
    if (detailRes.ok) {
      detail = await detailRes.json();
    }

    // 2. Ambil 5 commit terakhir
    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`, { headers });
    let commits: any[] = [];
    if (commitsRes.ok) {
      const rawCommits = await commitsRes.json();
      if (Array.isArray(rawCommits)) {
        commits = rawCommits.map((c: any) => ({
          sha: c.sha,
          message: c.commit.message,
          author: c.commit.author.name,
          date: c.commit.author.date,
          html_url: c.html_url
        }));
      }
    }

    // 3. Ambil struktur file/folder di root
    const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
    let contents: any[] = [];
    if (contentsRes.ok) {
      const rawContents = await contentsRes.json();
      if (Array.isArray(rawContents)) {
        contents = rawContents.map((f: any) => ({
          name: f.name,
          type: f.type, // 'file' atau 'dir'
          path: f.path,
          size: f.size,
          html_url: f.html_url
        }));
      }
    }

    return NextResponse.json({ 
      success: true,
      detail, 
      commits,
      contents
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
