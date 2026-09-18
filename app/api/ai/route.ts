/**
 * app/api/ai/route.ts
 * Next.js Route Handler Proxy ke 9router AI API (model 9router/SuperAdmin).
 * Memproses 5 aksi AI Automation secara aman di sisi server:
 * 1. ocr_ktp: AI Vision OCR foto KTP/KK/BAST
 * 2. copilot: AI Copilot Posko Asisten Q&A SOP & Data
 * 3. audit_insight: AI Executive Summary & Analisis Rekonsiliasi 3-Way
 * 4. wa_personalize: AI Smart WhatsApp Message Personalizer
 * 5. deep_match: AI Deep Fuzzy Matcher Pencocokan Nama Typo Parah
 */

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload, apiKey: clientApiKey, model: clientModel, baseUrl: clientBaseUrl } = body;
    const apiKey =
      clientApiKey ||
      process.env.NINEROUTER_API_KEY ||
      process.env.NEXT_PUBLIC_NINEROUTER_API_KEY ||
      "sk-9router-superadmin-key";

    const rawBaseUrl = clientBaseUrl || process.env.NINEROUTER_BASE_URL || "http://127.0.0.1:20128/v1";
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");
    const rawModel = clientModel || process.env.NINEROUTER_MODEL || "SuperAdmin";
    // Strip prefix '9router/' if passed by mistake
    const model = rawModel.replace(/^9router\//i, "");

    let messages: unknown[] = [];

    if (action === "ocr_ktp") {
      const { imageBase64 } = payload;
      messages = [
        {
          role: "system",
          content: `Anda adalah AI OCR presisi tinggi untuk membaca dokumen KTP, KK, atau BAST Indonesia.
Ekstrak informasi dan kembalikan HANYA format JSON valid tanpa markdown/codeblock format seperti ini:
{
  "nik": "string 16 digit atau kosong",
  "nama": "string nama lengkap",
  "noKK": "string 16 digit atau kosong",
  "alamat": "string alamat",
  "rt": "string angka RT atau kosong",
  "rw": "string angka RW atau kosong"
}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Ekstrak data NIK, Nama, No. KK, Alamat, RT, RW dari gambar berikut:" },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:")
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ];
    } else if (action === "copilot") {
      const { userQuery, contextData, chatHistory } = payload;
      messages = [
        {
          role: "system",
          content: `Anda adalah AI Copilot Posko Bansos PBP Perum BULOG Kota Jakarta Utara — rekan kerja operasional lapangan yang ramah, komunikatif, solutif, empatis, dan sangat berpengalaman di posko.

ATURAN & TUGAS UTAMA:
1. Sampaikan jawaban dalam Bahasa Indonesia yang alami, ramah, dan manusiawi (bukan kaku seperti robot).

2. DETEKSI UNDANGAN NYASAR (Master Data 142k sebagai Acuan Utama):
   - Gunakan data 'daftarUndanganNyasar' dari context (pencocokan 100% BAST PDF vs Master Data 142k).
   - Jelaskan warga mana saja yang surat fisiknya diundang di Posko ini tetapi terdaftar DTKS di Kelurahan/Kecamatan/Daerah lain. Sertakan No. Urut BAST, Nama, NIK, Kelurahan BAST vs Kelurahan Master DTKS.

3. AUDIT KEJANGGALAN SOP EXCEL BULOG & WARGA KURANG FOTO (Khusus PBP Belum Ambil):
   - Gunakan data 'daftarKurangFotoBelumAmbil' untuk menyajikan warga yang BELUM AMBIL BERAS yang status verifikasi/fotonya tertera "Belum diverifikasi" / "Kurang foto", LENGKAP dengan No. Urut BAST-nya agar petugas dapat mencarinya di lembar fisik BAST.
   - Gunakan data 'daftarKejanggalanSOP' untuk mendeteksi potensi TTD Nyasar (di Web diserahkan tapi posko belum salur), NIK Pengganti kosong, atau Pengganti Non-DTKS.

4. WARGA BELUM AMBIL BERAS:
   - Gunakan data 'daftarSisaBelumAmbil' dari context. Selalu tampilkan berurutan sesuai No. Urut BAST (noUrut), NIK, Nama, RT/RW, dan Alamat.

5. TAG AKSI INTERAKTIF:
   - Setiap kali Anda menyebutkan seorang warga PBP spesifik pada daftar, SELALU sertakan tag aksi khusus tepat di samping namanya dengan format:
     [ACTION:VERIFY|NIK_ATAU_NO_URUT|NAMA_PBP|NO_URUT]
     Contoh: "1. No. 1095 - JAENAL ABIDIN (NIK: 3172032211760001) [ACTION:VERIFY|3172032211760001|JAENAL ABIDIN|1095]"

Context Data Posko Aktif:
${JSON.stringify(contextData ?? {}, null, 2)}

Sajikan jawaban dengan format markdown yang rapi, komunikatif, dan sertakan tag [ACTION:VERIFY|...] bila menyebut nama warga.`,
        },
        ...(chatHistory ?? []),
        { role: "user", content: userQuery },
      ];
    } else if (action === "audit_insight") {
      const { statsData, poskoAktif } = payload;
      messages = [
        {
          role: "system",
          content: `Anda adalah AI Auditor Senior Perum BULOG.
Analisislah statistik rekonsiliasi 3-way berikut untuk Posko Kelurahan ${poskoAktif}:
${JSON.stringify(statsData, null, 2)}

Berikan Ringkasan Eksekutif (3-4 poin singkat) dan Rekomendasi Tindakan Konkret Lapangan yang presisi untuk petugas posko/supervisor dalam format markdown.`,
        },
        { role: "user", content: "Buatkan ringkasan eksekutif dan rekomendasi tindakan audit 3-way." },
      ];
    } else if (action === "wa_personalize") {
      const { tone, rtTarget, rwTarget, kelurahan, wargaList } = payload;
      messages = [
        {
          role: "system",
          content: `Anda adalah AI Spesialis Komunikasi Publik Bulog.
Tugas Anda menyusun ulang pesan pengingat WhatsApp ke Ketua RT ${rtTarget}/RW ${rwTarget} Kelurahan ${kelurahan}.
Gunakan tone/gaya bahasa: ${tone} (pilihan: "Santun & Persuasif", "Formal Resmi", "Urgen / H-1 Penutupan Posko").

Daftar Warga Belum Ambil Beras:
${JSON.stringify(wargaList, null, 2)}

Format pesan harus rapi, mudah dibaca di WA, dan menyertakan daftar warga lengkap.`,
        },
        { role: "user", content: "Buatkan pesan WhatsApp terpersonalisasi." },
      ];
    } else if (action === "deep_match") {
      const { targetName, candidateList } = payload;
      messages = [
        {
          role: "system",
          content: `Anda adalah AI Deep Fuzzy Matcher nama Indonesia.
Bandingkan nama target BAST berikut: "${targetName}" dengan daftar kandidat nama Master Data berikut:
${JSON.stringify(candidateList, null, 2)}

Kembalikan HANYA format JSON valid tanpa markdown:
{
  "bestMatchIndex": number atau null,
  "confidenceScore": number (0-100),
  "alasan": "string penjelasan singkat"
}`,
        },
        { role: "user", content: "Cari kandidat nama yang paling cocok." },
      ];
    } else {
      return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
    }

    let apiRes: Response;
    try {
      apiRes = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          stream: false,
        }),
      });
    } catch (fetchErr: unknown) {
      const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      return NextResponse.json(
        {
          error: `Gagal terhubung ke 9router API (${baseUrl}): ${errMsg}. Pastikan aplikasi 9router berjalan di komputer Anda atau ganti Base URL via tombol ⚙️ Pengaturan Key.`,
        },
        { status: 502 }
      );
    }

    const rawText = await apiRes.text();

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: `Gagal memanggil 9router API (${apiRes.status}): ${rawText}` },
        { status: apiRes.status }
      );
    }

    let resultText = "";
    let resData: unknown = null;

    try {
      resData = JSON.parse(rawText);
      const parsedAny = resData as { choices?: { message?: { content?: string } }[] };
      resultText = parsedAny.choices?.[0]?.message?.content ?? "";
    } catch {
      // Fallback: Parse SSE (Server-Sent Events) streaming format data: {...}
      const lines = rawText.split("\n");
      const contentParts: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data:")) {
          const jsonStr = trimmed.slice(5).trim();
          try {
            const parsed = JSON.parse(jsonStr) as {
              choices?: { delta?: { content?: string }; message?: { content?: string } }[];
            };
            const deltaContent =
              parsed.choices?.[0]?.delta?.content ||
              parsed.choices?.[0]?.message?.content ||
              "";
            if (deltaContent) contentParts.push(deltaContent);
          } catch {
            // ignore non-JSON line
          }
        }
      }

      if (contentParts.length > 0) {
        resultText = contentParts.join("");
      } else {
        resultText = rawText;
      }
    }

    return NextResponse.json({ result: resultText, raw: resData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal server API AI.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
