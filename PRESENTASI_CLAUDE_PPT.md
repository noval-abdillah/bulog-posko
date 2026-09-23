# Instruksi untuk Claude

Ubah dokumen Markdown ini menjadi presentasi PowerPoint profesional untuk stakeholder Perum BULOG. Gunakan gaya korporat: navy blue, putih, aksen biru muda, dan oranye secukupnya. Buat slide ringkas, visual, dan siap dipresentasikan kepada pimpinan operasional.

Format output yang diinginkan:

- 14 slide.
- Setiap slide berisi judul, bullet utama, saran visual, dan speaker notes singkat.
- Bahasa Indonesia formal-operasional.
- Jangan gunakan emoji.
- Prioritaskan nilai bisnis, alur kerja lapangan, AI automation, audit, dan dampak operasional.

---

# Deck: Sistem Posko Verifikasi, Audit, AI, dan Rekonsiliasi Bansos PBP BULOG

## Slide 1 - Judul

**Sistem Posko Verifikasi, Audit, AI, dan Rekonsiliasi Bansos PBP BULOG**

Subtitle:

ERP operasional lapangan untuk percepatan pelayanan, audit BAST, rekonsiliasi Web Bulog, dan otomasi AI di posko kelurahan.

Detail:

- Wilayah: Jakarta Utara.
- Cakupan: 31 kelurahan, 6 kecamatan.
- Alokasi: PBP 30 kg per keluarga.

Visual suggestion:

- Hero dashboard mockup.
- Peta Jakarta Utara sederhana.
- Ikon alur data posko.

Speaker notes:

Presentasi ini menjelaskan sistem posko yang dirancang untuk membantu petugas melakukan verifikasi warga, audit fisik, rekonsiliasi data, dan koordinasi lapangan dalam satu aplikasi.

---

## Slide 2 - Masalah Lapangan

Masalah utama yang sering terjadi:

- Verifikasi warga lambat saat antrean posko ramai.
- NIK dan No. KK sering rusak karena format Excel.
- Risiko pengambilan ganda dalam 1 Kartu Keluarga.
- Tanda tangan atau BAST fisik bisa salah baris.
- Data Web Bulog berbeda dengan kondisi fisik lapangan.
- Warga belum ambil sulit dipantau per RT/RW.
- Koordinasi antarposko tidak terpusat.

Visual suggestion:

- Diagram pain point: Meja Posko, BAST, Web Bulog, RT/RW, Supervisor.

Speaker notes:

Sistem dibangun untuk menjawab masalah operasional nyata: validasi, audit, komunikasi, dan pelaporan sering masih tersebar di file, chat, dan kertas.

---

## Slide 3 - Solusi Produk

Solusi yang diberikan sistem:

- Meja Posko untuk verifikasi instan.
- Dashboard untuk monitoring status posko.
- Audit Ekspor untuk rekonsiliasi 3-way.
- AI Copilot untuk pencarian, audit, dan rekomendasi cepat.
- WhatsApp reminder untuk RT/RW.
- SPTJM dan laporan Excel siap ekspor.
- Chat realtime antarposko.

Visual suggestion:

- Hub-and-spoke diagram dengan `bulog-posko` di tengah dan modul di sekelilingnya.

Speaker notes:

Semua kebutuhan operasional posko digabungkan dalam satu workflow sehingga petugas tidak perlu berpindah-pindah alat.

---

## Slide 4 - Modul Utama Sistem

Modul aplikasi:

- Dashboard.
- Meja Posko.
- Audit Ekspor.
- AI Copilot dan AI OCR.
- Chat Posko.
- Pengganti Tertolak.
- Data Bermasalah.
- Panduan Penggunaan.

Visual suggestion:

- Grid 8 kartu modul.

Speaker notes:

Setiap modul memiliki fungsi spesifik, tetapi seluruhnya saling terhubung melalui store data dan alur audit.

---

## Slide 5 - Alur Data Operasional

Sumber data utama:

- Master Data 142k.
- BAST PDF/Excel.
- File 1 Web Bulog: Sudah Diserahkan.
- File 2 Web Bulog: Belum Diserahkan.
- Log Posko.
- Penanda Fisik BAST.

Output:

- Hasil verifikasi warga.
- Kategori selisih 3-way.
- Dashboard rekap.
- Excel audit.
- WA RT/RW.
- SPTJM.

Visual suggestion:

- Flowchart kiri ke kanan: Input data > Sanitasi > Matching > Audit > Output.

Speaker notes:

Sistem tidak hanya membaca file, tetapi membangun hubungan antara dokumen fisik, sistem Web Bulog, dan realisasi pelayanan.

---

## Slide 6 - Meja Posko: Verifikasi Cepat

Fitur Meja Posko:

- Upload Master Data dan BAST.
- Pencarian barcode, NIK, No. KK, No. Urut, nama.
- Validasi status warga.
- Proteksi 1 KK maksimal 1 alokasi.
- Panel keluarga satu KK.
- Deteksi anomali wilayah.

Visual suggestion:

- Screenshot area search bar dan hasil verifikasi.

Speaker notes:

Meja Posko adalah fitur utama untuk pelayanan warga. Petugas cukup scan atau ketik, lalu sistem menampilkan hasil verifikasi.

---

## Slide 7 - AI OCR KTP/KK/BAST

Kemampuan AI OCR:

- Membaca NIK, nama, No. KK, alamat, RT, RW.
- Koreksi karakter OCR umum.
- Validasi NIK 16 digit.
- Pencarian otomatis ke Meja Posko bila NIK valid.

Contoh koreksi:

- `O/D` menjadi `0`.
- `I/l` menjadi `1`.
- `B` menjadi `8`.
- `S` menjadi `5`.
- `Z` menjadi `2`.

Visual suggestion:

- Foto KTP/BAST > OCR > hasil NIK > tombol verifikasi.

Speaker notes:

AI OCR mempercepat input data dari dokumen fisik, tetapi tetap harus diverifikasi petugas jika gambar tidak jelas.

---

## Slide 8 - AI Copilot Posko

Kemampuan AI Copilot:

- Menjawab pertanyaan SOP.
- Menampilkan sisa PBP belum ambil.
- Mencari undangan nyasar.
- Mendeteksi kurang foto atau belum diverifikasi.
- Audit kejanggalan SOP.
- Menampilkan tombol “Buka di Meja Posko”.

Teknis:

- Endpoint via `/api/ai`.
- 9router tunnel default.
- Model `SuperAdmin`.
- Pengguna tidak perlu setting key.

Visual suggestion:

- Chat bubble AI dengan tombol hijau “Buka di Meja Posko”.

Speaker notes:

AI Copilot bukan hanya chatbot, tetapi asisten data yang dapat mengarahkan petugas langsung ke data warga yang disebutkan.

---

## Slide 9 - Audit Ekspor dan Rekonsiliasi 3-Way

Data yang dibandingkan:

- Master Data 142k.
- BAST fisik/log posko.
- Ekspor Web Bulog.

Kategori hasil:

- Tunggu Input Web.
- Belum Diambil.
- Human Error BAST.
- Potensi TTD Nyasar.
- Match Lengkap.

Visual suggestion:

- Venn diagram 3 sumber data.

Speaker notes:

Audit 3-way memberikan gambaran jelas apakah kondisi fisik lapangan, master data, dan Web Bulog sudah selaras.

---

## Slide 10 - Penanda Fisik BAST dan Dashboard

Status penanda:

- Terverifikasi Fisik.
- Perlu Ditinjau.
- Ketidaksesuaian.

Manfaat:

- Progres cek BAST fisik terlihat di Dashboard.
- Supervisor tahu jumlah dokumen yang sudah dicek.
- Baris bermasalah bisa diprioritaskan.

Visual suggestion:

- Audit table dengan tombol status dan dashboard KPI “Terverifikasi Fisik BAST”.

Speaker notes:

Fitur ini menghubungkan aktivitas audit fisik dengan monitoring dashboard agar progres lapangan lebih transparan.

---

## Slide 11 - WhatsApp RT/RW dan SPTJM

WhatsApp Reminder:

- Daftar warga belum ambil per RT/RW.
- Rekap semua RT/RW.
- AI Personalize tone formal, santun, atau urgen.

SPTJM:

- Form pengganti siap cetak.
- Checklist dokumen.
- PDF resmi terisi.

Visual suggestion:

- Modal WA dan dokumen SPTJM berdampingan.

Speaker notes:

Sistem membantu komunikasi lapangan dan administrasi dokumen tanpa mengetik ulang dari awal.

---

## Slide 12 - Chat Koordinasi Antarposko

Fitur chat:

- Realtime multi-device.
- Filter kecamatan.
- Tipe pesan normal, peringatan, informasi.
- Badge unread.
- Toast notifikasi.

Visual suggestion:

- Chat interface antarposko dengan badge unread.

Speaker notes:

Chat membuat koordinasi lintas kelurahan lebih terpusat, terutama untuk instruksi supervisor dan informasi lapangan cepat.

---

## Slide 13 - Dampak Operasional

Dampak utama:

- Verifikasi warga lebih cepat.
- Risiko salah salur menurun.
- Pengambilan ganda 1 KK dapat dicegah.
- Audit selisih lebih mudah dilacak.
- RT/RW lebih cepat menerima daftar warga belum ambil.
- Supervisor memiliki visibilitas kondisi posko.
- AI mengurangi pekerjaan pencarian manual.

Visual suggestion:

- Before vs After table.

Speaker notes:

Nilai sistem ada pada pengurangan beban manual dan peningkatan akurasi operasional, bukan hanya digitalisasi file.

---

## Slide 14 - Roadmap dan Penutup

Roadmap:

- Integrasi API resmi Banpang bila endpoint tersedia.
- Penyimpanan cloud untuk penanda fisik BAST.
- Dashboard supervisor lintas kelurahan yang lebih lengkap.
- Paket laporan final per kelurahan.
- Dataset evaluasi OCR lapangan.

Penutup:

`bulog-posko` menyatukan pelayanan, audit, AI, komunikasi, dan pelaporan dalam satu sistem operasional untuk memperkuat penyaluran PBP BULOG.

Visual suggestion:

- Timeline roadmap 5 tahap.

Speaker notes:

Sistem saat ini sudah siap mendukung operasional manual berbasis file, dengan ruang pengembangan menuju integrasi API resmi ke depan.
