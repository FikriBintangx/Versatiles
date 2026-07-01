import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API untuk Generate Laporan Harian otomatis menggunakan Gemini
export async function POST(request: Request) {
  try {
    const { repoId, date } = await request.json();

    if (!repoId) {
      return NextResponse.json({ error: 'repoId wajib diisi' }, { status: 400 });
    }

    const reportDate = date || new Date().toISOString().split('T')[0];

    // 1. Ambil data commits hari ini untuk repositori terkait
    const { data: commits, error: commitsError } = await supabase
      .from('commits')
      .select('*')
      .eq('repo_id', repoId)
      .gte('commit_time', `${reportDate}T00:00:00Z`)
      .lte('commit_time', `${reportDate}T23:59:59Z`);

    if (commitsError) {
      return NextResponse.json({ error: 'Gagal mengambil data commit: ' + commitsError.message }, { status: 500 });
    }

    if (!commits || commits.length === 0) {
      return NextResponse.json({ 
        error: 'Tidak ada aktivitas commit hari ini. Simulasikan commit terlebih dahulu!' 
      }, { status: 400 });
    }

    // 2. Ambil data agents untuk memantau status saat ini
    const { data: agents } = await supabase.from('agents').select('*');

    // 3. Format data commits & agents menjadi text terstruktur untuk prompt Gemini
    const commitsSummaryText = commits.map((c, i) => (
      `${i+1}. Agent: ${c.author_name} | Commit: "${c.message}" | Branch: ${c.branch} | Tambah: +${c.added_lines} baris, Hapus: -${c.deleted_lines} baris.`
    )).join('\n');

    const agentsStatusText = (agents || []).map(a => (
      `- ${a.name} (${a.role}): Status saat ini ${a.status}, Terakhir aktif: ${a.last_active}`
    )).join('\n');

    // 4. Inisialisasi Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      // Fallback Laporan Mock jika API Key belum dipasang agar sistem tidak crash
      const mockReportContent = `### 📊 LAPORAN PRODUKTIVITAS TIM [MOCK]
Hari ini tim AI Agent Anda menunjukkan performa yang solid dengan menyelesaikan beberapa modul penting.

#### 🟢 PENCAPAIAN AGENT:
* **UI Agent**: Berhasil menyelesaikan redesign Login Page yang responsive dengan visual premium dan modern.
* **Backend Agent**: Menyelesaikan modul integrasi JWT Auth token dengan proteksi endpoint yang aman.

#### 📈 RINGKASAN DATA:
* Total Commits: **${commits.length} Commit**
* Total File Diubah: **${commits.reduce((acc, c) => acc + c.modified_files.length, 0)} Files**
* Rencana Selanjutnya: Melanjutkan integrasi unit testing dan persiapan deployment staging.`;

      // Simpan Mock Report ke database
      const { error: upsertError } = await supabase
        .from('daily_reports')
        .upsert({
          repo_id: repoId,
          report_date: reportDate,
          content: mockReportContent,
          summary_short: 'Tim AI Agent berhasil menyelesaikan redesign login page dan integrasi JWT Auth token.'
        }, { onConflict: 'repo_id,report_date' });

      if (upsertError) throw upsertError;

      return NextResponse.json({ 
        success: true, 
        isMock: true, 
        content: mockReportContent,
        warning: 'Menggunakan mock report karena GEMINI_API_KEY belum dikonfigurasi di .env.local.'
      });
    }

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Anda adalah Antigravity AI Project Manager. Tugas Anda adalah menganalisis aktivitas Git Commit hari ini dan membuat Laporan Harian Terstruktur untuk Manager Proyek.

Berikut adalah data aktivitas commit hari ini (${reportDate}):
${commitsSummaryText}

Status Agents saat ini:
${agentsStatusText}

Tolong buat laporan terstruktur dalam format MARKDOWN yang rapi dengan poin-poin berikut:
1. **Ringkasan Produktivitas Hari Ini** (Berikan gambaran umum kinerja tim hari ini).
2. **Pencapaian Per Agent** (Jelaskan apa yang diselesaikan oleh masing-masing Agent seperti UI Agent, Backend Agent, dsb berdasarkan pesan commit mereka).
3. **Analisis Kesehatan Sistem (Health Status)** (Apakah frekuensi commit normal, apakah ada agent yang tidak aktif/idle, dsb).
4. **Rencana & Langkah Kerja Esok Hari**.

Catatan: Gunakan gaya bahasa profesional, lugas, dan berikan sentuhan antusiasme teknologi yang tinggi.
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const reportContent = result.response.text();

    // Buat ringkasan singkat 1 kalimat lewat Gemini
    const summaryResult = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Buatkan 1 kalimat ringkasan singkat (maksimal 15 kata) dari laporan berikut:\n\n${reportContent}` }] }]
    });
    const summaryShort = summaryResult.response.text().trim();

    // 5. Simpan Laporan ke database Supabase (daily_reports)
    const { error: upsertError } = await supabase
      .from('daily_reports')
      .upsert({
        repo_id: repoId,
        report_date: reportDate,
        content: reportContent,
        summary_short: summaryShort
      }, { onConflict: 'repo_id,report_date' });

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ success: true, isMock: false, content: reportContent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
