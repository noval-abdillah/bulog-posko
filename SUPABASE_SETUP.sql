-- ====================================================================
-- SKRIP SQL LENGKAP POSKO BULOG JAKARTA UTARA (SUPABASE SQL EDITOR)
-- Salin seluruh teks di bawah ini dan tempelkan ke SQL Editor di Supabase.
-- ====================================================================

-- 1. Hapus tabel lama jika pernah dibuat (opsional/reset)
-- DROP TABLE IF EXISTS chat_posko;

-- 2. Buat Tabel Chat Posko
CREATE TABLE IF NOT EXISTS chat_posko (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  posko TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  nama_petugas TEXT NOT NULL,
  pesan TEXT NOT NULL,
  tipe TEXT DEFAULT 'normal' CHECK (tipe IN ('normal', 'info', 'peringatan'))
);

-- 3. Aktifkan Fitur Realtime Supabase untuk Tabel chat_posko
ALTER PUBLICATION supabase_realtime ADD TABLE chat_posko;

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE chat_posko ENABLE ROW LEVEL SECURITY;

-- 5. Buat Kebijakan Akses (RLS Policy)
-- Mengizinkan pembacaan pesan untuk semua pengguna yang terautentikasi / anonim
CREATE POLICY "Izinkan Baca Chat Posko"
  ON chat_posko
  FOR SELECT
  USING (true);

-- Mengizinkan pengiriman pesan untuk semua pengguna yang terautentikasi / anonim
CREATE POLICY "Izinkan Kirim Chat Posko"
  ON chat_posko
  FOR INSERT
  WITH CHECK (true);

-- ====================================================================
-- SELESAI
-- Setelah menjalankan skrip ini di SQL Editor, tabel real-time chat
-- posko sudah siap digunakan 100%!
-- ====================================================================
