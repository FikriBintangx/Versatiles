import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Serverless Worker: Dipicu oleh Webhook Database Supabase saat ada Goal / Task baru
export async function POST(request: Request) {
  let payload: any = null;
  try {
    payload = await request.json();
    
    // Ambil data goal dari payload trigger Supabase
    // Supabase Webhook mengirim detail baris baru pada field 'record'
    const goal = payload.record;

    if (!goal || !goal.prompt || goal.status !== 'In Progress') {
      return NextResponse.json({ message: 'Tidak ada prompt pengerjaan / status bukan In Progress' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY tidak dikonfigurasi di Vercel' }, { status: 500 });
    }

    // 1. Ambil detail repository untuk mengetahui nama repo & token OAuth
    const { data: repo, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', goal.repo_id)
      .single();

    if (repoError || !repo) {
      return NextResponse.json({ error: 'Repositori tidak terdaftar' }, { status: 400 });
    }

    // 2. Hubungi Gemini API untuk memproses kode
    const ai = new GoogleGenerativeAI(geminiApiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const promptText = `
Anda adalah AI Agent Developer (${goal.assigned_agent}).
Tugas Anda adalah menulis file kode berdasarkan instruksi berikut:
"${goal.prompt}"

Hasilkan file kode lengkap (misalnya komponen UI Next.js, utility, dsb).
Format output Anda harus berupa JSON dengan struktur berikut:
{
  "filePath": "src/components/NamaFileSesuaiTugas.tsx",
  "code": "isi kode lengkap disini"
}
Catatan: Pastikan output JSON Anda valid dan hanya kembalikan format JSON saja tanpa markdown block backticks (\`\`\`json).
`;

    const result = await model.generateContent(promptText);
    const rawText = result.response.text().trim();
    
    let parsedResult;
    try {
      const cleanJson = rawText.replace(/```json|```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (e) {
      console.error('❌ Gagal mem-parse respon JSON dari Gemini:', rawText);
      return NextResponse.json({ error: 'Respon AI bukan format JSON yang valid' }, { status: 500 });
    }

    const { filePath, code } = parsedResult;

    // 3. Modifikasi Berkas Langsung di GitHub Secara Serverless (Tanpa Local File System)
    // Kita gunakan GitHub API '/contents' untuk menulis / memperbarui file secara online
    // Kita membutuhkan token OAuth pengguna yang disimpan di localStorage sebelumnya,
    // Namun karena Supabase webhook berjalan di server, kita butuh cara mendapatkan token.
    // Tips: Kita bisa menyimpan token gitToken secara global atau melemparnya di header,
    // Untuk keamanan serverless, kita bisa mengambil personal token / Github App token.
    // Sebagai alternatif, kita bisa melakukan commit via GitHub API menggunakan token yang kita sediakan.
    
    // Dapatkan Access Token GitHub dari repositori terkait (jika disimpan)
    // Untuk kemudahan integrasi, kita asumsikan serverless menggunakan token rahasia GitHub Anda di env
    // Atau kita bisa mengaitkannya dengan GitHub App Installation Token.
    // Mari gunakan GITHUB_ACCESS_TOKEN dari Vercel Environment (Personal Access Token Anda untuk commit online)
    const githubToken = process.env.GITHUB_ACCESS_TOKEN;
    if (!githubToken) {
      return NextResponse.json({ 
        error: 'GITHUB_ACCESS_TOKEN tidak ditemukan di Vercel. Wajib diisi agar serverless bisa melakukan commit ke repo Anda.' 
      }, { status: 500 });
    }

    const owner = repo.owner;
    const repoName = repo.name;
    const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`;

    const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'Versatiles-Orchestrator'
    };

    // Ambil SHA file jika file sudah ada (untuk keperluan update)
    let sha = null;
    const checkFile = await fetch(url, { headers });
    if (checkFile.ok) {
      const fileData = await checkFile.json();
      sha = fileData.sha;
    }

    // Lakukan Commit secara Serverless langsung ke GitHub API!
    const commitBody = {
      message: `feat(${goal.assigned_agent.toLowerCase().replace(' agent', '')}): [x] ${goal.title}`,
      content: Buffer.from(code).toString('base64'),
      sha: sha || undefined,
      branch: 'main'
    };

    const commitRes = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commitBody)
    });

    if (!commitRes.ok) {
      const errData = await commitRes.json();
      throw new Error(`Gagal push ke GitHub API: ${errData.message}`);
    }

    // 4. Update Status Goal di Supabase menjadi Achieved
    await supabase
      .from('goals')
      .update({ status: 'Achieved' })
      .eq('id', goal.id);

    return NextResponse.json({ success: true, filePath, message: 'Kode berhasil ditulis dan di-push ke GitHub secara online!' });

  } catch (error: any) {
    // Tandai status gagal jika terjadi error
    if (payload?.record?.id) {
      await supabase
        .from('goals')
        .update({ status: 'Failed' })
        .eq('id', payload.record.id);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
