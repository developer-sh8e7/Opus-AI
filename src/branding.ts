export const PRODUCT_NAME = 'HumanGuard AI';
export const PRODUCT_POSITIONING = 'Permission-safe Discord AI Manager';
export const DEFAULT_COMMAND_PREFIX = '!humanguard';
export const SHORT_COMMAND_PREFIX = '!hg';
export const LEGACY_COMMAND_PREFIX = '!humanguard';

export const COMMAND_PREFIXES = [
  DEFAULT_COMMAND_PREFIX,
  SHORT_COMMAND_PREFIX,
  LEGACY_COMMAND_PREFIX,
] as const;

export function stripKnownCommandPrefix(input: string): { matched: boolean; content: string; prefix?: string } {
  const trimmed = input.trim();
  const prefix = [...COMMAND_PREFIXES]
    .sort((a, b) => b.length - a.length)
    .find((candidate) => trimmed.toLowerCase().startsWith(candidate));

  if (!prefix) return { matched: false, content: trimmed };
  return { matched: true, prefix, content: trimmed.slice(prefix.length).trim() };
}

export function containsProductName(input: string): boolean {
  const normalized = input.toLowerCase();
  return normalized.includes('humanguard') ||
    normalized.includes('human guard') ||
    normalized.includes('human-guard') ||
    normalized.includes('حارس البشر') ||
    normalized.includes('opus'); // legacy mention support only
}
