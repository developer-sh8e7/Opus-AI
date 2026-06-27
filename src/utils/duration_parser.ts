import { Logger } from './logger.js';

const WORD_TO_NUM: Record<string, number> = {
  واحد: 1, اثنين: 2, اثنان: 2, ثلاثة: 3, أربعة: 4, اربعة: 4,
  خمسة: 5, ستة: 6, سبعة: 7, ثمانية: 8, تسعة: 9, عشرة: 10,
};

const DURATION_MULTIPLIERS: Array<{ pattern: RegExp; ms: number }> = [
  { pattern: /(أسبوع|اسبوع|أسابيع|اسابيع|week|weeks)/i, ms: 604_800_000 },
  { pattern: /(يوم|ايام|أيام|day|days)/i, ms: 86_400_000 },
  { pattern: /(ساعة|ساعه|ساعات|ساعتين|hour|hr|hours)/i, ms: 3_600_000 },
  { pattern: /(دقيقة|دقيقه|دقايق|دقائق|minute|min|minutes)/i, ms: 60_000 },
  { pattern: /(ثانية|ثانيه|ثواني|second|sec|seconds)/i, ms: 1_000 },
];

const SPECIAL_PHRASES: Array<{ pattern: RegExp; ms: number }> = [
  { pattern: /(?:نص\s*ساعة|نصف\s*ساعة|half\s*hour)/i, ms: 1_800_000 },
  { pattern: /(?:ربع\s*ساعة|quarter\s*hour)/i, ms: 900_000 },
];

const HARD_CAP_MS = 2_419_200_000;

export function parseDurationMs(text: string): number | null {
  const normalized = text.normalize('NFKC').trim();
  
  for (const special of SPECIAL_PHRASES) {
    if (special.pattern.test(normalized)) return special.ms;
  }
  
  // Word-based number
  const wordMatch = normalized.match(new RegExp(
    '(' + Object.keys(WORD_TO_NUM).join('|') + ')\\s*(أسبوع|اسبوع|أسابيع|اسابيع|يوم|ايام|أيام|ساعة|ساعه|ساعات|ساعتين|دقيقة|دقيقه|دقايق|دقائق|ثانية|ثانيه|ثواني|week|weeks|day|days|hour|hours|hr|minute|minutes|min|second|seconds|sec)',
    'i'
  ));
  if (wordMatch) {
    const count = WORD_TO_NUM[wordMatch[1].toLowerCase()] ?? 1;
    for (const mult of DURATION_MULTIPLIERS) {
      if (mult.pattern.test(wordMatch[2])) {
        return Math.min(count * mult.ms, HARD_CAP_MS);
      }
    }
  }
  
  // Digit-based number
  const digitMatch = normalized.match(/(\d{1,3})\s*(أسبوع|اسبوع|أسابيع|اسابيع|يوم|ايام|أيام|ساعة|ساعه|ساعات|ساعتين|دقيقة|دقيقه|دقايق|دقائق|ثانية|ثانيه|ثواني|week|weeks|day|days|hour|hours|hr|minute|minutes|min|second|seconds|sec)/i);
  if (digitMatch) {
    const count = parseInt(digitMatch[1], 10);
    for (const mult of DURATION_MULTIPLIERS) {
      if (mult.pattern.test(digitMatch[2])) {
        return Math.min(count * mult.ms, HARD_CAP_MS);
      }
    }
  }
  
  return null;
}

export function getHardCapMs(): number {
  return HARD_CAP_MS;
}
