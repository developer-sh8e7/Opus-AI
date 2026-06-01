import {
  Guild,
  ChannelType,
  EmbedBuilder,
  TextChannel,
  GuildMember,
  VoiceBasedChannel,
} from 'discord.js';
import {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  AudioPlayer,
  VoiceConnection,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import ytdl from '@distube/ytdl-core';
import YouTubeSearch from 'youtube-sr';

// ============================================================
//  الثوابت والتكوين
// ============================================================
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1500;
const INACTIVITY_TIMEOUT = 120_000; // 2 دقائق
const MAX_QUEUE_SIZE = 200;
const DEFAULT_VOLUME = 70;
const STREAM_BUFFER_SIZE = 1 << 25; // 32MB

// User-Agent headers لتجنب الحظر
const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Referer': 'https://www.youtube.com/',
};

// ============================================================
//  هيكل الأغنية
// ============================================================
export interface Track {
  title: string;
  url: string;
  duration: string;
  durationMs: number;
  thumbnail: string;
  requestedBy: string;
  videoId: string;
  source: 'youtube' | 'direct';
}

// ============================================================
//  مشغل الموسيقى لكل سيرفر
// ============================================================
interface MusicPlayer {
  connection: VoiceConnection;
  player: AudioPlayer;
  queue: Track[];
  currentTrack: Track | null;
  volume: number;
  looping: boolean;
  textChannelId: string;
  lastActivity: number;
  retryCount: number;
  inactivityTimer: ReturnType<typeof setTimeout> | null;
  voiceChannelId: string;
}

export const musicPlayers = new Map<string, MusicPlayer>();

// ============================================================
//  دوال مساعدة - الوقت والتنسيق
// ============================================================
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds <= 0) return 'بث مباشر';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function msToFormatted(ms: number): string {
  return formatDuration(Math.floor(ms / 1000));
}

// ============================================================
//  كشف وتنظيف روابط يوتيوب
// ============================================================
function isYouTubeUrl(str: string): boolean {
  return /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/(watch\?.*v=|shorts\/|embed\/|live\/|playlist\?)|youtu\.be\/)/.test(str.trim());
}

function isDirectUrl(str: string): boolean {
  return /^https?:\/\/.+\.(mp3|mp4|wav|ogg|webm|m4a|flac|aac)(\?.*)?$/i.test(str.trim());
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function cleanYouTubeUrl(url: string): string {
  const id = extractVideoId(url);
  if (id) return `https://www.youtube.com/watch?v=${id}`;
  return url.trim();
}

/**
 * تحسين استعلام البحث - يعود بالاستعلام النظيف فقط دون إضافات أو مرادفات
 */
function enhanceSearchQuery(query: string): string[] {
  return [query.trim()];
}


// ============================================================
//  البحث عن أغنية - ذكي مع عدة محاولات
// ============================================================
async function searchTrack(query: string, requestedBy: string): Promise<Track | null> {
  try {
    // --- حالة 1: رابط يوتيوب مباشر ---
    if (isYouTubeUrl(query)) {
      const cleanUrl = cleanYouTubeUrl(query);
      const videoId = extractVideoId(cleanUrl);
      if (!videoId) {
        console.warn('[Music Search] فشل استخراج videoId من:', query);
        return null;
      }

      try {
        const info = await ytdl.getBasicInfo(cleanUrl, {
          requestOptions: { headers: REQUEST_HEADERS },
        });
        const details = info.videoDetails;
        return {
          title: details.title || 'أغنية يوتيوب',
          url: cleanUrl,
          duration: formatDuration(parseInt(details.lengthSeconds, 10)),
          durationMs: parseInt(details.lengthSeconds, 10) * 1000,
          thumbnail: details.thumbnails?.slice(-1)?.[0]?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          requestedBy,
          videoId,
          source: 'youtube',
        };
      } catch {
        // إذا فشل getBasicInfo، نبني Track بالمعلومات المتوفرة
        return {
          title: 'فيديو يوتيوب',
          url: cleanUrl,
          duration: 'غير معروف',
          durationMs: 0,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          requestedBy,
          videoId,
          source: 'youtube',
        };
      }
    }

    // --- حالة 2: رابط مباشر (mp3, etc.) ---
    if (isDirectUrl(query)) {
      const fileName = query.split('/').pop()?.split('?')[0] || 'مقطع صوتي';
      return {
        title: decodeURIComponent(fileName),
        url: query.trim(),
        duration: 'غير معروف',
        durationMs: 0,
        thumbnail: '',
        requestedBy,
        videoId: '',
        source: 'direct',
      };
    }

    // --- حالة 3: بحث نصي ذكي ---
    const searchQueries = enhanceSearchQuery(query);
    console.log(`[Music Search] استعلامات البحث: ${JSON.stringify(searchQueries)}`);

    for (const sq of searchQueries) {
      try {
        const results = await YouTubeSearch.search(sq, { type: 'video', limit: 5 });
        if (results && results.length > 0) {
          // اختيار أفضل نتيجة (تفضيل الفيديوهات الأطول من 30 ثانية والأقصر من ساعة)
          const filtered = results.filter(r => {
            const dur = r.duration ? r.duration / 1000 : 0;
            return dur > 30 && dur < 3600;
          });
          const best = filtered.length > 0 ? filtered[0] : results[0];

          const videoId = best.id || '';
          if (!videoId) continue;

          const url = `https://www.youtube.com/watch?v=${videoId}`;
          const durationSec = best.duration ? best.duration / 1000 : 0;

          return {
            title: best.title || 'أغنية غير معروفة',
            url,
            duration: formatDuration(durationSec),
            durationMs: best.duration || 0,
            thumbnail: best.thumbnail?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            requestedBy,
            videoId,
            source: 'youtube',
          };
        }
      } catch (searchErr) {
        console.warn(`[Music Search] فشل البحث عن "${sq}":`, searchErr instanceof Error ? searchErr.message : searchErr);
        continue;
      }
    }

    console.warn('[Music Search] لم يتم العثور على نتائج لجميع الاستعلامات');
    return null;
  } catch (err) {
    console.error('[Music Search] خطأ عام:', err);
    return null;
  }
}

// ============================================================
//  إنشاء stream صوتي - مع عدة محاولات وطرق
// ============================================================
async function createStream(track: Track, attempt: number = 1): Promise<ReturnType<typeof createAudioResource>> {
  // رابط مباشر
  if (track.source === 'direct') {
    try {
      const response = await fetch(track.url, { headers: REQUEST_HEADERS });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const stream = response.body;
      if (!stream) throw new Error('No response body');
      return createAudioResource(stream as any, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      });
    } catch (err) {
      throw new Error(`فشل تحميل الملف الصوتي: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const url = track.url;
  const errors: string[] = [];

  // === الطريقة 1: @distube/ytdl-core بجودة عالية ===
  if (attempt <= 1) {
    try {
      const stream = ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: STREAM_BUFFER_SIZE,
        requestOptions: { headers: REQUEST_HEADERS },
      });

      // انتظار بداية البيانات للتأكد من نجاح الاتصال
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Stream timeout')), 15000);
        stream.once('data', () => { clearTimeout(timeout); resolve(); });
        stream.once('error', (e) => { clearTimeout(timeout); reject(e); });
      });

      return createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`ytdl-high: ${msg}`);
      console.warn(`[Stream] الطريقة 1 (ytdl عالي الجودة) فشلت: ${msg}`);
    }
  }

  // === الطريقة 2: @distube/ytdl-core بجودة منخفضة ===
  if (attempt <= 2) {
    try {
      const stream = ytdl(url, {
        filter: 'audioonly',
        quality: 'lowestaudio',
        highWaterMark: STREAM_BUFFER_SIZE,
        requestOptions: { headers: REQUEST_HEADERS },
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Stream timeout')), 15000);
        stream.once('data', () => { clearTimeout(timeout); resolve(); });
        stream.once('error', (e) => { clearTimeout(timeout); reject(e); });
      });

      return createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`ytdl-low: ${msg}`);
      console.warn(`[Stream] الطريقة 2 (ytdl منخفض الجودة) فشلت: ${msg}`);
    }
  }

  // === الطريقة 3: ytdl بدون فلتر ===
  if (attempt <= 3) {
    try {
      const info = await ytdl.getInfo(url, {
        requestOptions: { headers: REQUEST_HEADERS },
      });

      // البحث يدوياً عن أفضل format صوتي
      const audioFormats = info.formats
        .filter(f => f.hasAudio && !f.hasVideo)
        .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

      const format = audioFormats[0] || info.formats.find(f => f.hasAudio);
      if (!format) throw new Error('No audio format found');

      const stream = ytdl.downloadFromInfo(info, { format });

      return createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`ytdl-manual: ${msg}`);
      console.warn(`[Stream] الطريقة 3 (ytdl يدوي) فشلت: ${msg}`);
    }
  }

  throw new Error(`فشل جميع طرق التشغيل بعد ${attempt} محاولات.\n${errors.join('\n')}`);
}

// ============================================================
//  Embeds - رسائل مضمنة احترافية
// ============================================================
function buildNowPlayingEmbed(track: Track, queueLen: number, looping: boolean, volume: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x1DB954)
    .setTitle('🎵 يتم التشغيل الآن')
    .setDescription(`**[${track.title}](${track.url})**`)
    .addFields(
      { name: '⏱️ المدة', value: track.duration, inline: true },
      { name: '👤 طُلبت بواسطة', value: track.requestedBy, inline: true },
      { name: '📋 في القائمة', value: `${queueLen} أغنية`, inline: true },
      { name: '🔁 تكرار', value: looping ? '✅ مفعّل' : '❌ معطّل', inline: true },
      { name: '🔊 الصوت', value: `${volume}%`, inline: true },
    )
    .setFooter({ text: 'نظام الموسيقى • Opus Bot' })
    .setTimestamp();

  if (track.thumbnail) embed.setThumbnail(track.thumbnail);
  return embed;
}

function buildQueuedEmbed(track: Track, position: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('✅ أُضيفت لقائمة الانتظار')
    .setDescription(`**[${track.title}](${track.url})**`)
    .addFields(
      { name: '⏱️ المدة', value: track.duration, inline: true },
      { name: '📍 الموضع', value: `#${position}`, inline: true },
    )
    .setTimestamp();

  if (track.thumbnail) embed.setThumbnail(track.thumbnail);
  return embed;
}

// ============================================================
//  تشغيل الأغنية التالية في القائمة
// ============================================================
async function playNextTrack(guildId: string): Promise<void> {
  const mp = musicPlayers.get(guildId);
  if (!mp) return;

  mp.lastActivity = Date.now();
  mp.retryCount = 0;

  // إلغاء مؤقت عدم النشاط السابق
  if (mp.inactivityTimer) {
    clearTimeout(mp.inactivityTimer);
    mp.inactivityTimer = null;
  }

  const nextTrack = mp.looping && mp.currentTrack
    ? mp.currentTrack
    : mp.queue.shift();

  if (!nextTrack) {
    mp.currentTrack = null;
    // بدء مؤقت عدم النشاط
    mp.inactivityTimer = setTimeout(() => {
      const cur = musicPlayers.get(guildId);
      if (cur && !cur.currentTrack && cur.queue.length === 0) {
        try {
          cur.connection.destroy();
        } catch {}
        musicPlayers.delete(guildId);
        console.log(`[Music] خرج من الصوتي تلقائياً (عدم نشاط) - ${guildId}`);
      }
    }, INACTIVITY_TIMEOUT);
    return;
  }

  mp.currentTrack = nextTrack;

  try {
    const resource = await createStream(nextTrack, 1);
    resource.volume?.setVolumeLogarithmic(mp.volume / 100);
    mp.player.play(resource);
    mp.connection.subscribe(mp.player);
    console.log(`[Music] ▶ يشغّل: ${nextTrack.title}`);
  } catch (err) {
    console.error('[Music] خطأ في التشغيل:', err);
    mp.retryCount++;

    if (mp.retryCount < MAX_RETRIES) {
      console.log(`[Music] إعادة المحاولة ${mp.retryCount}/${MAX_RETRIES}...`);
      // محاولة بطريقة مختلفة
      try {
        const resource = await createStream(nextTrack, mp.retryCount + 1);
        resource.volume?.setVolumeLogarithmic(mp.volume / 100);
        mp.player.play(resource);
        mp.connection.subscribe(mp.player);
        console.log(`[Music] ✅ نجحت المحاولة ${mp.retryCount + 1}`);
        return;
      } catch (retryErr) {
        console.error(`[Music] فشلت المحاولة ${mp.retryCount + 1}:`, retryErr);
      }
    }

    mp.currentTrack = null;
    // حاول الأغنية التالية بعد تأخير
    setTimeout(() => playNextTrack(guildId), RETRY_DELAY_BASE);
  }
}

// ============================================================
//  إنشاء مشغل جديد للسيرفر
// ============================================================
function createMusicPlayer(
  guildId: string,
  connection: VoiceConnection,
  textChannelId: string,
  voiceChannelId: string
): MusicPlayer {
  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
  });

  const mp: MusicPlayer = {
    connection,
    player,
    queue: [],
    currentTrack: null,
    volume: DEFAULT_VOLUME,
    looping: false,
    textChannelId,
    lastActivity: Date.now(),
    retryCount: 0,
    inactivityTimer: null,
    voiceChannelId,
  };

  musicPlayers.set(guildId, mp);

  // انتهاء الأغنية → تشغيل التالية
  player.on(AudioPlayerStatus.Idle, () => {
    const cur = musicPlayers.get(guildId);
    if (!cur) return;
    setTimeout(() => playNextTrack(guildId), 500);
  });

  // خطأ في المشغل → محاولة التالية
  player.on('error', (err) => {
    console.error('[AudioPlayer] خطأ:', err.message);
    const cur = musicPlayers.get(guildId);
    if (cur) {
      cur.currentTrack = null;
      setTimeout(() => playNextTrack(guildId), RETRY_DELAY_BASE);
    }
  });

  // قطع الاتصال → محاولة إعادة الاتصال
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      try { connection.destroy(); } catch {}
      musicPlayers.delete(guildId);
      console.log(`[Music] تم قطع الاتصال نهائياً - ${guildId}`);
    }
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    const cur = musicPlayers.get(guildId);
    if (cur?.inactivityTimer) clearTimeout(cur.inactivityTimer);
    musicPlayers.delete(guildId);
  });

  return mp;
}

// ============================================================
//  🔍 معرفة الروم الصوتي للمستخدم
// ============================================================
export function getUserVoiceChannel(
  guild: Guild,
  userId: string
): { found: boolean; channelId?: string; channelName?: string } {
  try {
    const member = guild.members.cache.get(userId);
    if (!member) {
      return { found: false };
    }
    const vc = member.voice.channel;
    if (!vc) {
      return { found: false };
    }
    return {
      found: true,
      channelId: vc.id,
      channelName: vc.name,
    };
  } catch {
    return { found: false };
  }
}

// ============================================================
//  🎤 الدخول للصوتي
// ============================================================
export async function joinVoice(
  guild: Guild,
  channelId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      // محاولة fetch
      try {
        const fetched = await guild.channels.fetch(channelId);
        if (!fetched) return { success: false, message: `❌ القناة غير موجودة.` };
      } catch {
        return { success: false, message: `❌ القناة غير موجودة.` };
      }
    }

    const resolved = guild.channels.cache.get(channelId)!;
    if (resolved.type !== ChannelType.GuildVoice && resolved.type !== ChannelType.GuildStageVoice) {
      return { success: false, message: `❌ "${resolved.name}" ليست قناة صوتية.` };
    }

    const existing = getVoiceConnection(guild.id);
    if (existing) {
      if (existing.joinConfig.channelId === channelId) {
        return { success: true, message: `✅ البوت متصل بالفعل في: ${resolved.name}` };
      }
      // انتقال لروم جديد
      try { existing.destroy(); } catch {}
      musicPlayers.delete(guild.id);
    }

    const connection = joinVoiceChannel({
      channelId: resolved.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    } catch {
      try { connection.destroy(); } catch {}
      return { success: false, message: `❌ انتهت مهلة الاتصال بـ "${resolved.name}". تأكد من صلاحيات البوت.` };
    }

    return { success: true, message: `✅ تم الدخول إلى: ${resolved.name}` };
  } catch (err) {
    return { success: false, message: `❌ خطأ في الدخول: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ============================================================
//  👋 الخروج من الصوتي
// ============================================================
export async function leaveVoice(
  guild: Guild
): Promise<{ success: boolean; message: string }> {
  try {
    const mp = musicPlayers.get(guild.id);
    if (mp) {
      mp.queue = [];
      mp.currentTrack = null;
      if (mp.inactivityTimer) clearTimeout(mp.inactivityTimer);
      try { mp.player.stop(true); } catch {}
      try { mp.connection.destroy(); } catch {}
      musicPlayers.delete(guild.id);
      return { success: true, message: '👋 تم الخروج وإيقاف الموسيقى.' };
    }

    const connection = getVoiceConnection(guild.id);
    if (!connection) return { success: true, message: '✅ البوت ليس في أي روم صوتي.' };
    try { connection.destroy(); } catch {}
    return { success: true, message: '👋 تم الخروج من الروم الصوتي.' };
  } catch (err) {
    return { success: false, message: `❌ ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ============================================================
//  📊 حالة الصوت
// ============================================================
export async function getVoiceStatus(
  guild: Guild
): Promise<{ success: boolean; connected: boolean; channelId?: string; channelName?: string; currentTrack?: string }> {
  const connection = getVoiceConnection(guild.id);
  if (!connection) return { success: true, connected: false };
  const chId = connection.joinConfig.channelId;
  if (!chId) return { success: true, connected: false };
  const ch = guild.channels.cache.get(chId);
  const mp = musicPlayers.get(guild.id);
  return {
    success: true,
    connected: true,
    channelId: chId,
    channelName: ch?.name ?? 'غير معروف',
    currentTrack: mp?.currentTrack?.title,
  };
}

// ============================================================
//  🎵 تشغيل موسيقى - الدالة الرئيسية المطورة
// ============================================================
export async function playMusic(
  guild: Guild,
  voiceChannelId: string | null,
  query: string,
  requestedBy: string,
  textChannel?: TextChannel,
  requestingUserId?: string
): Promise<{ success: boolean; message: string; embed?: EmbedBuilder }> {
  try {
    // === الخطوة 1: البحث عن الأغنية ===
    console.log(`[Music] 🔍 البحث عن: "${query}" (طلب: ${requestedBy})`);
    const track = await searchTrack(query, requestedBy);
    if (!track) {
      return {
        success: false,
        message: `❌ لم أجد نتائج لـ: "${query}".\n💡 جرب:\n• كتابة اسم الأغنية بالكامل\n• إضافة اسم الفنان\n• لصق رابط يوتيوب مباشر`,
      };
    }
    console.log(`[Music] ✅ وُجد: ${track.title} | ${track.url}`);

    let mp = musicPlayers.get(guild.id);

    // === الخطوة 2: التأكد من الاتصال الصوتي ===
    if (!mp) {
      const existingConn = getVoiceConnection(guild.id);

      let targetChannelId = voiceChannelId;

      // إذا ما عندنا روم محدد، نحاول نلاقي روم المستخدم
      if (!targetChannelId && requestingUserId) {
        const userVc = getUserVoiceChannel(guild, requestingUserId);
        if (userVc.found && userVc.channelId) {
          targetChannelId = userVc.channelId;
          console.log(`[Music] 🎯 تم اكتشاف روم المستخدم تلقائياً: ${userVc.channelName}`);
        }
      }

      // إذا ما فيه اتصال ولا نعرف الروم
      if (!existingConn && !targetChannelId) {
        return {
          success: false,
          message: '❌ البوت غير موجود في روم صوتي، وأنت أيضاً مب في روم صوتي.\n💡 ادخل أي روم صوتي وقل "شغل" مرة ثانية، أو قل "ادخل الروم [اسم الروم]" أولاً.',
        };
      }

      let connection: VoiceConnection;

      if (existingConn) {
        connection = existingConn;
        // التأكد من أن الاتصال جاهز
        if (connection.state.status !== VoiceConnectionStatus.Ready) {
          try {
            await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
          } catch {
            try { connection.destroy(); } catch {}
            // إعادة المحاولة
            if (targetChannelId) {
              connection = joinVoiceChannel({
                channelId: targetChannelId,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
              });
              await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
            } else {
              return { success: false, message: '❌ فشل إعادة الاتصال بالروم الصوتي.' };
            }
          }
        }
      } else {
        // اتصال جديد
        connection = joinVoiceChannel({
          channelId: targetChannelId!,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });

        try {
          await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
        } catch {
          try { connection.destroy(); } catch {}
          return { success: false, message: '❌ فشل الاتصال بالروم الصوتي. تأكد من صلاحيات البوت.' };
        }
      }

      mp = createMusicPlayer(
        guild.id,
        connection,
        textChannel?.id ?? '',
        targetChannelId || connection.joinConfig.channelId || ''
      );
    }

    // === الخطوة 3: إضافة للقائمة أو تشغيل فوري ===
    if (mp.currentTrack) {
      if (mp.queue.length >= MAX_QUEUE_SIZE) {
        return {
          success: false,
          message: `❌ قائمة الانتظار ممتلئة (الحد الأقصى: ${MAX_QUEUE_SIZE} أغنية).`,
        };
      }

      mp.queue.push(track);
      const embed = buildQueuedEmbed(track, mp.queue.length);
      return {
        success: true,
        message: `✅ أُضيفت لقائمة الانتظار: **${track.title}** (موضع #${mp.queue.length})`,
        embed,
      };
    }

    // تشغيل فوري
    mp.currentTrack = track;
    mp.lastActivity = Date.now();

    try {
      const resource = await createStream(track, 1);
      resource.volume?.setVolumeLogarithmic(mp.volume / 100);
      mp.player.play(resource);
      mp.connection.subscribe(mp.player);

      const embed = buildNowPlayingEmbed(track, mp.queue.length, mp.looping, mp.volume);
      return {
        success: true,
        message: `🎵 يتم تشغيل: **${track.title}** (${track.duration})`,
        embed,
      };
    } catch (streamErr) {
      // محاولة ثانية بطريقة مختلفة
      try {
        const resource = await createStream(track, 2);
        resource.volume?.setVolumeLogarithmic(mp.volume / 100);
        mp.player.play(resource);
        mp.connection.subscribe(mp.player);

        const embed = buildNowPlayingEmbed(track, mp.queue.length, mp.looping, mp.volume);
        return {
          success: true,
          message: `🎵 يتم تشغيل: **${track.title}** (${track.duration})`,
          embed,
        };
      } catch (retryErr) {
        mp.currentTrack = null;
        const msg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        return {
          success: false,
          message: `❌ فشل تشغيل "${track.title}".\n💡 جرب رابط يوتيوب مباشر أو أغنية مختلفة.\nالسبب: ${msg.slice(0, 200)}`,
        };
      }
    }
  } catch (err) {
    return {
      success: false,
      message: `❌ خطأ في نظام الموسيقى: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ============================================================
//  ⏸️ إيقاف مؤقت
// ============================================================
export function pauseMusic(guildId: string): { success: boolean; message: string } {
  const mp = musicPlayers.get(guildId);
  if (!mp?.currentTrack) return { success: false, message: '❌ لا توجد أغنية تعزف الآن.' };
  if (mp.player.state.status === AudioPlayerStatus.Paused)
    return { success: true, message: '⏸️ الموسيقى متوقفة مؤقتاً بالفعل.' };
  mp.player.pause();
  return { success: true, message: `⏸️ تم الإيقاف المؤقت: **${mp.currentTrack.title}**` };
}

// ============================================================
//  ▶️ استئناف
// ============================================================
export function resumeMusic(guildId: string): { success: boolean; message: string } {
  const mp = musicPlayers.get(guildId);
  if (!mp) return { success: false, message: '❌ لا توجد أغنية.' };
  if (mp.player.state.status !== AudioPlayerStatus.Paused)
    return { success: true, message: '▶️ الموسيقى تعزف بالفعل.' };
  mp.player.unpause();
  return { success: true, message: `▶️ تم الاستئناف: **${mp.currentTrack?.title ?? ''}**` };
}

// ============================================================
//  ⏭️ تخطي
// ============================================================
export function skipMusic(guildId: string): { success: boolean; message: string } {
  const mp = musicPlayers.get(guildId);
  if (!mp?.currentTrack) return { success: false, message: '❌ لا توجد أغنية لتخطيها.' };
  const skipped = mp.currentTrack.title;
  mp.looping = false; // إلغاء التكرار عند التخطي
  mp.player.stop();
  return { success: true, message: `⏭️ تم التخطي: **${skipped}**` };
}

// ============================================================
//  ⏹️ إيقاف كلي
// ============================================================
export function stopMusic(guildId: string): { success: boolean; message: string } {
  const mp = musicPlayers.get(guildId);
  if (!mp) return { success: false, message: '❌ لا توجد موسيقى.' };
  mp.queue = [];
  mp.currentTrack = null;
  mp.looping = false;
  if (mp.inactivityTimer) clearTimeout(mp.inactivityTimer);
  try { mp.player.stop(true); } catch {}
  try { mp.connection.destroy(); } catch {}
  musicPlayers.delete(guildId);
  return { success: true, message: '⏹️ تم إيقاف الموسيقى وتفريغ القائمة والخروج من الروم.' };
}

// ============================================================
//  🔊 ضبط الصوت
// ============================================================
export function setVolume(guildId: string, volume: number): { success: boolean; message: string } {
  if (volume < 0 || volume > 200)
    return { success: false, message: '❌ الصوت يجب أن يكون بين 0 و200.' };
  const mp = musicPlayers.get(guildId);
  if (!mp) return { success: false, message: '❌ لا توجد موسيقى تعزف.' };
  mp.volume = volume;
  try {
    const state = mp.player.state as any;
    state.resource?.volume?.setVolumeLogarithmic(volume / 100);
  } catch {}
  const icon = volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊';
  return { success: true, message: `${icon} الصوت الآن: **${volume}%**` };
}

// ============================================================
//  🔁 تكرار
// ============================================================
export function toggleLoop(guildId: string): { success: boolean; message: string } {
  const mp = musicPlayers.get(guildId);
  if (!mp) return { success: false, message: '❌ لا توجد موسيقى تعزف.' };
  mp.looping = !mp.looping;
  return {
    success: true,
    message: mp.looping
      ? `🔁 تم تفعيل التكرار: **${mp.currentTrack?.title ?? 'الأغنية الحالية'}**`
      : '➡️ تم إلغاء التكرار.',
  };
}

// ============================================================
//  📋 قائمة الانتظار
// ============================================================
export function getQueue(guildId: string): { success: boolean; message: string; embed?: EmbedBuilder } {
  const mp = musicPlayers.get(guildId);
  if (!mp || (!mp.currentTrack && mp.queue.length === 0))
    return { success: true, message: '📋 قائمة الانتظار فارغة. لا يوجد شيء يعزف.' };

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📋 قائمة الانتظار')
    .setTimestamp();

  if (mp.currentTrack) {
    embed.addFields({
      name: '🎵 يعزف الآن',
      value: `**[${mp.currentTrack.title}](${mp.currentTrack.url})** • ${mp.currentTrack.duration}`,
    });
  }

  if (mp.queue.length > 0) {
    const list = mp.queue
      .slice(0, 15)
      .map((t, i) => `**${i + 1}.** [${t.title}](${t.url}) • ${t.duration}`)
      .join('\n');

    let queueText = list.slice(0, 1024);
    if (mp.queue.length > 15) {
      queueText += `\n... و${mp.queue.length - 15} أغنية أخرى`;
    }

    embed.addFields({
      name: `📋 التالي (${mp.queue.length})`,
      value: queueText,
    });
  }

  const statusParts: string[] = [];
  if (mp.looping) statusParts.push('🔁 التكرار مفعّل');
  statusParts.push(`🔊 ${mp.volume}%`);
  embed.addFields({ name: '⚙️ الإعدادات', value: statusParts.join(' | '), inline: false });

  return {
    success: true,
    message: `🎵 يعزف الآن: ${mp.currentTrack?.title ?? 'لا شيء'} | في القائمة: ${mp.queue.length} أغنية`,
    embed,
  };
}

// ============================================================
//  🔀 خلط القائمة
// ============================================================
export function shuffleQueue(guildId: string): { success: boolean; message: string } {
  const mp = musicPlayers.get(guildId);
  if (!mp) return { success: false, message: '❌ لا توجد موسيقى.' };
  if (mp.queue.length < 2) return { success: false, message: '❌ القائمة قصيرة جداً للخلط.' };

  // خوارزمية Fisher-Yates
  for (let i = mp.queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mp.queue[i], mp.queue[j]] = [mp.queue[j], mp.queue[i]];
  }

  return { success: true, message: `🔀 تم خلط قائمة الانتظار (${mp.queue.length} أغنية).` };
}

// ============================================================
//  ❌ حذف أغنية من القائمة
// ============================================================
export function removeFromQueue(guildId: string, index: number): { success: boolean; message: string } {
  const mp = musicPlayers.get(guildId);
  if (!mp) return { success: false, message: '❌ لا توجد موسيقى.' };

  const realIndex = index - 1; // المستخدم يدخل 1-based
  if (realIndex < 0 || realIndex >= mp.queue.length) {
    return { success: false, message: `❌ الموضع غير صالح. القائمة تحتوي على ${mp.queue.length} أغنية.` };
  }

  const removed = mp.queue.splice(realIndex, 1)[0];
  return { success: true, message: `🗑️ تم حذف: **${removed.title}** من قائمة الانتظار.` };
}

// ============================================================
//  🎵 الأغنية الحالية
// ============================================================
export function getNowPlaying(guildId: string): { success: boolean; message: string; track?: Track; embed?: EmbedBuilder } {
  const mp = musicPlayers.get(guildId);
  if (!mp?.currentTrack) {
    return { success: true, message: '🔇 لا يوجد شيء يعزف الآن.' };
  }

  const embed = buildNowPlayingEmbed(mp.currentTrack, mp.queue.length, mp.looping, mp.volume);
  return {
    success: true,
    message: `🎵 يعزف الآن: **${mp.currentTrack.title}** (${mp.currentTrack.duration})`,
    track: mp.currentTrack,
    embed,
  };
}
