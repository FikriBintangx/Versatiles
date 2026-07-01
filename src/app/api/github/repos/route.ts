import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token GitHub dibutuhkan' }, { status: 400 });
    }

    // Panggil API GitHub untuk mengambil daftar repositori user (termasuk private)
    const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated&visibility=all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Versatiles-Orchestrator'
      }
    });

    if (!res.ok) {
      const errData = await res.json();
      return NextResponse.json({ error: errData.message || 'Gagal meload repositori dari GitHub' }, { status: res.status });
    }

    const repos = await res.json();

    // Map data repositori yang relevan
    const formattedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: repo.owner.login,
      description: repo.description,
      html_url: repo.html_url
    }));

    return NextResponse.json({ repos: formattedRepos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
