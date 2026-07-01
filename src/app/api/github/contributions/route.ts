import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token, year } = await req.json();
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });

    // 1. Get authenticated user's login
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Versatiles-Dashboard' },
    });
    if (!userRes.ok) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const user = await userRes.json();
    const login = user.login;

    // 2. Build date range for selected year
    const from = `${year}-01-01T00:00:00Z`;
    const to   = `${year}-12-31T23:59:59Z`;

    // 3. GitHub GraphQL – contributionCalendar
    const query = `
      query($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          name
          avatarUrl
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  weekday
                }
              }
            }
          }
        }
      }
    `;

    const gqlRes = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Versatiles-Dashboard',
      },
      body: JSON.stringify({ query, variables: { login, from, to } }),
    });

    const gqlData = await gqlRes.json();

    if (gqlData.errors) {
      return NextResponse.json({ error: gqlData.errors[0].message }, { status: 400 });
    }

    const collection = gqlData.data.user.contributionsCollection;
    const calendar   = collection.contributionCalendar;

    return NextResponse.json({
      success: true,
      login,
      name: gqlData.data.user.name,
      avatarUrl: gqlData.data.user.avatarUrl,
      year,
      totalContributions: calendar.totalContributions,
      totalCommits: collection.totalCommitContributions,
      totalIssues: collection.totalIssueContributions,
      totalPRs: collection.totalPullRequestContributions,
      totalReviews: collection.totalPullRequestReviewContributions,
      weeks: calendar.weeks,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
