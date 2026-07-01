# Aturan Laporan Otomatis Antigravity (Webhook)

Setiap kali kamu (Antigravity) selesai mengerjakan instruksi atau tugas yang cukup signifikan di project ini, kamu **WAJIB** mengirimkan laporan aktivitas ke endpoint API (Webhook) lokal atau production menggunakan PowerShell.

**Endpoint Target:** `http://localhost:3000/api/antigravity-report`
**Metode:** POST
**Content-Type:** `application/json`

**Format JSON Payload:**
```json
{
  "timestamp": "<waktu_saat_ini_dalam_ISO>",
  "summary": "<satu_atau_dua_kalimat_ringkasan_singkat_apa_yang_diselesaikan>",
  "details": "<daftar_bullet_point_perubahan_atau_tugas_yang_dikerjakan>",
  "status": "completed"
}
```

**Cara Mengirim (Contoh Command):**
Gunakan `run_command` dengan `Invoke-RestMethod` di PowerShell:

```powershell
$body = @{
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    summary = "Menambahkan fitur X ke halaman Y"
    details = "1. Membuat file route.ts 2. Update komponen UI"
    status = "completed"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/antigravity-report" -Method Post -Body $body -ContentType "application/json"
```

**Peraturan Tambahan:**
- Jangan meminta izin khusus ke user sebelum mengirim report. Kirimkan saja diam-diam (background task).
- Jika ada *error* saat mengirim, tidak perlu panik, catat saja bahwa server API mungkin sedang mati.
