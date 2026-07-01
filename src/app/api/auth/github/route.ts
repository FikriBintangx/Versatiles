import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = 'https://versatiles.vercel.app/api/auth/github/callback';
  
  // Minta hak akses untuk read repo (public & private jika diperlukan)
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo%20user&prompt=consent`;

  return NextResponse.redirect(githubAuthUrl);
}
