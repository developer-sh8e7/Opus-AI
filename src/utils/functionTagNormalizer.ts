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
  'manage_members': 'manage_members',
  'voicekick': 'manage_members',
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
  if (!/<(?:function|tool_call)\b/i.test(content)) return null;

  const toolCalls: NormalizedFunctionTagResult['toolCalls'] = [];
  let cleanContent = content;
  let hasNormalized = false;

  const normalizeToolName = (raw: string): string => {
    const trimmed = raw.trim();
    const mapped = FUNCTION_TAG_TOOL_MAP[trimmed] ?? trimmed;
    return mapped.toLowerCase().replace(/\s+/g, '_');
  };

  const normalizeArgs = (raw: string): string => {
    let argsStr = raw.trim();
    if (!argsStr) return '{}';
    try {
      JSON.parse(argsStr);
      return argsStr;
    } catch {
      try {
        const fixed = argsStr
          .replace(/(\s*'?)([a-zA-Z_$][\w$]*)(\s*):/g, '"$2":')
          .replace(/:\s*'([^']*)'/g, ':"$1"')
          .replace(/,\s*([}\]])/g, '$1');
        JSON.parse(fixed);
        return fixed;
      } catch {
        return '{}';
      }
    }
  };

  const pushCall = (rawName: string, rawArgs: string, fullMatch: string): void => {
    const callId = `fn_${Date.now()}_${toolCalls.length}_${Math.random().toString(36).slice(2, 6)}`;
    toolCalls.push({
      id: callId,
      type: 'function',
      function: {
        name: normalizeToolName(rawName),
        arguments: normalizeArgs(rawArgs),
      },
    });
    cleanContent = cleanContent.replace(fullMatch, '').trim();
    hasNormalized = true;
  };

  // Pattern 1: <function>tool</function>{json}</function>
  const classicPattern = /<function>([^<]+)<\/function>(.*?)<\/function>/gis;
  let classicMatch: RegExpExecArray | null;
  while ((classicMatch = classicPattern.exec(content)) !== null) {
    pushCall(classicMatch[1], classicMatch[2], classicMatch[0]);
  }

  // Pattern 2: <function=tool>{json}</function>
  const attributePattern = /<function=([A-Za-z0-9_.:-]+)>(.*?)<\/function>/gis;
  let attributeMatch: RegExpExecArray | null;
  while ((attributeMatch = attributePattern.exec(content)) !== null) {
    pushCall(attributeMatch[1], attributeMatch[2], attributeMatch[0]);
  }

  // Pattern 3: <tool_call>tool<arg_key>k</arg_key><arg_value>v</arg_value></tool_call>
  const toolCallPattern = /<tool_call>(.*?)<\/tool_call>/gis;
  let toolCallMatch: RegExpExecArray | null;
  while ((toolCallMatch = toolCallPattern.exec(content)) !== null) {
    const body = toolCallMatch[1];
    const rawName = body.split(/<arg_key>/i)[0].trim();
    const args: Record<string, string | boolean | number> = {};
    const argPattern = /<arg_key>(.*?)<\/arg_key>\s*<arg_value>(.*?)<\/arg_value>/gis;
    let argMatch: RegExpExecArray | null;
    while ((argMatch = argPattern.exec(body)) !== null) {
      const key = argMatch[1].replace(/<[^>]+>/g, '').trim();
      const rawValue = argMatch[2].replace(/<[^>]+>/g, '').trim();
      if (!key) continue;
      if (/^(true|false)$/i.test(rawValue)) args[key] = /^true$/i.test(rawValue);
      else if (/^-?\d+(?:\.\d+)?$/.test(rawValue)) args[key] = Number(rawValue);
      else args[key] = rawValue;
    }
    if (rawName) pushCall(rawName, JSON.stringify(args), toolCallMatch[0]);
  }

  if (!hasNormalized) return null;

  return {
    toolCalls,
    cleanContent,
    hasNormalized,
  };
}
