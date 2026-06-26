import { config } from '../config.js';
import { PRODUCT_NAME } from '../branding.js';
import { Logger } from '../utils/logger.js';
import { RequestDeduplication } from '../utils/requestDedup.js';
import { SYSTEM_PROMPT, TOOL_DESCRIPTIONS, TOOL_GROUPS, tools, type FunctionTool } from './aiCatalog.js';
import { currentMessageAllowsTools, getCurrentUserText } from './toolIntent.js';
import { providerRateLimiter } from '../utils/providerRateLimit.js';
export { currentMessageAllowsTools } from './toolIntent.js';
export { SYSTEM_PROMPT, tools } from './aiCatalog.js';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export type AIIntent = 'fast' | 'smart';

export interface GenerateAIOptions {
  intent?: AIIntent;
  systemPrompt?: string;
  toolsEnabled?: boolean;
  temperature?: number;
  maxTokens?: number;
}

interface ChatCompletionBody {
  model: string;
  messages: AIMessage[];
  tools?: FunctionTool[];
  tool_choice?: 'auto';
  temperature: number;
  max_completion_tokens: number;
  reasoning_effort?: 'none';
}

interface ProviderMessage {
  role: 'assistant';
  content: string | null;
  tool_calls?: AIMessage['tool_calls'];
}

function compactRuntimePrompt(runtimePrompt?: string): string {
  if (!runtimePrompt || runtimePrompt.trim().length < 20) return '';
  const MAX_RUNTIME_CHARS = 2_500; // hard cap: prevents skill/knowledge/context overload
  const cleaned = runtimePrompt
    .replace(/\[EXECUTABLE_SKILLS\][\s\S]*?(?=\n\[[A-Z_]+\]|$)/g, '[EXECUTABLE_SKILLS]\nmanifest summarized locally')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned.length > MAX_RUNTIME_CHARS
    ? cleaned.slice(0, MAX_RUNTIME_CHARS) + '\n<!-- runtime context truncated -->'
    : cleaned;
}

function composeSystemPrompt(runtimePrompt?: string): string {
  // SYSTEM_PROMPT already contains personality, reasoning loop, permission rules,
  // session entities, moderation, and safety — no duplicate prompt injection.
  const runtime = compactRuntimePrompt(runtimePrompt);
  if (!runtime) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n\n[RUNTIME_CONTEXT]\n${runtime}`;
}

// ─── Token estimation ──
function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for mixed Arabic/English
  return Math.ceil(text.length / 4);
}

function estimateBodyTokens(body: ChatCompletionBody): number {
  let total = 0;
  for (const msg of body.messages) {
    if (typeof msg.content === 'string') total += estimateTokens(msg.content);
    if (msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        total += estimateTokens(tc.function.name + tc.function.arguments);
      }
    }
  }
  // Tools schema overhead (rough)
  if (body.tools) {
    total += JSON.stringify(body.tools).length / 3;
  }
  // Max completion tokens
  total += body.max_completion_tokens;
  return Math.round(total);
}

// ─── Groq (sole AI provider) ──
let groqAuthInvalid = false;

export async function callGroq(
  messages: AIMessage[],
  options: GenerateAIOptions = {}
): Promise<ProviderMessage> {
  const apiKey = config.groqApiKey;
  const endpoint = config.groqApiBaseUrl;
  const model = config.groqModel;

  if (!apiKey) {
    throw new AIProviderError('groq', 'No GROQ_API_KEY configured', false, 401);
  }
  if (groqAuthInvalid) {
    throw new AIProviderError('groq', 'GROQ_API_KEY was rejected earlier in this process', false, 401);
  }

  return retryProvider('groq', (attempt) => {
    const body = buildCompletionBody(messages, {
      ...options,
      temperature: Math.max(0.35, (options.temperature ?? 0.7) - (attempt * 0.1)),
    }, model);

    // Estimate & log token usage
    const estimatedTokens = estimateBodyTokens(body);
    const toolCount = body.tools?.length ?? 0;
    const msgCount = body.messages.length;
    const sysLen = body.messages[0]?.content?.length ?? 0;
    Logger.info('AI', `Req: est=${estimatedTokens}t sys=${Math.round(sysLen/4)}t msgs=${msgCount} tools=${toolCount} out=${body.max_completion_tokens}`);

    const limitCheck = providerRateLimiter.check('groq', estimatedTokens, model);
    if (!limitCheck.allowed) {
      Logger.warn('AI', `Groq rate limit (${limitCheck.reason}): retry after ${Math.round((limitCheck.retryAfterMs ?? 0) / 1000)}s (est. ${estimatedTokens} tokens, usage: ${limitCheck.currentUsage?.tpm ?? '?'}/${limitCheck.currentUsage?.tpmLimit ?? '?'})`);
      throw new AIProviderError(
        'groq',
        `Groq rate limited on ${limitCheck.reason}: retry after ${Math.round((limitCheck.retryAfterMs ?? 0) / 1000)}s`,
        true,
        429,
        limitCheck.retryAfterMs
      );
    }

    return postChatCompletion('groq', endpoint, apiKey, body, estimatedTokens);
  });
}

export class AIPromptBuilder {
  static buildDynamicSystemPrompt(guildName: string, memberCount: number, botVolume: number): string {
    return [
      SYSTEM_PROMPT,
      '[LIVE_STATE]',
      `guild_name=${guildName}`,
      `member_count=${memberCount}`,
      `music_volume=${botVolume}`,
    ].join('\n');
  }

  static sanitizeMessages(messages: AIMessage[]): AIMessage[] {
    return messages
      .filter((message) => message.role !== 'system')
      .map((message) => {
        const sanitized: AIMessage = {
          role: message.role,
          content: message.content,
        };
        if (message.tool_call_id) sanitized.tool_call_id = message.tool_call_id;
        if (message.tool_calls) {
          sanitized.tool_calls = message.tool_calls.map((toolCall) => {
            let args = toolCall.function.arguments;
            try {
              JSON.parse(args);
            } catch {
              args = '{}';
            }
            return {
              id: toolCall.id,
              type: 'function',
              function: {
                name: toolCall.function.name,
                arguments: args,
              },
            };
          });
        }
        return sanitized;
      });
  }
}

export class ToolCallValidator {
  static validateAndFixArgs(
    toolName: string,
    args: Record<string, unknown>
  ): { valid: boolean; fixedArgs: Record<string, unknown>; reason?: string } {
    const fixedArgs = { ...args };

    if (toolName === 'set_volume') {
      const volume = Number(fixedArgs.volume);
      if (!Number.isFinite(volume)) {
        return { valid: false, fixedArgs, reason: 'قيمة الصوت غير صالحة.' };
      }
      fixedArgs.volume = Math.max(0, Math.min(200, volume));
    }

    if (toolName === 'bulk_delete_messages') {
      const count = Number(fixedArgs.count);
      if (!Number.isInteger(count) || count < 1) {
        return { valid: false, fixedArgs, reason: 'عدد الرسائل غير صالح.' };
      }
      fixedArgs.count = Math.min(100, count);
    }

    if (toolName === 'create_channels') {
      const names = fixedArgs.names;
      if (!Array.isArray(names) || names.length === 0 || names.some((name) => typeof name !== 'string')) {
        return { valid: false, fixedArgs, reason: 'يجب تحديد اسم قناة واحد على الأقل.' };
      }
    }

    return { valid: true, fixedArgs };
  }
}

export class AIResponseParser {
  static formatResponseCard(text: string): string {
    if (!text) return '';
    return text
      .trim()
      // Hide internal tool names from user-facing replies
      .replace(/\bplay_music\b/g, 'مشغل الموسيقى')
      .replace(/\bbuild_custom_server\b/g, 'منظّم السيرفر')
      .replace(/\bexecute_community_build\b/g, 'باني السيرفر')
      .replace(/\bcreate_channels\b/g, 'إنشاء الرومات')
      .replace(/\bmanage_roles\b/g, 'إدارة الرتب')
      .replace(/\bedit_permissions\b/g, 'تعديل الصلاحيات')
      .replace(/\bget_server_info\b/g, 'معلومات السيرفر')
      // Remove robotic assistant disclaimers that sometimes leak from LLMs
      .replace(/\bI am (an? )?(AI|language model|assistant)[^.\n]*\.?/gi, '')
      .replace(/\bAs an? (AI|language model)[^.\n]*\.?/gi, '')
      .replace(/أنا (?:نموذج لغة|مساعد ذكاء اصطناعي)[^\n.]*[.؟]?/g, '')
      .replace(/\s{3,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

export const AI_TEMPORARY_ERROR_MESSAGE = 'AI provider is temporarily unavailable. Try again shortly.';
export const AI_CONFIGURATION_ERROR_MESSAGE = 'Invalid or missing GROQ_API_KEY. Update your local .env file.';
export const AI_PROVIDER_STATE_MESSAGE = 'All AI providers are currently unavailable.';
export const AI_RATE_LIMIT_MESSAGE = 'AI request limit reached. Try again after {seconds} seconds.';
export const AI_TIMEOUT_MESSAGE = 'AI response timed out. Try a smaller request.';

// Request deduplication for identical AI requests
const aiRequestDedup = new RequestDeduplication<ProviderMessage>(5000, 10000);
aiRequestDedup.startCleanup();
export const EXTENDED_CONVERSATIONAL_SCENARIOS_DATABASE: readonly never[] = [];

// ─── Circuit Breaker ────────────────────────────
interface CircuitState {
  consecutiveFailures: number;
  lastFailureAt: number;
  cooldownMs: number;
}

const circuitBreakers = new Map<string, CircuitState>();

function isCircuitOpen(name: string): boolean {
  const state = circuitBreakers.get(name);
  if (!state) return false;
  if (state.consecutiveFailures < 3) return false;
  const elapsed = Date.now() - state.lastFailureAt;
  return elapsed < state.cooldownMs;
}

function recordFailure(name: string, cooldownMs = 90_000): void {
  const prev = circuitBreakers.get(name);
  circuitBreakers.set(name, {
    consecutiveFailures: (prev?.consecutiveFailures ?? 0) + 1,
    lastFailureAt: Date.now(),
    cooldownMs,
  });
}

function recordSuccess(name: string): void {
  circuitBreakers.delete(name);
}

// ─── Admin Alerting ────────────────────────────
let lastAllDownAlert = 0;
const ALL_DOWN_ALERT_COOLDOWN_MS = 300_000;

async function sendAdminAlert(subject: string, body: string): Promise<void> {
  const now = Date.now();
  if (now - lastAllDownAlert < ALL_DOWN_ALERT_COOLDOWN_MS) return;
  lastAllDownAlert = now;

  const webhookUrl = process.env.ADMIN_ALERT_WEBHOOK_URL;
  Logger.error('AI-ALERT', `[${subject}] ${body}`);

  if (!webhookUrl) return;
  try {
    const { WebhookClient } = await import('discord.js');
    const webhook = new WebhookClient({ url: webhookUrl });
    await webhook.send({
      content: `🚨 **${subject}**\n\n${body}\n\nLast successful: <t:${Math.floor(now / 1000)}:R>`,
      username: `${PRODUCT_NAME} Monitor`,
    });
    Logger.info('AI-ALERT', 'Admin webhook alert sent');
  } catch {
    Logger.error('AI-ALERT', 'Failed to send admin webhook alert');
  }
}

class AIProviderError extends Error {
  constructor(
    readonly provider: string,
    message: string,
    readonly retryable: boolean,
    readonly status?: number,
    readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

function getUserText(messages: AIMessage[]): string {
  return messages
    .filter((message) => message.role === 'user' && typeof message.content === 'string')
    .slice(-4)
    .map((message) => message.content)
    .join('\n')
    .toLowerCase();
}

function shouldUseSmartModel(messages: AIMessage[]): boolean {
  if (messages.some((message) => message.role === 'tool' || Boolean(message.tool_calls?.length))) {
    return true;
  }

  const content = getUserText(messages);
  return [
    'ban',
    'kick',
    'timeout',
    'mute',
    'role',
    'permission',
    'delete',
    'moderation',
    'admin',
    'channel',
    'server',
    'profile',
    'rename',
    'حظر',
    'طرد',
    'كتم',
    'تايم',
    'رتبة',
    'صلاحية',
    'صلاحيات',
    'حذف',
    'قناة',
    'قنوات',
    'روم',
    'برمشن',
    'رول',
    'رولات',
    'سيرفر',
    'إدارة',
    'مشرف',
    'غير اسمك',
    'غيّر اسمك',
  ].some((term) => content.includes(term));
}

const MAX_TOOLS = 5;
const CONVERSATIONAL_PATTERN = /^(السلام عليكم|وعليكم|هلا|مرحبا|اهلين|شلونك|كيفك|كيف حالك|الحمدلله|تمام|طيب|تم|شكرا|تسلم|يعطيك العافيه|مشكور|بخير|اوكي|ok|okay|هههه|هعهع|واو|باي|مع السلامه|وداع)/i;

function selectToolNames(messages: AIMessage[]): Set<string> {
  const selected = new Set<string>();
  if (!currentMessageAllowsTools(messages)) return selected;

  const content = getCurrentUserText(messages);
  
  // Simple conversation? Zero tools needed.
  if (CONVERSATIONAL_PATTERN.test(content.trim())) return selected;

  let latestUserIndex = -1;
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === 'user') {
      latestUserIndex = index;
      break;
    }
  }

  // Add previously-used tools from ongoing chain first
  for (const message of messages.slice(latestUserIndex + 1)) {
    if (selected.size >= MAX_TOOLS) break;
    if (message.role === 'tool' && message.name) selected.add(message.name);
    for (const toolCall of message.tool_calls ?? []) {
      if (selected.size >= MAX_TOOLS) break;
      selected.add(toolCall.function.name);
    }
  }

  // Intent-to-group mapping — limit to 5 tools total
  const intentMatch = (pattern: RegExp, group: readonly string[]) => {
    if (selected.size >= MAX_TOOLS) return;
    if (!pattern.test(content)) return;
    for (const name of group) {
      if (selected.size >= MAX_TOOLS) break;
      selected.add(name);
    }
  };

  // Priority order: most specific groups first
  intentMatch(/(clone role|نسخ الرتبة|لون الرتبة|hoist|mentionable)/i, ['manage_roles']);
  intentMatch(/(channel|room|روم|قناة|قنوات|برمشن|permission|صلاحية|صلاحيات|يشوف|يدخل|يخش|يكتب|يتكلم|سكرين|اخف|إخف)/i,
    ['create_channels', 'edit_permissions', 'delete_channels', 'get_server_info', 'send_embed']);
  intentMatch(/(role|roles|رول|رولات|رتبة|رتب|مشرف)/i,
    ['manage_roles', 'get_member_info', 'get_server_info']);
  intentMatch(/(ban|unban|kick|timeout|mute|حظر|فك الحظر|طرد|كتم|تايم)/i,
    ['manage_members', 'bulk_delete_messages', 'get_member_info']);
  intentMatch(/(voice|فويس|صوتي|روم صوت|join|leave|ادخل|اطلع|voicekick|دسكونكت|دسكنوكت)/i,
    ['manage_members', 'channel_operations']);
  intentMatch(/(music|song|play|pause|resume|skip|queue|volume|اغنية|أغنية|موسيقى|شغل|وقف|الصوت)/i,
    ['play_music', 'set_volume', 'get_voice_status']);
  intentMatch(/(thread|ثريد|منتدى|archive|ارشفة|أرشفة)/i, ['thread_operations']);
  intentMatch(/(automod|اوتو مود|منع الروابط|منع السبام)/i, ['automod_operations']);
  intentMatch(/(emoji|ايموجي|إيموجي|sticker|ملصق|soundboard)/i, ['expression_operations']);
  intentMatch(/(لوقات|لوق|logs?|log channel|سجل الاحداث|سجل الأحداث|سجلات|audit|سجل التدقيق|احصائيات|إحصائيات|stats|بوستات)/i,
    ['create_channels', 'edit_permissions', 'analytics_operations', 'channel_operations']);
  intentMatch(/(webhook|ويب هوك)/i, ['webhook_operations']);
  intentMatch(/(event|فعالية|ايفنت|إيفنت|حدث)/i, ['event_operations']);
  intentMatch(/(server build|سيرفر|خادم|متجر|build|بناء|صمم|نظم)/i,
    ['get_server_info', 'create_channels', 'manage_roles']);
  intentMatch(/(profile|avatar|rename|غير اسمك|غيّر اسمك|سميني|لقبك|صورتك)/i, ['edit_bot_profile']);

  return selected;
}

function compactTools(messages: AIMessage[], enabled: boolean): FunctionTool[] | undefined {
  if (!enabled) return undefined;
  const selectedNames = selectToolNames(messages);
  if (selectedNames.size === 0) return undefined;

  const mapped = tools
    .filter((tool) => selectedNames.has(tool.function.name))
    .map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.function.name,
        description: TOOL_DESCRIPTIONS[tool.function.name] ?? tool.function.description,
        parameters: tool.function.parameters,
      },
    }));
  
  // Hard cap
  if (mapped.length > MAX_TOOLS) mapped.length = MAX_TOOLS;
  return mapped;
}

function trimMessagesForRequest(messages: AIMessage[]): AIMessage[] {
  const sanitized = AIPromptBuilder.sanitizeMessages(messages).map((message) => ({
    ...message,
    content: typeof message.content === 'string'
      ? message.content.slice(0, 1_500)
      : message.content,
  }));
  const selected: AIMessage[] = [];
  let totalChars = 0;

  for (let index = sanitized.length - 1; index >= 0 && selected.length < 6; index--) {
    const message = sanitized[index];
    const size = JSON.stringify(message).length;
    if (selected.length > 0 && totalChars + size > 4_000) break;
    selected.unshift(message);
    totalChars += size;
  }

  while (selected[0]?.role === 'tool') selected.shift();
  return selected.length > 0 ? selected : sanitized.slice(-1);
}

function buildCompletionBody(
  messages: AIMessage[],
  options: GenerateAIOptions,
  model: string
): ChatCompletionBody {
  const selectedTools = compactTools(
    messages,
    options.toolsEnabled ?? selectToolNames(messages).size > 0
  );

  return {
    model,
    messages: [
      { role: 'system', content: composeSystemPrompt(options.systemPrompt) },
      ...trimMessagesForRequest(messages),
    ],
    tools: selectedTools,
    tool_choice: selectedTools?.length ? 'auto' : undefined,
    temperature: options.temperature ?? 0.7,
    max_completion_tokens: options.maxTokens ?? 400,
  };
}

function safeErrorDetail(raw: string): string {
  let detail = raw;
  try {
    const parsed = JSON.parse(raw) as {
      error?: {
        message?: string;
        failed_generation?: { reason?: string } | string;
      };
      message?: string;
    };
    const failedGeneration = typeof parsed.error?.failed_generation === 'string'
      ? parsed.error.failed_generation
      : parsed.error?.failed_generation?.reason;
    detail = [parsed.error?.message ?? parsed.message, failedGeneration]
      .filter(Boolean)
      .join(' - ') || raw;
  } catch {}

  return String(detail)
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/(?:gsk_|csk-)[A-Za-z0-9_-]+/g, '[REDACTED]')
    .replace(/\s+/g, ' ')
    .slice(0, 240);
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined;
}

async function postChatCompletion(
  provider: string,
  endpoint: string,
  apiKey: string,
  body: ChatCompletionBody,
  estimatedTokens?: number
): Promise<ProviderMessage> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(config.aiTimeoutMs, 25_000));
  let outcome = 'error';
  let status: number | null = null;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    status = response.status;

    if (!response.ok) {
      const detail = safeErrorDetail(await response.text());
      const isToolGenerationFailure = response.status === 400 &&
        /(tool call|failed_generation|arguments are not valid json|invalid tool)/i.test(detail);
      const retryable = response.status === 408 ||
        response.status === 413 ||
        response.status === 425 ||
        response.status === 429 ||
        response.status === 498 ||
        response.status === 422 ||
        isToolGenerationFailure ||
        response.status >= 500;
      throw new AIProviderError(
        provider,
        `${provider} request failed with status ${response.status}: ${detail}`,
        retryable,
        response.status,
        parseRetryAfter(response.headers.get('retry-after'))
      );
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: ProviderMessage }>;
    };
    const message = payload.choices?.[0]?.message;
    if (!message || (!message.content && !message.tool_calls?.length)) {
      throw new AIProviderError(provider, `${provider} returned an empty response`, true);
    }

    outcome = 'success';
    // Record actual token usage for rate limiting
    if (estimatedTokens) {
      providerRateLimiter.recordUsage('groq', estimatedTokens);
    }
    return message;
  } catch (error) {
    if (error instanceof AIProviderError) throw error;
    const isAbort = error instanceof Error && error.name === 'AbortError';
    const isNetwork = error instanceof TypeError;
    throw new AIProviderError(
      provider,
      `${provider} ${isAbort ? 'timed out' : 'network request failed'}`,
      isAbort || isNetwork
    );
  } finally {
    clearTimeout(timeout);
    Logger.audit('ai_request', {
      provider,
      model: body.model,
      outcome,
      status,
      duration_ms: Date.now() - startedAt,
      messages: body.messages.length,
      tools: body.tools?.length ?? 0,
    });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryProvider(
  provider: string,
  request: (attempt: number) => Promise<ProviderMessage>
): Promise<ProviderMessage> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.aiMaxRetries; attempt++) {
    try {
      return await request(attempt);
    } catch (error) {
      lastError = error;
      const retryable = error instanceof AIProviderError && error.retryable;
      if (!retryable || attempt >= config.aiMaxRetries) break;

      const exponentialBackoff = 500 * (2 ** attempt);
      const retryAfter = error instanceof AIProviderError ? error.retryAfterMs ?? 0 : 0;
      const waitMs = Math.min(2_000, Math.max(exponentialBackoff, retryAfter));
      Logger.warn('AI', `${provider} transient failure; retrying attempt ${attempt + 1}.`);
      await delay(waitMs);
    }
  }

  throw lastError;
}

export async function generateAIResponse(
  messages: AIMessage[],
  options: GenerateAIOptions = {}
): Promise<ProviderMessage> {
  // Generate deduplication key
  const dedupKey = RequestDeduplication.getCacheKey(messages, options);
  
  // Use deduplication wrapper
  return aiRequestDedup.execute(dedupKey, async () => {
    try {
      const result = await callGroq(messages, options);
      return result;
    } catch (error) {
      // Diffentiate error messages
      if (error instanceof AIProviderError) {
        if (error.status === 401 || error.status === 403) {
          groqAuthInvalid = true;
          Logger.error('AI', 'Groq auth failed; check GROQ_API_KEY in local .env');
          throw new Error(AI_CONFIGURATION_ERROR_MESSAGE);
        }
        if (error.status === 429) {
          const seconds = error.retryAfterMs
            ? Math.ceil(error.retryAfterMs / 1000)
            : 30;
          Logger.warn('AI', `Groq rate limited, retry after ${seconds}s`);
          throw new Error(AI_RATE_LIMIT_MESSAGE.replace('{seconds}', String(seconds)));
        }
        if (error.status === 408 || error.name === 'AbortError' || (error instanceof AIProviderError && error.message.includes('timed out'))) {
          throw new Error(AI_TIMEOUT_MESSAGE);
        }
      }
      // Non-retryable or final failure
      Logger.error('AI', `Groq failed: ${error instanceof Error ? error.message : String(error)}`);
      sendAdminAlert('Groq AI down', [
        'Last error: ' + (error instanceof Error ? error.message : String(error)),
        'Request intent: ' + (options.intent ?? 'fast'),
      ].join('\n'));
      throw new Error(AI_TEMPORARY_ERROR_MESSAGE);
    }
  });
}

export async function getAIResponse(
  messages: AIMessage[],
  options: GenerateAIOptions = {}
): Promise<ProviderMessage> {
  return generateAIResponse(messages, options);
}

export function runAIDiagnostics(): {
  success: boolean;
  promptLength: number;
  totalTools: number;
  totalScenarios: number;
  logs: string[];
} {
  const success = Boolean(config.groqApiKey && tools.length >= 20);
  return {
    success,
    promptLength: SYSTEM_PROMPT.length,
    totalTools: tools.length,
    totalScenarios: 0,
    logs: [
      `AI provider configured locally: ${success ? 'yes' : 'no'}`,
      `Executable AI tools: ${tools.length}`,
      `Groq (${config.groqModel})`,
      `Circuit breaker: ${circuitBreakers.size > 0 ? [...circuitBreakers.entries()].map(([k, v]) => `${k}=${v.consecutiveFailures}fails`).join(', ') : 'all closed'}`,
    ],
  };
}
