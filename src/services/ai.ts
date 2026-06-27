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
  const runtime = compactRuntimePrompt(runtimePrompt);
  if (!runtime) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n\n[RUNTIME_CONTEXT]\n${runtime}`;
}

// ─── Token estimation ──
function estimateTokens(text: string): number {
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
  if (body.tools) {
    total += JSON.stringify(body.tools).length / 3;
  }
  total += body.max_completion_tokens;
  return Math.round(total);
}

// ─── Provider auth invalidation flags ──
let geminiAuthInvalid = false;
let groqAuthInvalid = false;
let cerebrasAuthInvalid = false;

// ─── Gemini (Primary) ──
import { GoogleGenerativeAI } from '@google/generative-ai';

// Store the model instance once initialized
let geminiModelInstance: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

function getGeminiModel() {
  if (geminiModelInstance) return geminiModelInstance;
  if (!config.geminiApiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    geminiModelInstance = genAI.getGenerativeModel({ model: config.geminiModel });
    return geminiModelInstance;
  } catch {
    return null;
  }
}

export async function callGemini(
  messages: AIMessage[],
  options: GenerateAIOptions = {}
): Promise<ProviderMessage> {
  if (!config.geminiApiKey) {
    throw new AIProviderError('gemini', 'No GEMINI_API_KEY configured', false, 401);
  }
  if (geminiAuthInvalid) {
    throw new AIProviderError('gemini', 'GEMINI_API_KEY was rejected earlier', false, 401);
  }

  const model = getGeminiModel();
  if (!model) {
    throw new AIProviderError('gemini', 'Failed to initialize Gemini model', false, 500);
  }

  return retryProvider('gemini', async (attempt) => {
    const systemInstruction = composeSystemPrompt(options.systemPrompt);

    // Convert tools to Gemini functionDeclarations format
    const selectedTools = compactTools(
      messages,
      options.toolsEnabled ?? selectToolNames(messages).size > 0
    );
    const geminiTools = selectedTools && selectedTools.length > 0
      ? [{
          functionDeclarations: selectedTools.map((t) => ({
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters,
          })),
        }]
      : undefined;

    // Convert messages to Gemini format
    const geminiContents: Array<{
      role: 'user' | 'model' | 'function';
      parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }>;
    }> = [];

    for (const m of messages) {
      if (m.role === 'system') continue;

      if (m.role === 'user') {
        geminiContents.push({
          role: 'user',
          parts: [{ text: m.content || '' }],
        });
      } else if (m.role === 'assistant') {
        const parts: Array<{ text?: string; functionCall?: any }> = [];
        if (m.content) {
          parts.push({ text: m.content });
        }
        if (m.tool_calls) {
          for (const tc of m.tool_calls) {
            let args: Record<string, any> = {};
            try { args = JSON.parse(tc.function.arguments); } catch {}
            parts.push({
              functionCall: {
                name: tc.function.name,
                args,
              },
            });
          }
        }
        geminiContents.push({ role: 'model', parts });
      } else if (m.role === 'tool') {
        // Gemini expects functionResponse parts for tool results
        let responseObj: any = {};
        try {
          responseObj = m.content ? JSON.parse(m.content) : {};
        } catch {
          responseObj = { result: m.content || '' };
        }
        geminiContents.push({
          role: 'function',
          parts: [{
            functionResponse: {
              name: m.name || '',
              response: responseObj,
            },
          }],
        });
      }
    }

    // Estimate token usage
    const totalText = systemInstruction + ' ' + geminiContents.map((c) => c.parts.map((p) => p.text || '').join(' ')).join(' ');
    const estimatedTokens = estimateTokens(totalText) + (options.maxTokens ?? 400);
    const toolCount = selectedTools?.length ?? 0;

    Logger.info('AI', `Gemini Req: est=${estimatedTokens}t sys=${estimateTokens(systemInstruction)}t msgs=${geminiContents.length} tools=${toolCount} out=${options.maxTokens ?? 400}`);

    const limitCheck = providerRateLimiter.check('gemini', estimatedTokens, config.geminiModel);
    if (!limitCheck.allowed) {
      Logger.warn('AI', `Gemini rate limit (${limitCheck.reason}): silently switching, retry after ${Math.round((limitCheck.retryAfterMs ?? 0) / 1000)}s`);
      throw new AIProviderError(
        'gemini',
        `Gemini rate limited on ${limitCheck.reason}: retry after ${Math.round((limitCheck.retryAfterMs ?? 0) / 1000)}s`,
        true,
        429,
        limitCheck.retryAfterMs
      );
    }

    const startedAt = Date.now();
    try {
      const requestPayload: any = {
        systemInstruction: { role: 'user', parts: [{ text: systemInstruction }] },
        contents: geminiContents,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 400,
        },
      };

      if (geminiTools) {
        requestPayload.tools = geminiTools;
      }

      const result = await model.generateContent(requestPayload);

      const candidate = result.response.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];

      let text = '';
      const toolCalls: AIMessage['tool_calls'] = [];

      for (const part of parts) {
        if (part.text) {
          text += part.text;
        }
        if (part.functionCall) {
          const fc = part.functionCall;
          const args = typeof fc.args === 'object' && fc.args !== null
            ? JSON.stringify(fc.args)
            : '{}';
          toolCalls.push({
            id: `gemini_fn_${Date.now()}_${toolCalls.length}`,
            type: 'function',
            function: {
              name: fc.name ?? '',
              arguments: args,
            },
          });
        }
      }

      const duration = Date.now() - startedAt;
      Logger.audit('ai_request', {
        provider: 'gemini',
        model: config.geminiModel,
        outcome: 'success',
        status: 200,
        duration_ms: duration,
        messages: geminiContents.length,
        tools: toolCount,
      });

      providerRateLimiter.recordUsage('gemini', estimatedTokens);

      return {
        role: 'assistant',
        content: text || null,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch (error: any) {
      const duration = Date.now() - startedAt;
      // Check for auth errors
      if (error.message && (error.message.includes('API_KEY') || error.message.includes('403') || error.message.includes('UNAUTHENTICATED'))) {
        geminiAuthInvalid = true;
        Logger.error('AI', `Gemini auth failed: ${error.message}`);
        throw new AIProviderError('gemini', 'Gemini auth failed', false, 401);
      }
      const isQuota = error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'));
      const isTimeout = error.message && (error.message.includes('timeout') || error.message.includes('DEADLINE_EXCEEDED'));
      Logger.audit('ai_request', {
        provider: 'gemini',
        model: config.geminiModel,
        outcome: 'error',
        status: isQuota ? 429 : isTimeout ? 408 : 500,
        duration_ms: duration,
        messages: geminiContents.length,
        tools: toolCount,
      });
      throw new AIProviderError(
        'gemini',
        `Gemini error: ${error.message || String(error)}`,
        isQuota || isTimeout || !error.message?.includes('API_KEY'),
        isQuota ? 429 : isTimeout ? 408 : 500
      );
    }
  });
}

// ─── Groq (Fallback #1) ──

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
    throw new AIProviderError('groq', 'GROQ_API_KEY was rejected earlier', false, 401);
  }

  return retryProvider('groq', (attempt) => {
    const body = buildCompletionBody(messages, {
      ...options,
      temperature: Math.max(0.35, (options.temperature ?? 0.7) - (attempt * 0.1)),
    }, model);

    const estimatedTokens = estimateBodyTokens(body);
    const toolCount = body.tools?.length ?? 0;
    const msgCount = body.messages.length;
    const sysLen = body.messages[0]?.content?.length ?? 0;
    Logger.info('AI', `Groq Req: est=${estimatedTokens}t sys=${Math.round(sysLen/4)}t msgs=${msgCount} tools=${toolCount} out=${body.max_completion_tokens}`);

    const limitCheck = providerRateLimiter.check('groq', estimatedTokens, model);
    if (!limitCheck.allowed) {
      Logger.warn('AI', `Groq rate limit (${limitCheck.reason}): retry after ${Math.round((limitCheck.retryAfterMs ?? 0) / 1000)}s`);
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

// ─── Cerebras (Fallback #2) ──

export async function callCerebras(
  messages: AIMessage[],
  options: GenerateAIOptions = {}
): Promise<ProviderMessage> {
  const apiKey = config.cerebrasApiKey;
  const endpoint = config.cerebrasApiBaseUrl;
  const model = config.cerebrasModel;

  if (!apiKey) {
    throw new AIProviderError('cerebras', 'No CEREBRAS_API_KEY configured', false, 401);
  }
  if (cerebrasAuthInvalid) {
    throw new AIProviderError('cerebras', 'CEREBRAS_API_KEY was rejected earlier', false, 401);
  }

  return retryProvider('cerebras', (attempt) => {
    const body = buildCompletionBody(messages, {
      ...options,
      temperature: Math.max(0.35, (options.temperature ?? 0.7) - (attempt * 0.1)),
    }, model);

    const estimatedTokens = estimateBodyTokens(body);
    const toolCount = body.tools?.length ?? 0;
    const msgCount = body.messages.length;
    Logger.info('AI', `Cerebras Req: est=${estimatedTokens}t msgs=${msgCount} tools=${toolCount} out=${body.max_completion_tokens}`);

    const limitCheck = providerRateLimiter.check('cerebras', estimatedTokens, model);
    if (!limitCheck.allowed) {
      Logger.warn('AI', `Cerebras rate limit (${limitCheck.reason}): retry after ${Math.round((limitCheck.retryAfterMs ?? 0) / 1000)}s`);
      throw new AIProviderError(
        'cerebras',
        `Cerebras rate limited on ${limitCheck.reason}: retry after ${Math.round((limitCheck.retryAfterMs ?? 0) / 1000)}s`,
        true,
        429,
        limitCheck.retryAfterMs
      );
    }

    return postChatCompletion('cerebras', endpoint, apiKey, body, estimatedTokens);
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
      .replace(/\bplay_music\b/g, 'مشغل الموسيقى')
      .replace(/\bbuild_custom_server\b/g, 'منظّم السيرفر')
      .replace(/\bexecute_community_build\b/g, 'باني السيرفر')
      .replace(/\bcreate_channels\b/g, 'إنشاء الرومات')
      .replace(/\bmanage_roles\b/g, 'إدارة الرتب')
      .replace(/\bedit_permissions\b/g, 'تعديل الصلاحيات')
      .replace(/\bget_server_info\b/g, 'معلومات السيرفر')
      .replace(/\bI am (an? )?(AI|language model|assistant)[^.\n]*\.?/gi, '')
      .replace(/\bAs an? (AI|language model)[^.\n]*\.?/gi, '')
      .replace(/أنا (?:نموذج لغة|مساعد ذكاء اصطناعي)[^\n.]*[.؟]?/g, '')
      .replace(/\s{3,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

export const AI_TEMPORARY_ERROR_MESSAGE = 'AI provider is temporarily unavailable. Try again shortly.';
export const AI_CONFIGURATION_ERROR_MESSAGE = 'Invalid or missing AI API key. Update your local .env file.';
export const AI_PROVIDER_STATE_MESSAGE = 'All AI providers are currently unavailable.';
export const AI_RATE_LIMIT_MESSAGE = 'AI request limit reached. Try again after {seconds} seconds.';
export const AI_TIMEOUT_MESSAGE = 'AI response timed out. Try a smaller request.';

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
  
  if (CONVERSATIONAL_PATTERN.test(content.trim())) return selected;

  let latestUserIndex = -1;
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === 'user') {
      latestUserIndex = index;
      break;
    }
  }

  for (const message of messages.slice(latestUserIndex + 1)) {
    if (selected.size >= MAX_TOOLS) break;
    if (message.role === 'tool' && message.name) selected.add(message.name);
    for (const toolCall of message.tool_calls ?? []) {
      if (selected.size >= MAX_TOOLS) break;
      selected.add(toolCall.function.name);
    }
  }

  const intentMatch = (pattern: RegExp, group: readonly string[]) => {
    if (selected.size >= MAX_TOOLS) return;
    if (!pattern.test(content)) return;
    for (const name of group) {
      if (selected.size >= MAX_TOOLS) break;
      selected.add(name);
    }
  };

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
    .replace(/(?:gsk_|csk-|AIza)[A-Za-z0-9_-]+/g, '[REDACTED]')
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
    if (estimatedTokens) {
      providerRateLimiter.recordUsage(provider, estimatedTokens);
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

// ════════════════════════════════════════════════════════════════
//  Main AI generation — tries Gemini first, falls back to
//  Groq (#1), then Cerebras (#2), then raises final error.
// ════════════════════════════════════════════════════════════════

async function tryProvider(
  providerName: string,
  callFn: () => Promise<ProviderMessage>
): Promise<ProviderMessage> {
  if (isCircuitOpen(providerName)) {
    Logger.warn('AI', `${providerName} circuit is open, skipping`);
    throw new AIProviderError(providerName, `${providerName} circuit is open`, false, 503);
  }
  try {
    const result = await callFn();
    recordSuccess(providerName);
    return result;
  } catch (error) {
    recordFailure(providerName);
    throw error;
  }
}

export async function generateAIResponse(
  messages: AIMessage[],
  options: GenerateAIOptions = {}
): Promise<ProviderMessage> {
  const dedupKey = RequestDeduplication.getCacheKey(messages, options);
  
  return aiRequestDedup.execute(dedupKey, async () => {
    // Collect providers in priority order
    const providers: Array<{
      name: string;
      call: () => Promise<ProviderMessage>;
    }> = [];

    // Primary: Gemini
    if (config.geminiApiKey && !geminiAuthInvalid) {
      providers.push({
        name: 'gemini',
        call: () => tryProvider('gemini', () => callGemini(messages, options)),
      });
    }

    // Fallback #1: Groq
    if (config.groqApiKey && !groqAuthInvalid) {
      providers.push({
        name: 'groq',
        call: () => tryProvider('groq', () => callGroq(messages, options)),
      });
    }

    // Fallback #2: Cerebras
    if (config.cerebrasApiKey && !cerebrasAuthInvalid) {
      providers.push({
        name: 'cerebras',
        call: () => tryProvider('cerebras', () => callCerebras(messages, options)),
      });
    }

    if (providers.length === 0) {
      Logger.error('AI', 'No AI providers configured');
      throw new Error(AI_CONFIGURATION_ERROR_MESSAGE);
    }

    let lastError: unknown;
    let allRateLimited = true;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      
      // Add 2-second delay between provider switches, except for the first provider
      if (i > 0) {
        Logger.info('AI', `Switching from ${providers[i-1].name} to ${provider.name} in 2s...`);
        await delay(2000);
      }
      
      try {
        Logger.info('AI', `Trying provider: ${provider.name}`);
        const result = await provider.call();
        Logger.info('AI', `${provider.name}:${provider.name === 'gemini' ? config.geminiModel : provider.name === 'groq' ? config.groqModel : config.cerebrasModel} outcome=success`);
        return result;
      } catch (error) {
        lastError = error;
        
        const isRateLimit = error instanceof AIProviderError &&
          (error.status === 429 || (error.message && error.message.includes('rate limited')));
        
        if (!isRateLimit) {
          allRateLimited = false;
        }
        
        Logger.warn('AI', `${provider.name} failed: ${error instanceof Error ? error.message : String(error)} ${isRateLimit ? '(rate limited, silent switch)' : ''}`);
        
        if (error instanceof AIProviderError) {
          if (error.status === 401 || error.status === 403) {
            // Auth failure — mark permanent and skip in future
            if (provider.name === 'gemini') geminiAuthInvalid = true;
            else if (provider.name === 'groq') groqAuthInvalid = true;
            else if (provider.name === 'cerebras') cerebrasAuthInvalid = true;
            continue;
          }
        }
        // Continue to next provider on any failure
      }
    }

    // All providers failed
    Logger.error('AI', 'All AI providers failed');
    
    // Only send admin alert if at least one provider had a non-rate-limit failure
    if (!allRateLimited) {
      sendAdminAlert('AI provider failure', [
        'Last error: ' + (lastError instanceof Error ? lastError.message : String(lastError)),
        'Request intent: ' + (options.intent ?? 'fast'),
      ].join('\n'));
    }

    // Generate appropriate error message
    if (allRateLimited) {
      // ALL providers rate limited — show "مشغول" message
      const seconds = lastError instanceof AIProviderError && lastError.retryAfterMs
        ? Math.ceil(lastError.retryAfterMs / 1000)
        : 30;
      throw new Error(AI_RATE_LIMIT_MESSAGE.replace('{seconds}', String(seconds)));
    } else {
      // At least one provider had a non-rate-limit failure — generic message
      if (lastError instanceof AIProviderError) {
        if (lastError.status === 408 || lastError.message.includes('timed out')) {
          throw new Error(AI_TIMEOUT_MESSAGE);
        }
      }
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
  const geminiOk = Boolean(config.geminiApiKey);
  const groqOk = Boolean(config.groqApiKey);
  const cerebrasOk = Boolean(config.cerebrasApiKey);
  const success = (geminiOk || groqOk) && tools.length >= 20;

  const providers: string[] = [];
  if (geminiOk) providers.push(`Gemini (${config.geminiModel})`);
  if (groqOk) providers.push(`Groq (${config.groqModel})`);
  if (cerebrasOk) providers.push(`Cerebras (${config.cerebrasModel})`);

  const breakerInfo = circuitBreakers.size > 0 
    ? [...circuitBreakers.entries()].map(([k, v]) => `${k}=${v.consecutiveFailures}fails`).join(', ')
    : 'all closed';

  return {
    success,
    promptLength: SYSTEM_PROMPT.length,
    totalTools: tools.length,
    totalScenarios: 0,
    logs: [
      `AI providers: ${providers.length > 0 ? providers.join(', ') : 'none configured'}`,
      `Primary: ${geminiOk ? config.geminiModel : 'Gemini not configured'}`,
      `Fallback #1: ${groqOk ? config.groqModel : 'Groq not configured'}`,
      `Fallback #2: ${cerebrasOk ? config.cerebrasModel : 'Cerebras not configured'}`,
      `Executable AI tools: ${tools.length}`,
      `Circuit breaker: ${breakerInfo}`,
    ],
  };
}
