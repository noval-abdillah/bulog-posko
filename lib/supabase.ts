/**
 * lib/supabase.ts
 * Supabase client, mapping kelurahan Jakarta Utara, fungsi auth & chat real-time.
 */

import { createClient } from "@supabase/supabase-js";
import type { ChatPoskoItem, SessionPosko } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iruetylbefvfxowiabxz.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_dPAxXeGxuJpm3hK14W5zTA_gJsXeIMo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface PoskoInfo {
  namaPosko: string;
  kecamatan: string;
  isSuper: boolean;
}

export const EMAIL_POSKO_MAP: Record<string, PoskoInfo> = {
  "kelurahan.rawabadakutara@bulog-jakut.id":    { namaPosko: "Rawa Badak Utara",    kecamatan: "Koja",           isSuper: false },
  "kelurahan.rawabadakselatan@bulog-jakut.id":  { namaPosko: "Rawa Badak Selatan",  kecamatan: "Koja",           isSuper: false },
  "kelurahan.tuguselatan@bulog-jakut.id":       { namaPosko: "Tugu Selatan",        kecamatan: "Koja",           isSuper: false },
  "kelurahan.tugu-utara@bulog-jakut.id":        { namaPosko: "Tugu Utara",          kecamatan: "Koja",           isSuper: false },
  "kelurahan.koja@bulog-jakut.id":              { namaPosko: "Koja",                kecamatan: "Koja",           isSuper: false },
  "kelurahan.lagoa@bulog-jakut.id":             { namaPosko: "Lagoa",               kecamatan: "Koja",           isSuper: false },
  "kelurahan.cilincing@bulog-jakut.id":         { namaPosko: "Cilincing",           kecamatan: "Cilincing",      isSuper: false },
  "kelurahan.kalibaru@bulog-jakut.id":          { namaPosko: "Kalibaru",            kecamatan: "Cilincing",      isSuper: false },
  "kelurahan.marunda@bulog-jakut.id":           { namaPosko: "Marunda",             kecamatan: "Cilincing",      isSuper: false },
  "kelurahan.rorotan@bulog-jakut.id":           { namaPosko: "Rorotan",             kecamatan: "Cilincing",      isSuper: false },
  "kelurahan.semperbarat@bulog-jakut.id":       { namaPosko: "Semper Barat",        kecamatan: "Cilincing",      isSuper: false },
  "kelurahan.sempertimur@bulog-jakut.id":       { namaPosko: "Semper Timur",        kecamatan: "Cilincing",      isSuper: false },
  "kelurahan.sukapura@bulog-jakut.id":          { namaPosko: "Sukapura",            kecamatan: "Cilincing",      isSuper: false },
  "kelurahan.kelapagadingbarat@bulog-jakut.id": { namaPosko: "Kelapa Gading Barat", kecamatan: "Kelapa Gading",  isSuper: false },
  "kelurahan.kelapagadingtimur@bulog-jakut.id": { namaPosko: "Kelapa Gading Timur", kecamatan: "Kelapa Gading",  isSuper: false },
  "kelurahan.pegangsaandua@bulog-jakut.id":     { namaPosko: "Pegangsaan Dua",      kecamatan: "Kelapa Gading",  isSuper: false },
  "kelurahan.ancol@bulog-jakut.id":             { namaPosko: "Ancol",               kecamatan: "Pademangan",     isSuper: false },
  "kelurahan.pademanganbarat@bulog-jakut.id":   { namaPosko: "Pademangan Barat",    kecamatan: "Pademangan",     isSuper: false },
  "kelurahan.pademanganttimur@bulog-jakut.id":  { namaPosko: "Pademangan Timur",    kecamatan: "Pademangan",     isSuper: false },
  "kelurahan.kamalmuara@bulog-jakut.id":        { namaPosko: "Kamal Muara",         kecamatan: "Penjaringan",    isSuper: false },
  "kelurahan.kapukmuara@bulog-jakut.id":        { namaPosko: "Kapuk Muara",         kecamatan: "Penjaringan",    isSuper: false },
  "kelurahan.pejagalan@bulog-jakut.id":         { namaPosko: "Pejagalan",           kecamatan: "Penjaringan",    isSuper: false },
  "kelurahan.penjaringan@bulog-jakut.id":       { namaPosko: "Penjaringan",         kecamatan: "Penjaringan",    isSuper: false },
  "kelurahan.pluit@bulog-jakut.id":             { namaPosko: "Pluit",               kecamatan: "Penjaringan",    isSuper: false },
  "kelurahan.kebonbawang@bulog-jakut.id":       { namaPosko: "Kebon Bawang",        kecamatan: "Tanjung Priok",  isSuper: false },
  "kelurahan.papanggo@bulog-jakut.id":          { namaPosko: "Papanggo",            kecamatan: "Tanjung Priok",  isSuper: false },
  "kelurahan.sungaibambu@bulog-jakut.id":       { namaPosko: "Sungai Bambu",        kecamatan: "Tanjung Priok",  isSuper: false },
  "kelurahan.sunteragung@bulog-jakut.id":       { namaPosko: "Sunter Agung",        kecamatan: "Tanjung Priok",  isSuper: false },
  "kelurahan.sunterjaya@bulog-jakut.id":        { namaPosko: "Sunter Jaya",         kecamatan: "Tanjung Priok",  isSuper: false },
  "kelurahan.tanjungpriok@bulog-jakut.id":      { namaPosko: "Tanjung Priok",       kecamatan: "Tanjung Priok",  isSuper: false },
  "kelurahan.warakas@bulog-jakut.id":           { namaPosko: "Warakas",             kecamatan: "Tanjung Priok",  isSuper: false },
  "supervisor@bulog-jakut.id":                  { namaPosko: "Supervisor Pusat",    kecamatan: "Jakarta Utara",  isSuper: true  },
};

export const KECAMATAN_LIST = [
  "Koja",
  "Cilincing",
  "Kelapa Gading",
  "Pademangan",
  "Penjaringan",
  "Tanjung Priok",
];

export const POSKO_WARNA_MAP: Record<string, string> = {
  "Koja":          "bg-blue-500",
  "Cilincing":     "bg-emerald-500",
  "Kelapa Gading": "bg-violet-500",
  "Pademangan":    "bg-amber-500",
  "Penjaringan":   "bg-rose-500",
  "Tanjung Priok": "bg-cyan-500",
  "Jakarta Utara": "bg-slate-700",
};

export function getPoskoInfo(email: string, userMetadata?: Record<string, unknown>): PoskoInfo | null {
  if (userMetadata?.namaPosko) {
    return {
      namaPosko: String(userMetadata.namaPosko),
      kecamatan: String(userMetadata.kecamatan || "Jakarta Utara"),
      isSuper: Boolean(userMetadata.isSuper),
    };
  }

  if (!email) return null;
  const rawEmail = email.toLowerCase().trim();

  // 1. Direct match
  if (EMAIL_POSKO_MAP[rawEmail]) {
    return EMAIL_POSKO_MAP[rawEmail];
  }

  const cleanEmail = rawEmail.replace(/[^a-z0-9]/g, "");

  // 2. Check for supervisor/admin
  if (cleanEmail.includes("supervisor") || cleanEmail.includes("admin")) {
    return EMAIL_POSKO_MAP["supervisor@bulog-jakut.id"];
  }

  // 3. Match against clean posko names (sorted by longest name first)
  const entries = Object.values(EMAIL_POSKO_MAP).sort(
    (a, b) => b.namaPosko.length - a.namaPosko.length
  );

  for (const info of entries) {
    const cleanPoskoName = info.namaPosko.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanPoskoName && cleanEmail.includes(cleanPoskoName)) {
      return info;
    }
  }

  // 4. Fallback check keys in EMAIL_POSKO_MAP
  for (const [key, info] of Object.entries(EMAIL_POSKO_MAP)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "").replace("kelurahan", "").replace("bulogjakutid", "");
    if (cleanKey && cleanEmail.includes(cleanKey)) {
      return info;
    }
  }

  return null;
}

export async function loginPosko(email: string, password: string): Promise<{ session: SessionPosko | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { session: null, error: error?.message ?? "Login gagal" };
  }
  const info = getPoskoInfo(data.user.email ?? "", data.user.user_metadata as Record<string, unknown> | undefined);
  if (!info) {
    await supabase.auth.signOut();
    return { session: null, error: "Akun tidak terdaftar di sistem. Hubungi supervisor." };
  }
  return {
    session: {
      email: data.user.email ?? "",
      namaPosko: info.namaPosko,
      kecamatan: info.kecamatan,
      isSuper: info.isSuper,
      isLoggedIn: true,
    },
    error: null,
  };
}

export async function logoutPosko(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSessionPosko(): Promise<SessionPosko | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  const info = getPoskoInfo(data.session.user.email ?? "", data.session.user.user_metadata as Record<string, unknown> | undefined);
  if (!info) return null;
  return {
    email: data.session.user.email ?? "",
    namaPosko: info.namaPosko,
    kecamatan: info.kecamatan,
    isSuper: info.isSuper,
    isLoggedIn: true,
  };
}

export async function kirimPesanChat(
  posko: string,
  kecamatan: string,
  namaPetugas: string,
  pesan: string,
  tipe: ChatPoskoItem["tipe"] = "normal"
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("chat_posko").insert([
    { posko, kecamatan, nama_petugas: namaPetugas, pesan, tipe },
  ]);
  return { error: error?.message ?? null };
}

export async function ambilRiwayatChat(limit = 100): Promise<ChatPoskoItem[]> {
  const { data, error } = await supabase
    .from("chat_posko")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return data as ChatPoskoItem[];
}

export function subscribeChat(onNewMessage: (msg: ChatPoskoItem) => void) {
  return supabase
    .channel("chat_posko_realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_posko" },
      (payload) => {
        onNewMessage(payload.new as ChatPoskoItem);
      }
    )
    .subscribe();
}
