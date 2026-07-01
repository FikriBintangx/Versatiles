const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Inisialisasi Kredensial
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Kredensial Supabase tidak ditemukan di .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const ai = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

console.log('🤖 AI Agent Local Worker Aktif...');
console.log('📡 Menunggu perintah/goals baru dari Dashboard Supabase secara realtime...\n');

// Subscribe ke tabel goals untuk mendeteksi penambahan goal baru
const channel = supabase
  .channel('goals-worker')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'goals' },
    async (payload) => {
      const newGoal = payload.new;

      // Jika goal baru memiliki prompt dan berstatus 'In Progress'
      if (newGoal.prompt && newGoal.status === 'In Progress') {
        console.log(`\n🔔 Perintah Baru Diterima: "${newGoal.title}"`);
        console.log(`🎯 Ditugaskan ke: ${newGoal.assigned_agent}`);
        console.log(`💬 Instruksi / Prompt: "${newGoal.prompt}"`);

        await executeTask(newGoal);
      }
    }
  )
  .subscribe();

// Fungsi mengeksekusi tugas menggunakan Gemini secara lokal
async function executeTask(goal) {
  try {
    if (!ai) {
      console.log('⚠️ GEMINI_API_KEY kosong. Menjalankan simulasi sukses...');
      await finishGoal(goal, 'Simulated auto-code success');
      return;
    }

    console.log('🧠 Menghubungi Gemini untuk memproses kode...');
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const promptText = `
Anda adalah AI Agent Developer (${goal.assigned_agent}).
Tugas Anda adalah menulis file kode berdasarkan instruksi berikut:
"${goal.prompt}"

Hasilkan file kode lengkap (misalnya komponen UI Next.js, utility, dsb).
Format output Anda harus berupa JSON dengan struktur berikut:
{
  "filePath": "src/components/GunakanNamaFileSesuaiTugas.tsx",
  "code": "isi kode lengkap disini"
}
Catatan: Pastikan output JSON Anda valid dan hanya kembalikan format JSON saja tanpa markdown block backticks (\`\`\`json).
`;

    const result = await model.generateContent(promptText);
    const rawText = result.response.text().trim();
    
    // Parse JSON
    let parsedResult;
    try {
      // Hapus pembungkus markdown ```json jika Gemini membungkusnya secara tidak sengaja
      const cleanJson = rawText.replace(/```json|```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (e) {
      console.error('❌ Gagal mem-parse respon JSON dari Gemini. Raw text:', rawText);
      throw new Error('Respon AI bukan format JSON yang valid');
    }

    const { filePath, code } = parsedResult;
    const absolutePath = path.resolve(__dirname, '../', filePath);

    // Buat folder jika belum ada
    const folderPath = path.dirname(absolutePath);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Tulis file
    fs.writeFileSync(absolutePath, code, 'utf8');
    console.log(`📁 Berhasil menulis file: ${filePath}`);

    // Jalankan perintah Git secara otomatis
    console.log('🐙 Memulai proses git commit & push...');
    const fileBasename = path.basename(filePath);
    execSync(`git add "${absolutePath}"`, { stdio: 'inherit' });
    
    // Commit atas nama Agent yang ditunjuk
    execSync(`git commit -m "feat(${goal.assigned_agent.toLowerCase().replace(' agent', '')}): [x] ${goal.title} (${fileBasename})"`, { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });

    console.log('🚀 Berhasil mem-push kode ke GitHub!');

    // Update status goal di Supabase menjadi Achieved
    await finishGoal(goal, `Mengerjakan tugas: menulis berkas ${filePath}`);

  } catch (error) {
    console.error('❌ Error saat mengeksekusi tugas:', error.message);
    // Kembalikan status goal menjadi 'Failed' jika terjadi kegagalan
    await supabase
      .from('goals')
      .update({ status: 'Failed' })
      .eq('id', goal.id);
  }
}

async function finishGoal(goal, summaryDetails) {
  // Update Goal
  await supabase
    .from('goals')
    .update({ status: 'Achieved' })
    .eq('id', goal.id);
  
  console.log(`✅ Tugas Selesai & Status Diupdate di Supabase: "${goal.title}"`);
}
