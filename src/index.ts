import { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Guild, 
  ActivityType 
} from 'discord.js';
import { config } from './config.js';
import { getAIResponse, AIMessage } from './services/ai.js';
import { 
  createChannels, 
  manageRoles, 
  editPermissions, 
  manageMembers, 
  getServerInfo 
} from './utils/discordTools.js';

// تهيئة عميل ديسكورد مع تحديد النوايا المطلوبة (Intents)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// ذاكرة مؤقتة لحفظ سياق المحادثة لكل قناة لتمكين الموديل من الفهم التراكمي
const conversationHistory = new Map<string, AIMessage[]>();

/**
 * دالة مساعدة لتنفيذ الأدوات المطلوبة برمجياً بعد موافقة البوت عليها.
 */
async function executeTool(name: string, args: any, guild: Guild): Promise<any> {
  switch (name) {
    case 'get_server_info':
      return await getServerInfo(guild);
    case 'create_channels':
      return await createChannels(
        guild,
        args.type,
        args.names,
        args.categoryId,
        args.permissions
      );
    case 'manage_roles':
      return await manageRoles(
        guild,
        args.action,
        args.roleData,
        args.targetMemberId
      );
    case 'edit_permissions':
      return await editPermissions(
        guild,
        args.channelId,
        args.targetId,
        args.targetType,
        args.allow,
        args.deny
      );
    case 'manage_members':
      return await manageMembers(
        guild,
        args.action,
        args.memberId,
        args.data
      );
    default:
      throw new Error(`أداة غير مدعومة: ${name}`);
  }
}

// 🟢 عند تشغيل البوت وجاهزيته
client.once('ready', () => {
  console.log(`[Opus Bot] تم تسجيل الدخول بنجاح كـ ${client.user?.tag}`);
  
  // وضع حالة البوت (Status)
  client.user?.setActivity({
    name: 'سيرفر الإدارة الذكي',
    type: ActivityType.Watching,
  });
});

// 📩 معالج الرسائل الجديد (messageCreate)
client.on('messageCreate', async (message) => {
  // 🔒 القاعدة الأولى: بوابة الرتبة (Gateway Firewall) — أول شيء دائماً
  if (!message.member?.roles.cache.has(config.authorizedRoleId)) {
    // تجنب الرد على البوت نفسه لتفادي حلقات لا نهائية
    if (message.author.id === client.user?.id) return;
    
    try {
      await message.reply({ content: "ليس لديك صلاحيات." });
    } catch (err) {
      console.error('[Gateway Firewall] تعذر إرسال رسالة الرفض:', err);
    }
    return; // ❌ إنهاء فوري — لا API calls، لا معالجة، لا استهلاك للموارد
  }

  // تجاهل البوتات الأخرى تماماً
  if (message.author.bot) return;

  // التحقق من أن الرسالة أرسلت داخل سيرفر (وليس في الخاص)
  if (!message.guild) return;

  // التفاعل فقط عند ذكر البوت (Mention) أو استخدام البادئة !opus
  const prefix = '!opus';
  const isMentioned = message.mentions.has(client.user!) && !message.mentions.everyone;
  const isPrefix = message.content.startsWith(prefix);

  if (!isMentioned && !isPrefix) return;

  // تنظيف الرسالة من المينشن أو البادئة للحصول على الطلب الفعلي للمستخدم
  let promptText = message.content;
  if (isPrefix) {
    promptText = promptText.slice(prefix.length).trim();
  } else if (isMentioned) {
    promptText = promptText.replace(new RegExp(`<@!?${client.user!.id}>`, 'g'), '').trim();
  }

  // إذا كان الطلب فارغاً
  if (!promptText) {
    await message.reply("مرحباً! كيف يمكنني مساعدتك اليوم في إدارة السيرفر؟");
    return;
  }

  // إظهار حالة جاري الكتابة (Typing...) للإشارة ببدء المعالجة
  await message.channel.sendTyping();

  try {
    // الحصول على تاريخ المحادثة للقناة الحالية
    const history = conversationHistory.get(message.channel.id) || [];
    
    // إضافة رسالة المستخدم الحالية
    history.push({
      role: 'user',
      content: promptText,
    });

    let loopCount = 0;
    const maxLoops = 5; // منع اللانهاية في الـ Tool Calls
    let finalResponseSent = false;

    // البدء باستدعاء الذكاء الاصطناعي
    let aiResponse = await getAIResponse(history);

    while (aiResponse.tool_calls && aiResponse.tool_calls.length > 0 && loopCount < maxLoops) {
      loopCount++;

      // تسجيل استدعاء الأداة في سياق الـ AI
      history.push({
        role: 'assistant',
        content: aiResponse.content || null,
        tool_calls: aiResponse.tool_calls,
      });

      // تنفيذ كل الأدوات التي طلبها الموديل بالتوالي
      for (const toolCall of aiResponse.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        const toolCallId = toolCall.id;

        console.log(`[AI Request] استدعاء الأداة: ${toolName} مع المدخلات:`, toolArgs);

        let executionResult;
        try {
          executionResult = await executeTool(toolName, toolArgs, message.guild);
        } catch (toolError) {
          executionResult = {
            success: false,
            message: toolError instanceof Error ? toolError.message : String(toolError),
          };
        }

        // إضافة نتيجة تشغيل الأداة إلى السياق
        history.push({
          role: 'tool',
          name: toolName,
          tool_call_id: toolCallId,
          content: JSON.stringify(executionResult),
        });
      }

      // إخبار المستخدم ببدء مرحلة جديدة من التفكير إذا لزم الأمر
      await message.channel.sendTyping();
      
      // طلب رد جديد بعد حقن نتائج الأدوات
      aiResponse = await getAIResponse(history);
    }

    // إرسال الرد النصي النهائي للمستخدم بعد انتهاء الأدوات
    if (aiResponse.content) {
      await message.reply(aiResponse.content);
      
      // حفظ الرد النهائي في الذاكرة
      history.push({
        role: 'assistant',
        content: aiResponse.content,
      });
      finalResponseSent = true;
    }

    // تقليص حجم الذاكرة المؤقتة للحفاظ على أداء البوت ومنع الـ Context Overflow
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    conversationHistory.set(message.channel.id, history);

    if (!finalResponseSent) {
      await message.reply("تمت العملية بنجاح دون إرجاع تعليق إضافي.");
    }

  } catch (error) {
    console.error('[Main Process] حدث خطأ أثناء معالجة الطلب:', error);
    const friendlyError = error instanceof Error ? error.message : String(error);
    await message.reply(`عذراً، حدث خطأ أثناء معالجة طلبك: ${friendlyError}`);
  }
});

// تشغيل البوت باستخدام التوكن المعتمد في config
client.login(config.discordToken).catch((err) => {
  console.error('[Startup Error] فشل بدء تشغيل البوت، تأكد من صحة التوكن في ملف .env:', err);
  process.exit(1);
});
