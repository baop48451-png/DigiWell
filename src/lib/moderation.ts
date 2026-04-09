/**
 * DigiGuard v3 — Layer 1: Client-Side Moderation Engine
 *
 * Strategy:
 * - RED   (BLOCKED)  → Hard block, content never reaches server
 * - YELLOW (WARNED)  → Allow but log warning locally
 * - CLEAN            → Pass through normally
 *
 * Cost: $0 (no network calls, runs entirely on device)
 */

// ─── Normalizer ───────────────────────────────────────────────────────────────
// Strips leet-speak tricks: d.m → dm   v_l → vl   c`h`ó → cho
function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')          // strip diacritics
    .replace(/[^a-z0-9\s]/g, '')              // strip punctuation / dots used as obfuscators
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── RED keywords (hard-block) ─────────────────────────────────────────────────
// Covers: severe profanity, NSFW, threats, gambling
const RED_PATTERNS: RegExp[] = [
  // Vietnamese severe profanity
  /\b(dit|đit|địt|dich|đm|dm|vl|vcl|vãi|vcl|clm|clmm|clmml|cặc|cac|lon|lồn|lol|buồi|buoi|đĩ|di|diem|diếm)\b/i,
  /\b(đc|đkm|đkm|đ\.k\.m|đ m|d m|đ\.m|d\.m|v l|v\.l|vc\.l)\b/i,

  // Sexual / NSFW
  /\b(sex|nsfw|nude|khiêu dâm|phim người lớn|18\+|xxx|jav|av|onlyfans|nudes?)\b/i,

  // Violence / threats
  /\b(đâm|chém|giết|bắn|thịt mày|giết mày|tao giết|thủ tiêu|tao đốt|ném đá)\b/i,

  // Gambling / scam
  /\b(cá độ|cờ bạc|baccarat|xổ số|lo đề|cược|slot|casino|bet|hack acc|bán acc|mua acc|tài khoản giả|lừa đảo)\b/i,

  // Spam / ads
  /\b(kiếm tiền online|làm giàu nhanh|đầu tư f0|mlm|đa cấp|ref link|aff link)\b/i,

  // Drugs
  /\b(ma túy|heroin|cocaine|cần sa|thuốc lắc|bóng cười|meth|coke)\b/i,
];

// ─── YELLOW keywords (warn-only) ──────────────────────────────────────────────
// Covers: mild profanity, off-topic provocations
const YELLOW_PATTERNS: RegExp[] = [
  /\b(mẹ mày|tao ghét|đồ ngu|thằng ngu|con bò|ngu vl|ngu vcl|mày điên|điên à)\b/i,
  /\b(xấu xí|béo quá|gầy như que|đồ xấu|mặt xấu)\b/i,  // body-shaming
  /\b(chính trị|biểu tình|lật đổ|phản động)\b/i,         // off-topic political
];

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
export type ModerationResult = {
  level: 'clean' | 'warn' | 'blocked';
  reason?: string;
};

export function checkContent(raw: string): ModerationResult {
  if (!raw || !raw.trim()) return { level: 'clean' };

  const normalized = normalizeText(raw);

  for (const pat of RED_PATTERNS) {
    if (pat.test(normalized)) {
      return {
        level: 'blocked',
        reason: 'Nội dung chứa ngôn từ hoặc chủ đề vi phạm tiêu chuẩn cộng đồng DigiWell.',
      };
    }
  }

  for (const pat of YELLOW_PATTERNS) {
    if (pat.test(normalized)) {
      return {
        level: 'warn',
        reason: 'Nội dung có thể gây thô lỗ hoặc không phù hợp với cộng đồng.',
      };
    }
  }

  return { level: 'clean' };
}

// ─── REPORT REASONS ───────────────────────────────────────────────────────────
export const REPORT_REASONS = [
  'Spam hoặc quảng cáo',
  'Ngôn từ thù ghét / Phân biệt',
  'Nội dung 18+ / Khiêu dâm',
  'Bạo lực hoặc đe dọa',
  'Thông tin sai lệch',
  'Lý do khác',
] as const;

export type ReportReason = typeof REPORT_REASONS[number];
