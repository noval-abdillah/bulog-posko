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
    const { action, payload, apiKey: clientApiKey } = body;
    const apiKey =
      clientApiKey ||
      process.env.NINEROUTER_API_KEY ||
      process.env.NEXT_PUBLIC_NINEROUTER_API_KEY ||
      "";

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "API Key 9router belum dikonfigurasi. Harap isi API Key pada form atau atur NINEROUTER_API_KEY.",
        },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NINEROUTER_BASE_URL || "https://api.9router.com/v1";
    const model = process.env.NINEROUTER_MODEL || "9router/SuperAdmin";

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
          content: `Anda adalah AI Copilot Posko Bansos PBP Perum BULOG Kota Jakarta Utara.
Anda membantu petugas posko di lapangan memahami SOP Penyaluran Beras 30 Kg per KPM, aturan 1 KK max 30 Kg, ketentuan SPTJM Pengganti, dan analisis data posko yang sedang aktif.

Context Posko Aktif:
${JSON.stringify(contextData ?? {}, null, 2)}

Sampaikan jawaban dengan jelas, singkat, profesional, dan ramah menggunakan format markdown yang rapi.`,
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

    const apiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return NextResponse.json(
        { error: `Gagal memanggil 9router API (${apiRes.status}): ${errText}` },
        { status: apiRes.status }
      );
    }

    const resData = await apiRes.json();
    const resultText = resData.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ result: resultText, raw: resData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal server API AI.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
