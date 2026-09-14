/**
 * lib/ai.ts
 * Client library helper untuk memanggil Next.js API Route AI 9router.
 */

export interface OcrKtpResult {
  nik: string;
  nama: string;
  noKK: string;
  alamat: string;
  rt: string;
  rw: string;
}

export interface DeepMatchResult {
  bestMatchIndex: number | null;
  confidenceScore: number;
  alasan: string;
}

async function callAI(action: string, payload: unknown, apiKey?: string, model?: string): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload, apiKey, model }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || "Gagal memproses AI automation.");
  }

  return data.result as string;
}

function extractJsonFromText(text: string): string {
  let clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }
  return clean;
}

export async function aiScanOcrKtp(imageBase64: string, apiKey?: string, model?: string): Promise<OcrKtpResult> {
  const text = await callAI("ocr_ktp", { imageBase64 }, apiKey, model);
  const cleanJsonText = extractJsonFromText(text);
  return JSON.parse(cleanJsonText) as OcrKtpResult;
}

export async function aiCopilotQuery(
  userQuery: string,
  contextData: unknown,
  chatHistory: { role: "user" | "assistant"; content: string }[] = [],
  apiKey?: string,
  model?: string
): Promise<string> {
  return callAI("copilot", { userQuery, contextData, chatHistory }, apiKey, model);
}

export async function aiGenerateAuditInsight(
  statsData: unknown,
  poskoAktif: string,
  apiKey?: string,
  model?: string
): Promise<string> {
  return callAI("audit_insight", { statsData, poskoAktif }, apiKey, model);
}

export async function aiPersonalizeWaMsg(
  tone: string,
  rtTarget: string,
  rwTarget: string,
  kelurahan: string,
  wargaList: unknown[],
  apiKey?: string,
  model?: string
): Promise<string> {
  return callAI("wa_personalize", { tone, rtTarget, rwTarget, kelurahan, wargaList }, apiKey, model);
}

export async function aiDeepMatchName(
  targetName: string,
  candidateList: unknown[],
  apiKey?: string,
  model?: string
): Promise<DeepMatchResult> {
  const text = await callAI("deep_match", { targetName, candidateList }, apiKey, model);
  const cleanJsonText = extractJsonFromText(text);
  return JSON.parse(cleanJsonText) as DeepMatchResult;
}
