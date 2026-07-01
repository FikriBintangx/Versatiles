import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = 'http://localhost:3000/api/auth/github/callback';
  
  // Minta hak akses untuk read repo (public & private jika diperlukan)
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user`;

  return NextResponse.redirect(githubAuthUrl);
}
