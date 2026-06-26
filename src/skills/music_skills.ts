/**
 * ════════════════════════════════════════════════════════════════
 *                   🎵 MUSIC SKILLS ENGINE - مكتبة الموسيقى
 * ════════════════════════════════════════════════════════════════
 * مكتبة متقدمة لإدارة الموسيقى والمقاطع والبحث والتشغيل الذكي
 */

import axios, { AxiosInstance } from 'axios';
import { EmbedBuilder, VoiceChannel, TextChannel } from 'discord.js';

interface MusicQuery {
  type: 'song' | 'artist' | 'playlist' | 'url';
  query: string;
  source?: 'youtube' | 'spotify' | 'soundcloud';
  dialect?: string;
  requestingUserId: string;
  voiceChannelId: string;
}

interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  thumbnail?: string;
  source: string;
  lyrics?: string;
}

interface PlaylistData {
  id: string;
  name: string;
  tracks: TrackInfo[];
  totalDuration: number;
  creator: string;
}

/**
 * فئة MusicIntelligence: نظام متقدم للبحث والتشغيل الذكي
 */
export class MusicIntelligence {
  private youtubeApiKey: string;
  private spotifyApiKey: string;
  private cache: Map<string, TrackInfo[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 3600000; // ساعة واحدة
  private httpClient: AxiosInstance;

  constructor(youtubeKey: string, spotifyKey: string) {
    this.youtubeApiKey = youtubeKey;
    this.spotifyApiKey = spotifyKey;
    this.httpClient = axios.create({
      timeout: 10000,
      headers: { 'User-Agent': 'HumanGuardAI-MusicBot/1.0' }
    });
  }

  /**
   * تحليل وفهم طلب الموسيقى بذكاء
   * 1. التحقق من نوع الطلب (رابط مباشر أم اسم أغنية)
   * 2. استخراج كلمات مفتاحية
   * 3. البحث الذكي عن الأغنية المطابقة
   */
  async analyzeAndSearch(query: MusicQuery): Promise<TrackInfo[]> {
    console.log(`[MusicIntelligence] Analyzing query: "${query.query}"`);

    // الخطوة 1: التحقق من أنه رابط مباشر
    if (this.isDirectUrl(query.query)) {
      console.log('[MusicIntelligence] Direct link detected');
      return await this.extractTrackFromUrl(query.query);
    }

    // الخطوة 2: البحث في الذاكرة المؤقتة
    const cacheKey = `${query.query.toLowerCase()}_${query.source || 'youtube'}`;
    if (this.cache.has(cacheKey)) {
      const expiryTime = this.cacheExpiry.get(cacheKey);
      if (expiryTime && expiryTime > Date.now()) {
        console.log('[MusicIntelligence] Cache hit');
        return this.cache.get(cacheKey)!;
      }
      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
    }

    // الخطوة 3: البحث عبر المصادر المختلفة
    let results: TrackInfo[] = [];
    
    try {
      if (query.source === 'youtube' || !query.source) {
        results = await this.searchYoutube(query.query);
      } else if (query.source === 'spotify') {
        results = await this.searchSpotify(query.query);
      }

      // حفظ النتائج في الذاكرة المؤقتة
      this.cache.set(cacheKey, results);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      console.log(`[MusicIntelligence] Found ${results.length} results`);
      return results;
    } catch (error) {
      console.error('[MusicIntelligence] Search error:', error);
      return [];
    }
  }

  /**
   * البحث عن أغنية في يوتيوب بذكاء
   * مع فحص النتائج والتحقق من الجودة
   */
  async searchYoutube(query: string): Promise<TrackInfo[]> {
    try {
      const response = await this.httpClient.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: 5,
          key: this.youtubeApiKey,
          order: 'relevance'
        }
      });

      const tracks: TrackInfo[] = [];
      for (const item of response.data.items || []) {
        const videoId = item.id.videoId;
        const details = await this.getYoutubeVideoDetails(videoId);
        
        if (details) {
          tracks.push({
            id: videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            duration: this.parseDuration(details.duration),
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnail: item.snippet.thumbnails.default?.url,
            source: 'youtube'
          });
        }
      }

      return tracks;
    } catch (error) {
      console.error('[MusicIntelligence] YouTube search error:', error);
      return [];
    }
  }

  /**
   * الحصول على تفاصيل الفيديو من يوتيوب
   */
  async getYoutubeVideoDetails(videoId: string): Promise<any> {
    try {
      const response = await this.httpClient.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'contentDetails,statistics',
          id: videoId,
          key: this.youtubeApiKey
        }
      });

      return response.data.items?.[0]?.contentDetails;
    } catch (error) {
      console.error('[MusicIntelligence] Video details error:', error);
      return null;
    }
  }

  /**
   * البحث عن أغنية في Spotify
   */
  async searchSpotify(query: string): Promise<TrackInfo[]> {
    try {
      const response = await this.httpClient.get('https://api.spotify.com/v1/search', {
        params: {
          q: query,
          type: 'track',
          limit: 5
        },
        headers: {
          'Authorization': `Bearer ${this.spotifyApiKey}`
        }
      });

      const tracks: TrackInfo[] = [];
      for (const item of response.data.tracks?.items || []) {
        tracks.push({
          id: item.id,
          title: item.name,
          artist: item.artists[0]?.name || 'Unknown',
          duration: Math.floor(item.duration_ms / 1000),
          url: item.external_urls.spotify,
          thumbnail: item.album.images[0]?.url,
          source: 'spotify'
        });
      }

      return tracks;
    } catch (error) {
      console.error('[MusicIntelligence] Spotify search error:', error);
      return [];
    }
  }

  /**
   * استخراج معلومات المقطع من الرابط المباشر
   */
  async extractTrackFromUrl(url: string): Promise<TrackInfo[]> {
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = this.extractYoutubeId(url);
        const details = await this.getYoutubeVideoDetails(videoId);
        
        if (details) {
          return [{
            id: videoId,
            title: 'مقطع من يوتيوب',
            artist: 'Unknown',
            duration: this.parseDuration(details.duration),
            url: url,
            source: 'youtube'
          }];
        }
      }

      return [];
    } catch (error) {
      console.error('[MusicIntelligence] Link info extraction error:', error);
      return [];
    }
  }

  /**
   * التحقق من أن النص هو رابط مباشر
   */
  private isDirectUrl(query: string): boolean {
    return /https?:\/\/(www\.)?(youtube\.com|youtu\.be|spotify\.com|soundcloud\.com)/.test(query);
  }

  /**
   * استخراج معرف الفيديو من رابط يوتيوب
   */
  private extractYoutubeId(url: string): string {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\&\n\r]+)/);
    return match ? match[1] : '';
  }

  /**
   * تحويل صيغة المدة من ISO 8601 إلى ثوان
   */
  private parseDuration(duration: string): number {
    const regex = /PT(\d+H)?(\d+M)?(\d+S)?/;
    const matches = duration.match(regex);
    
    const hours = parseInt(matches?.[1] || '0') || 0;
    const minutes = parseInt(matches?.[2] || '0') || 0;
    const seconds = parseInt(matches?.[3] || '0') || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * بناء Embed جميل لعرض معلومات المقطع
   */
  buildTrackEmbed(track: TrackInfo, requestingUser: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle(`🎵 ${track.title}`)
      .setDescription(`الفنان: **${track.artist}**`)
      .addFields(
        { name: 'المدة', value: this.formatDuration(track.duration), inline: true },
        { name: 'المصدر', value: track.source.toUpperCase(), inline: true },
        { name: 'طلب من', value: `<@${requestingUser}>`, inline: true }
      );

    if (track.thumbnail) {
      embed.setThumbnail(track.thumbnail);
    }

    if (track.url) {
      embed.setURL(track.url);
    }

    return embed;
  }

  /**
   * تنسيق المدة لعرض سهل القراءة
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * إنشاء قائمة تشغيل
   */
  async createPlaylist(name: string, tracks: TrackInfo[], creator: string): Promise<PlaylistData> {
    const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
    
    return {
      id: `pl_${Date.now()}`,
      name,
      tracks,
      totalDuration,
      creator
    };
  }

  /**
   * تنظيف الذاكرة المؤقتة القديمة
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (expiry < now) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
    console.log('[MusicIntelligence] Cache cleaned');
  }
}

export default MusicIntelligence;
