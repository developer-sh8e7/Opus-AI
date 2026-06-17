/**
 * Function Tag Normalizer
 *
 * Scans AI response content for `<function>toolName</function>JSON_ARGS</function>`
 * patterns that some provider/ model configurations emit as plain text content
 * instead of structured tool_calls. Converts them into the AIMessage.tool_calls
 * format so the existing tool-execution loop can handle them.
 *
 * This prevents internal function syntax from reaching the Discord user as
 * raw text (the Talk.md:36 failure pattern).
 */

/**
 * Map of known AI-generated Discord.js internal function names to the bot's
 * registered tool names. When the model outputs something like
 * `<function>permissionOverwrites.edit</function>`, we map it to
 * the registered `edit_permissions` tool.
 */
const FUNCTION_TAG_TOOL_MAP: Record<string, string> = {
  // Permission operations
  'permissionOverwrites.edit': 'edit_permissions',
  'channel.permissionOverwrites.edit': 'edit_permissions',
  'PermissionOverwrites.edit': 'edit_permissions',
  'permissionOverwrites': 'edit_permissions',

  // Channel create / delete
  'createChannel': 'create_channels',
  'guild.channels.create': 'create_channels',
  'channel.create': 'create_channels',

  'deleteChannel': 'delete_channels',
  'guild.channels.delete': 'delete_channels',
  'channel.delete': 'delete_channels',

  // Channel operations (rename, topic, nsfw, slowmode, etc.)
  'channel.setName': 'channel_operations',
  'channel.setTopic': 'channel_operations',
  'channel.setNSFW': 'channel_operations',
  'channel.setRateLimitPerUser': 'channel_operations',
  'channel.setBitrate': 'channel_operations',
  'channel.setUserLimit': 'channel_operations',

  // Role operations
  'role.setName': 'role_operations',
  'role.setColor': 'role_operations',
  'role.setHoist': 'role_operations',
  'role.setMentionable': 'role_operations',

  // Member operations
  'guild.members.ban': 'manage_members',
  'guild.members.kick': 'manage_members',
  'member.timeout': 'manage_members',
  'guild.members.unban': 'manage_members',
};

export interface NormalizedFunctionTagResult {
  /** The converted tool_calls entries for the AI response. */
  toolCalls: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  /** The content string with all matched `<function>` blocks removed. */
  cleanContent: string;
  /** Whether any function tags were found and normalized. */
  hasNormalized: boolean;
}

/**
 * Scan a string for `<function>toolName</function>JSON_ARGS</function>` patterns
 * and convert them into the AIMessage.tool_calls format.
 *
 * @param content - The raw AI response content string.
 * @returns A NormalizedFunctionTagResult if any tags were found, or null if none.
 */
export function normalizeFunctionTags(content: string): NormalizedFunctionTagResult | null {
  if (!content || typeof content !== 'string') return null;
  if (!content.includes('<function>')) return null;

  // Match: <function>toolName</function>args-json-text</function>
  // Uses [^<]+ for tool name and non-greedy .*? for JSON args up to </function>
  const pattern = /<function>([^<]+)<\/function>(.*?)<\/function>/gs;
  const toolCalls: NormalizedFunctionTagResult['toolCalls'] = [];
  let cleanContent = content;
  let match: RegExpExecArray | null;
  let hasNormalized = false;

  while ((match = pattern.exec(content)) !== null) {
    const [fullMatch, rawToolName, rawArgs] = match;
    const trimmedName = rawToolName.trim();
    const toolName = FUNCTION_TAG_TOOL_MAP[trimmedName] ?? trimmedName;

    // Attempt to parse the JSON arguments; fall back to {} on failure
    let argsStr = rawArgs.trim();
    if (argsStr) {
      try {
        // Validate by parsing
        JSON.parse(argsStr);
      } catch {
        // Attempt common JSON fixes: unquoted keys, single quotes
        try {
          const fixed = argsStr
            .replace(/(\s*'?)([a-zA-Z_$][\w$]*)(\s*):/g, '"$2":')
            .replace(/:\s*'([^']*)'/g, ':"$1"')
            .replace(/,\s*([}\]])/g, '$1');
          JSON.parse(fixed);
          argsStr = fixed;
        } catch {
          // If still invalid, use empty object — the tool loop or
          // ToolCallValidator will report a meaningful validation error
          argsStr = '{}';
        }
      }
    } else {
      argsStr = '{}';
    }

    const callId = `fn_${Date.now()}_${toolCalls.length}_${Math.random().toString(36).slice(2, 6)}`;
    toolCalls.push({
      id: callId,
      type: 'function',
      function: {
        name: toolName.toLowerCase().replace(/\s+/g, '_'),
        arguments: argsStr,
      },
    });

    cleanContent = cleanContent.replace(fullMatch, '').trim();
    hasNormalized = true;
  }

  if (!hasNormalized) return null;

  return {
    toolCalls,
    cleanContent,
    hasNormalized,
  };
}
