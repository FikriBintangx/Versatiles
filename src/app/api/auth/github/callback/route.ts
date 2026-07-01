import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  try {
    // Tukar code menjadi Access Token
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(data.error_description || 'oauth_error')}`);
    }

    const accessToken = data.access_token;

    // Mengembalikan user ke dashboard dengan absolute URL untuk mematuhi standar Next.js Redirect
    const response = NextResponse.redirect(`${origin}/?github_connected=true&access_token=${accessToken}`);
    return response;
  } catch (error: any) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`);
  }
}
