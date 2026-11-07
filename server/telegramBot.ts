import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { userTracker, CAMBODIA_PROVINCES } from './userTracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, '..', 'telegram-config.json');

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}

export interface TelegramLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'message' | 'photo' | 'voice' | 'error' | 'success';
  sender?: string;
  text: string;
}

interface TelegramConfig {
  token: string;
  mode: 'polling' | 'webhook';
  autoStart: boolean;
}

class TelegramBotManager {
  private token: string = '';
  private mode: 'polling' | 'webhook' = 'polling';
  private botInfo: TelegramBotInfo | null = null;
  private isPolling: boolean = false;
  private pollingAbortController: AbortController | null = null;
  private lastUpdateId: number = 0;
  private updatesProcessed: number = 0;
  private lastActive: string = '';
  private logs: TelegramLogEntry[] = [];
  private aiCaller: ((prompt: string, imageBase64?: string, audioBase64?: string) => Promise<string>) | null = null;
  private ttsCaller: ((text: string) => Promise<Buffer | null>) | null = null;
  private lastReplies: Map<string, string> = new Map();
  private processedMessageIds: Set<string> = new Set();
  private processedUpdateIds: Set<number> = new Set();

  constructor() {
    this.loadConfig();
  }

  public setAiCaller(caller: (prompt: string, imageBase64?: string, audioBase64?: string) => Promise<string>) {
    this.aiCaller = caller;
  }

  public setTtsCaller(caller: (text: string) => Promise<Buffer | null>) {
    this.ttsCaller = caller;
  }

  private loadConfig() {
    try {
      // 1. Check environment variable first
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'MY_TELEGRAM_BOT_TOKEN') {
        this.token = process.env.TELEGRAM_BOT_TOKEN.trim();
      }

      // 2. Check local saved config file
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const cfg: TelegramConfig = JSON.parse(raw);
        if (cfg.token) {
          this.token = cfg.token.trim();
        }
        if (cfg.mode) {
          this.mode = cfg.mode;
        }
      }
    } catch (err) {
      console.warn('Could not read telegram-config.json:', err);
    }
  }

  public saveConfig(token: string, mode: 'polling' | 'webhook' = 'polling') {
    this.token = token.trim();
    this.mode = mode;
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({
        token: this.token,
        mode: this.mode,
        autoStart: true,
        updatedAt: new Date().toISOString()
      }, null, 2));
    } catch (err) {
      console.error('Failed to save telegram-config.json:', err);
    }
  }

  public addLog(type: TelegramLogEntry['type'], text: string, sender?: string) {
    const entry: TelegramLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      sender,
      text
    };
    this.logs.unshift(entry);
    if (this.logs.length > 50) {
      this.logs.pop();
    }
    console.log(`[TelegramBot] [${type.toUpperCase()}] ${sender ? `(${sender}) ` : ''}${text}`);
  }

  public getStatus() {
    return {
      configured: Boolean(this.token),
      connected: Boolean(this.botInfo),
      botInfo: this.botInfo,
      mode: this.mode,
      isPolling: this.isPolling,
      updatesProcessed: this.updatesProcessed,
      lastActive: this.lastActive,
      logs: this.logs.slice(0, 20),
      tokenMasked: this.token ? `${this.token.slice(0, 6)}...${this.token.slice(-4)}` : ''
    };
  }

  // Verify token with Telegram API
  public async verifyToken(tokenToTest = this.token): Promise<{ success: boolean; botInfo?: TelegramBotInfo; error?: string }> {
    if (!tokenToTest) {
      return { success: false, error: 'មិនទាន់មាន Bot Token ទេ' };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${tokenToTest}/getMe`);
      const data = await res.json();
      if (data.ok && data.result) {
        this.botInfo = data.result;
        // Automatically sync bot name to LASEDIII_Help_Bot on Telegram servers
        this.updateProfileOnTelegram().catch(() => {});
        return { success: true, botInfo: data.result };
      } else {
        return { success: false, error: data.description || 'Bot Token មិនត្រឹមត្រូវ' };
      }
    } catch (err: any) {
      return { success: false, error: 'មិនអាចតភ្ជាប់ទៅ Telegram API: ' + err.message };
    }
  }

  // Sync bot name & description directly to Telegram Bot API
  public async updateProfileOnTelegram(name: string = 'LASEDIII_Help_Bot'): Promise<void> {
    if (!this.token) return;
    try {
      // 1. Update Display Name in Telegram app (chats, headers, bot profile)
      const nameRes = await fetch(`https://api.telegram.org/bot${this.token}/setMyName`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const nameData = await nameRes.json();
      console.log('Telegram setMyName result:', nameData);

      // 2. Update About / Description on Telegram
      await fetch(`https://api.telegram.org/bot${this.token}/setMyDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: '🌾 LASEDIII_Help_Bot ជំនួយការកសិកម្មឆ្លាតវៃសម្រាប់កសិករគម្រោង LASED III ក្នុងការដោះស្រាយបញ្ហាបច្ចេកទេសដាំដុះ (ស្រូវ, បន្លែ, កៅស៊ូ, ចន្ទី) និងចិញ្ចឹមសត្វ (គោ, ក្របី, ជ្រូក, មាន់ទា, ត្រី) តាមរយៈ Chat, Voice និងថតរូបវិភាគជំងឺភ្លាមៗ។'
        })
      });

      // 3. Update Short Description
      await fetch(`https://api.telegram.org/bot${this.token}/setMyShortDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          short_description: 'LASEDIII_Help_Bot - ជំនួយការកសិកម្ម និងបសុសត្វឆ្លាតវៃគម្រោង LASED III'
        })
      });
    } catch (e: any) {
      console.warn('Could not update profile on Telegram:', e?.message || e);
    }
  }

  // Send message to Telegram chat
  public async sendMessage(chatId: number | string, text: string, replyMarkup?: any): Promise<boolean> {
    if (!this.token) return false;

    try {
      const payload: any = {
        chat_id: chatId,
        text: text,
      };

      if (replyMarkup) {
        payload.reply_markup = replyMarkup;
      }

      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.ok) {
        console.warn('Failed to sendMessage to Telegram:', data.description);
      }
      return data.ok;
    } catch (err: any) {
      console.warn('Error sending Telegram message:', err?.message || err);
      return false;
    }
  }

  // Send native voice note or audio message to Telegram
  public async sendVoice(chatId: number | string, audioBuffer: Buffer, caption?: string): Promise<boolean> {
    if (!this.token) return false;
    try {
      // 1. Try sendVoice (renders as Telegram native playable voice message with waveform)
      const form = new FormData();
      form.append('chat_id', String(chatId));
      const voiceBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/ogg' });
      form.append('voice', voiceBlob, 'voice.ogg');
      if (caption) form.append('caption', caption.slice(0, 1000));

      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendVoice`, {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      if (data.ok) return true;

      // 2. Fallback to sendAudio with wav format
      const audioForm = new FormData();
      audioForm.append('chat_id', String(chatId));
      const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });
      audioForm.append('audio', audioBlob, 'response.wav');
      audioForm.append('title', 'ចម្លើយបច្ចេកទេស LASEDIII');
      audioForm.append('performer', 'LASEDIII_Help_Bot');
      if (caption) audioForm.append('caption', caption.slice(0, 1000));

      const resAudio = await fetch(`https://api.telegram.org/bot${this.token}/sendAudio`, {
        method: 'POST',
        body: audioForm
      });
      const audioData = await resAudio.json();
      return audioData.ok;
    } catch (err: any) {
      console.warn('Error sending voice to Telegram:', err?.message || err);
      return false;
    }
  }

  // Send chat action (e.g. typing, upload_photo, record_voice)
  public async sendChatAction(chatId: number | string, action: 'typing' | 'upload_photo' | 'record_voice') {
    if (!this.token) return;
    try {
      await fetch(`https://api.telegram.org/bot${this.token}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action })
      });
    } catch (_) {}
  }

  // Download a file from Telegram (photo or voice note) and return base64
  private async downloadFileAsBase64(fileId: string): Promise<{ base64: string; mimeType: string } | null> {
    if (!this.token) return null;
    try {
      const getFileRes = await fetch(`https://api.telegram.org/bot${this.token}/getFile?file_id=${fileId}`);
      const fileData = await getFileRes.json();
      if (!fileData.ok || !fileData.result?.file_path) {
        return null;
      }

      const filePath = fileData.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${this.token}/${filePath}`;
      const downloadRes = await fetch(fileUrl);
      const arrayBuffer = await downloadRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');

      let mimeType = 'image/jpeg';
      if (filePath.endsWith('.png')) mimeType = 'image/png';
      else if (filePath.endsWith('.webp')) mimeType = 'image/webp';
      else if (filePath.endsWith('.oga') || filePath.endsWith('.ogg')) mimeType = 'audio/ogg';
      else if (filePath.endsWith('.mp3')) mimeType = 'audio/mp3';

      return { base64, mimeType };
    } catch (err: any) {
      console.warn('Error downloading file from Telegram:', err?.message || err);
      return null;
    }
  }

  // Start Telegram Long Polling loop
  public async startPolling(): Promise<{ success: boolean; message: string }> {
    if (!this.token) {
      return { success: false, message: 'សូមបញ្ចូល Telegram Bot Token ជាមុនសិន' };
    }

    if (this.isPolling) {
      return { success: true, message: 'Bot កំពុងដំណើរការ Polling រួចរាល់ហើយ' };
    }

    const verification = await this.verifyToken();
    if (!verification.success) {
      this.addLog('error', `Token មិនត្រឹមត្រូវ: ${verification.error}`);
      return { success: false, message: `Token មិនត្រឹមត្រូវ: ${verification.error}` };
    }

    try {
      // Must delete webhook before polling can work
      await fetch(`https://api.telegram.org/bot${this.token}/deleteWebhook`);
      this.addLog('info', `បានលុប Webhook ចាស់ ដើម្បីដំណើរការ Long Polling`);
    } catch (e) {
      console.warn('deleteWebhook failed:', e);
    }

    this.isPolling = true;
    this.mode = 'polling';
    this.pollingAbortController = new AbortController();
    this.addLog('success', `ចាប់ផ្តើមដំណើរការ Bot @${this.botInfo?.username} លើ Telegram!`);

    // Ensure bot name on Telegram servers is synchronized to LASEDIII_Help_Bot
    this.updateProfileOnTelegram().catch(() => {});

    this.runPollingLoop();
    return { success: true, message: `Bot @${this.botInfo?.username} បានតភ្ជាប់ និងចាប់ផ្តើមដំណើរការជោគជ័យ!` };
  }

  public stopPolling() {
    this.isPolling = false;
    if (this.pollingAbortController) {
      this.pollingAbortController.abort();
      this.pollingAbortController = null;
    }
    this.addLog('info', 'បានបញ្ឈប់ការ Polling');
  }

  // Polling loop
  private async runPollingLoop() {
    while (this.isPolling) {
      try {
        const timeout = 25;
        const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=${timeout}`;
        
        const res = await fetch(url, {
          signal: this.pollingAbortController?.signal
        });

        if (!res.ok) {
          console.warn(`Telegram getUpdates returned ${res.status}`);
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            await this.processIncomingUpdate(update);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          break;
        }
        console.warn('Polling notice:', err?.message || err);
        await new Promise(r => setTimeout(r, 4000));
      }
    }
  }

  // Process a single Telegram update (used by both Polling and Webhook)
  public async processIncomingUpdate(update: any) {
    if (update?.update_id) {
      if (this.processedUpdateIds.has(update.update_id)) return;
      this.processedUpdateIds.add(update.update_id);
      if (this.processedUpdateIds.size > 300) {
        const first = this.processedUpdateIds.values().next().value;
        if (first !== undefined) this.processedUpdateIds.delete(first);
      }
    }

    // 0. Handle Inline Button Callback Queries (e.g. Listen Audio button)
    if (update?.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const data = cb.data;
      const senderName = cb.from?.first_name || 'កសិករ';

      try {
        await fetch(`https://api.telegram.org/bot${this.token}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: cb.id,
            text: '🔊 កំពុងរៀបចំសម្លេងបច្ចេកទេស...'
          })
        });
      } catch (_) {}

      if (data === 'tts_listen' && chatId) {
        const textToSpeak = this.lastReplies.get(String(chatId)) || cb.message?.text || '';
        if (textToSpeak && this.ttsCaller) {
          this.addLog('voice', 'កសិករបានចុចប៊ូតុងស្តាប់សម្លេង', senderName);
          await this.sendChatAction(chatId, 'record_voice');
          const audioBuf = await this.ttsCaller(textToSpeak);
          if (audioBuf) {
            await this.sendVoice(chatId, audioBuf, '🔊 សម្លេងបច្ចេកទេស LASEDIII_Help_Bot');
            this.addLog('success', 'បានផ្ញើសារសម្លេងជូនកសិកររួចរាល់', senderName);
          } else {
            await this.sendMessage(chatId, '🔊 សូមអភ័យទោស មិនអាចចាក់សម្លេងបានទេនៅពេលនេះ សូមអានខ្លឹមសារជាអក្សរ។');
          }
        }
      }
      return;
    }

    const message = update?.message || update?.channel_post;
    if (!message) return;

    const chatId = message.chat?.id;
    if (chatId && message.message_id) {
      const msgKey = `${chatId}_${message.message_id}`;
      if (this.processedMessageIds.has(msgKey)) return;
      this.processedMessageIds.add(msgKey);
      if (this.processedMessageIds.size > 300) {
        const first = this.processedMessageIds.values().next().value;
        if (first !== undefined) this.processedMessageIds.delete(first);
      }
    }

    this.updatesProcessed++;
    this.lastActive = new Date().toISOString();

    const senderName = message.from?.first_name || message.chat?.title || 'កសិករ';
    const senderId = `tg_${message.from?.id || chatId}`;
    const username = message.from?.username ? `@${message.from.username}` : undefined;

    // Track user session and activity in Admin Tracker
    userTracker.recordUserActivity(
      {
        id: senderId,
        platform: 'telegram',
        name: senderName,
        username: username
      },
      message.location ? 'location_share' : (message.photo ? 'photo_diagnosis' : (message.voice || message.audio ? 'voice_query' : 'message')),
      text || (message.photo ? 'រូបភាពស្កេនជំងឺ' : (message.location ? 'ទីតាំង GPS' : 'សារសម្លេង')),
      message.photo ? 'crop' : 'general'
    );

    // Standard Quick Reply Keyboard with native GPS Location sharing button
    const standardKeyboard = {
      keyboard: [
        [{ text: '📍 ផ្ញើទីតាំងកសិដ្ឋាន (GPS)', request_location: true }, { text: '🔊 ស្តាប់សម្លេងចុងក្រោយ' }],
        [{ text: '🌾 ដំណាំស្រូវ' }, { text: '🥬 ដំណាំបន្លែ' }],
        [{ text: '🌳 ដំណាំកៅស៊ូ' }, { text: '🥜 ដំណាំចន្ទី' }],
        [{ text: '🐂 គោ និងក្របី' }, { text: '🐖 ជ្រូក' }],
        [{ text: '🐔 មាន់ទា' }, { text: '🐟 ត្រី' }],
        [{ text: '📸 របៀបថតរូបស្កេនជំងឺ' }, { text: 'ℹ️ អំពីគម្រោង LASED III' }]
      ],
      resize_keyboard: true,
      persistent: true
    };

    // Handle Native GPS Location sent by farmer
    if (message.location) {
      const { latitude, longitude, horizontal_accuracy } = message.location;
      const loc = userTracker.recordLocation(
        senderId,
        latitude,
        longitude,
        'telegram_gps',
        horizontal_accuracy,
        { name: senderName, username, platform: 'telegram' }
      );
      this.addLog('info', `បានចាប់ទីតាំង GPS: ខេត្ត${loc.province} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`, senderName);

      const isTarget = loc.isTargetProvince;
      const replyLocation = `📍 **បានកត់ត្រាទីតាំងកសិដ្ឋានដោយជោគជ័យ!** 🙏\n\n` +
        `🏡 ទីតាំងកសិដ្ឋាន៖ **ខេត្ត${loc.province}** ${isTarget ? '(ខេត្តគោលដៅអនុវត្តគម្រោង LASED III ✅)' : '(ក្រៅខេត្តគោលដៅ)'}\n` +
        `🌐 កូអរដោនេ GPS៖ \`${latitude.toFixed(4)}, ${longitude.toFixed(4)}\` (កម្រិតលម្អិត: ±${horizontal_accuracy ? Math.round(horizontal_accuracy) : 10}m)\n\n` +
        `🌾 អរគុណកសិករ **${senderName}**! ប្រព័ន្ធ AI និងមន្ត្រីបច្ចេកទេសគម្រោង LASED III (MLMUPC & MAFF) បានកត់ត្រាទីតាំងក្នុងផ្ទាំងគ្រប់គ្រង Admin រួចរាល់ហើយ ដើម្បីងាយស្រួលផ្តល់ការគាំទ្របច្ចេកទេស និងព័ត៌មានអាកាសធាតុស្របតាមតំបន់ជាក់ស្តែងរបស់លោកអ្នក!`;

      this.lastReplies.set(String(chatId), replyLocation);
      await this.sendMessage(chatId, replyLocation, standardKeyboard);
      return;
    }

    // Auto-detect target province mention in text if user has not sent GPS yet
    if (text) {
      for (const prov of CAMBODIA_PROVINCES) {
        if (text.includes(prov.nameKh)) {
          userTracker.assignProvince(senderId, prov.nameKh, { name: senderName, platform: 'telegram' });
          break;
        }
      }
    }

    const listenInlineMarkup = {
      inline_keyboard: [
        [{ text: '🔊 ចុចស្តាប់សម្លេង (Listen Audio)', callback_data: 'tts_listen' }]
      ]
    };

    // 1. Handle Commands & Special Actions
    if (text.startsWith('/start')) {
      this.addLog('message', `ចុច /start`, senderName);
      const welcome = `🌾 ជំរាបសួរ ${senderName}! 🙏\n\nខ្ញុំជា **LASEDIII_Help_Bot** ជំនួយការកសិកម្មឆ្លាតវៃសម្រាប់កសិករ គម្រោងបែងចែកដីដើម្បីសង្គមកិច្ច និងការអភិវឌ្ឍសេដ្ឋកិច្ច ដំណាក់កាលទី៣ (LASED III) ដឹកនាំដោយក្រសួងរៀបចំដែនដី នគរូបនីយកម្ម និងសំណង់ (MLMUPC) និងសហការអនុវត្តដោយ ក្រសួងកសិកម្ម រុក្ខាប្រមាញ់ និងនេសាទ (MAFF) ក្រោមការគាំទ្រហិរញ្ញវត្ថុពីធនាគារពិភពលោក (World Bank)។\n\nខ្ញុំអាចជួយដោះស្រាយបញ្ហាបច្ចេកទេសជូនលោកអ្នកលើ៖\n🌱 **ដំណាំ ៤ មុខ៖** ស្រូវ, បន្លែ, កៅស៊ូ, ចន្ទី\n🐂 **សត្វចិញ្ចឹម ៥ មុខ៖** គោ, ក្របី, ជ្រូក, មាន់ទា, ត្រី\n\n💡 **របៀបប្រើប្រាស់ងាយៗ៖**\n- 💬 វាយសួរសំណួរ ឬជ្រើសរើសប្រធានបទខាងក្រោម\n- 🎙️ ចុចមីក្រូហ្វូនផ្ញើសារជាសម្លេង\n- 📸 ថតរូបស្លឹកដំណាំ ឬសត្វឈឺផ្ញើមក ដើម្បីឱ្យខ្ញុំវិភាគជំងឺ និងរកវិធីព្យាបាលភ្លាមៗ!\n- 🔊 រាល់ចម្លើយមានប៊ូតុង "ចុចស្តាប់សម្លេង" ដើម្បីចាក់ស្តាប់ផ្ទាល់ក្នុង Telegram!`;
      this.lastReplies.set(String(chatId), welcome);
      await this.sendMessage(chatId, welcome, standardKeyboard);
      return;
    }

    if (text === 'ℹ️ អំពីគម្រោង LASED III') {
      const about = `ℹ️ **អំពីគម្រោង LASED III**\n\nគម្រោងបែងចែកដីដើម្បីសង្គមកិច្ច និងការអភិវឌ្ឍសេដ្ឋកិច្ច ដំណាក់កាលទី៣ (LASED III) ដឹកនាំដោយក្រសួងរៀបចំដែនដី នគរូបនីយកម្ម និងសំណង់ (MLMUPC) និងសហការអនុវត្តដោយ ក្រសួងកសិកម្ម រុក្ខាប្រមាញ់ និងនេសាទ (MAFF) ក្រោមការគាំទ្រហិរញ្ញវត្ថុពីធនាគារពិភពលោក (World Bank)។\n\n📍 **ខេត្តគោលដៅចំនួន ១៤ រួមមាន៖**\nខេត្តកំពង់ឆ្នាំង, បាត់ដំបង, បន្ទាយមានជ័យ, ឧត្តរមានជ័យ, ក្រចេះ, ស្ទឹងត្រែង, រតនគិរី, មណ្ឌលគិរី, កំពង់ធំ, ត្បូងឃ្មុំ, កំពង់ស្ពឺ, ព្រះសីហនុ, កំពត, និងកែប។\n\nជំនួយការ AI នេះដំណើរការ ២៤/៧ ដើម្បីជួយកសិករឱ្យទទួលបានបច្ចេកទេសកសិកម្មទំនើប និងដោះស្រាយជំងឺដំណាំសត្វទាន់ពេលវេលា។`;
      this.lastReplies.set(String(chatId), about);
      await this.sendMessage(chatId, about, listenInlineMarkup);
      return;
    }

    // Direct Voice Listening Request
    if (text === '🔊 ស្តាប់សម្លេងចុងក្រោយ' || text === '/voice' || text === '/listen' || text === 'ស្តាប់' || text === 'ស្តាប់សម្លេង' || text === 'ចាក់សម្លេង') {
      const lastText = this.lastReplies.get(String(chatId));
      if (!lastText) {
        await this.sendMessage(chatId, 'លោកអ្នកពុំទាន់មានសំណួរ ឬចម្លើយមុននេះឡើយ។ សូមសួរសំណួរកសិកម្មជាមុនសិន!', standardKeyboard);
        return;
      }
      if (this.ttsCaller) {
        await this.sendChatAction(chatId, 'record_voice');
        await this.sendMessage(chatId, '🔊 កំពុងរៀបចំសម្លេងបច្ចេកទេសជូន...');
        const audioBuf = await this.ttsCaller(lastText);
        if (audioBuf) {
          await this.sendVoice(chatId, audioBuf, '🔊 សម្លេងបច្ចេកទេស LASEDIII_Help_Bot');
          return;
        }
      }
      await this.sendMessage(chatId, '🔊 មិនអាចចាក់សម្លេងបានទេនៅពេលនេះ សូមអានខ្លឹមសារជាអក្សរ។');
      return;
    }

    // Question explaining why Telegram app previously lacked a speaker button
    if (
      (text.includes('ស្តាប់') && text.includes('telegram')) || 
      (text.includes('telegram') && text.includes('សម្លេង')) || 
      text.includes('អត់មានកន្លែងចុចស្តាប់សម្លេង')
    ) {
      const explainVoice = `🌾 **ជម្រាបជូនលោកពូ អ្នកមីង បងប្អូនកសិករអំពីការស្តាប់សម្លេងក្នុង Telegram៖**\n\nនៅក្នុងកម្មវិធី Telegram App ធម្មតា សារជាអក្សរពុំមានប៊ូតុង Speaker (Web Speech) ស្វ័យប្រវត្តិតាមលំនាំដើមដូចនៅលើ Web Browser ទេ ដោយសារ Telegram ដំណើរការជា Native App ដាច់ដោយឡែក។\n\n🎙️ **ប៉ុន្តែនៅក្នុង LASEDIII_Help_Bot នេះ បងប្អូនអាចស្តាប់សម្លេងបានយ៉ាងងាយស្រួល ៣ របៀប៖**\n\n១. **ចុចប៊ូតុង "🔊 ចុចស្តាប់សម្លេង"៖** រាល់ចម្លើយរបស់ខ្ញុំ មានភ្ជាប់ប៊ូតុងនេះនៅខាងក្រោម។ គ្រាន់តែចុចលើវា ខ្ញុំនឹងផ្ញើសារជាសម្លេង (Voice Note) ជូនភ្លាមៗ!\n២. **ឆ្លើយជាសម្លេងស្វ័យប្រវត្តិ៖** ប្រសិនបើបងប្អូនផ្ញើសារសម្លេងសួរមកកាន់ខ្ញុំ ខ្ញុំនឹងឆ្លើយតបទាំងជាអក្សរ និងផ្ញើសារសម្លេងជូនវិញដោយស្វ័យប្រវត្តិ!\n៣. **វាយពាក្យបញ្ជា៖** អាចចុចលើពាក្យ "🔊 ស្តាប់សម្លេងចុងក្រោយ" ឬវាយពាក្យ **"ស្តាប់សម្លេង"** ឬ **/voice** ដើម្បីស្តាប់ចម្លើយចុងក្រោយគ្រប់ពេល។`;
      this.lastReplies.set(String(chatId), explainVoice);
      await this.sendMessage(chatId, explainVoice, listenInlineMarkup);
      return;
    }

    if (text === '📸 របៀបថតរូបស្កេនជំងឺ') {
      const guide = `📸 **របៀបថតរូបស្កេនជំងឺដំណាំ និងសត្វ៖**\n\n១. ថតយករូបភាពស្លឹក ផ្លែ ឬដើមដំណាំដែលមានស្នាមជំងឺឱ្យច្បាស់ល្អ ក្រោមពន្លឺថ្ងៃធម្មជាតិ\n២. បើសត្វឈឺ សូមថតស្បែក ដុំពក ភ្នែក ឬអាការៈមិនប្រក្រតី\n៣. ផ្ញើរូបភាពមកកាន់ Bot នេះផ្ទាល់\n\n⚡ ប្រព័ន្ធ AI នឹងវិភាគឈ្មោះជំងឺ រោគសញ្ញា ដំណោះស្រាយបន្ទាន់ ៣ ជំហាន វិធីព្យាបាលបែបធម្មជាតិ និងថ្នាំសុវត្ថិភាពភ្លាមៗ!`;
      this.lastReplies.set(String(chatId), guide);
      await this.sendMessage(chatId, guide, standardKeyboard);
      return;
    }

    // 2. Handle Photo Message (Disease diagnosis)
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      this.addLog('photo', `បានផ្ញើរូបភាពស្កេនជំងឺ`, senderName);
      await this.sendChatAction(chatId, 'upload_photo');
      await this.sendMessage(chatId, `🌾 បានទទួលរូបភាពហើយ! កំពុងវិភាគជំងឺដំណាំ/សត្វដោយប្រព័ន្ធ AI សូមរង់ចាំមួយភ្លែត...`);

      const highestResPhoto = message.photo[message.photo.length - 1];
      const downloaded = await this.downloadFileAsBase64(highestResPhoto.file_id);

      if (downloaded && this.aiCaller) {
        try {
          const prompt = `រូបភាពនេះផ្ញើមកពីកសិករគម្រោង LASED III (${senderName})។
សូមវិភាគរូបភាពកសិកម្មនេះដោយផ្ទាល់ និងឱ្យចំប្រធានបទ ១០០%៖
១. ពិនិត្យឱ្យច្បាស់ជាដំបូងថាតើរូបភាពនេះជាដំណាំ (ដូចជា ស្ពៃ, បន្លែ, ស្រូវ, កៅស៊ូ, ចន្ទី...) ឬជាសត្វពាហនៈ?
   - ដាច់ខាតមិនត្រូវឆ្លើយច្រឡំរវាងដំណាំ និងសត្វឡើយ! បើរូបភាពជាស្លឹក ឬកូនដំណាំ ត្រូវឆ្លើយតែអំពីជំងឺដំណាំប៉ុណ្ណោះ ហាមនិយាយរឿងសត្វ។
២. បញ្ជាក់ឈ្មោះជំងឺ និងរោគសញ្ញាសំខាន់ៗ (ឧទាហរណ៍៖ ជំងឺរលួយគល់, ជំងឺអុចស្លឹក, ស្រពោន, ខ្វះជីវជាតិ...)
៣. មូលហេតុបង្កចម្បង (ផ្សិត, បាក់តេរី, សំណើមដីខ្ពស់ជាំទឹក...)
៤. ដំណោះស្រាយបន្ទាន់ ៣ ជំហានដែលត្រូវធ្វើថ្ងៃនេះ
៥. វិធីសាស្ត្រធម្មជាតិ (ផ្សិតទ្រីកូដឺម៉ា, ថ្នាំរុក្ខជាតិ) និងថ្នាំកសិកម្មសុវត្ថិភាព។
សូមឆ្លើយជាភាសាខ្មែរ រួសរាយ រាក់ទាក់ ច្បាស់លាស់ និងចំគោលដៅបំផុត។`;
          
          const reply = await this.aiCaller(prompt, downloaded.base64);
          this.lastReplies.set(String(chatId), reply);
          await this.sendMessage(chatId, reply, listenInlineMarkup);
          this.addLog('success', `បានវិភាគរូបភាព និងឆ្លើយតបរួចរាល់`, senderName);
          return;
        } catch (e: any) {
          console.warn('Error analyzing Telegram photo:', e);
          await this.sendMessage(chatId, 'សូមអភ័យទោស មានបញ្ហាក្នុងការវិភាគរូបភាព។ សូមសាកល្បងថតរូបម្តងទៀតឱ្យកាន់តែច្បាស់។');
          return;
        }
      }
    }

    // 3. Handle Voice Message
    if (message.voice || message.audio) {
      const voiceObj = message.voice || message.audio;
      this.addLog('voice', `បានផ្ញើសារជាសម្លេង (${voiceObj.duration || 0} វិនាទី)`, senderName);
      await this.sendChatAction(chatId, 'record_voice');
      await this.sendMessage(chatId, `🎙️ បានទទួលសារសម្លេង! កំពុងស្តាប់ និងរៀបចំចម្លើយបច្ចេកទេស...`);

      const downloaded = await this.downloadFileAsBase64(voiceObj.file_id);
      if (downloaded && this.aiCaller) {
        try {
          const reply = await this.aiCaller(
            `កសិករ ${senderName} បានសួរសំណួរតាមសម្លេង។ សូមចម្លងសំណួរ និងផ្តល់ចម្លើយបច្ចេកទេសកសិកម្ម LASED III ជូនពួកគាត់ជាភាសាខ្មែរ។`,
            undefined,
            downloaded.base64
          );
          this.lastReplies.set(String(chatId), reply);
          await this.sendMessage(chatId, reply, listenInlineMarkup);
          this.addLog('success', `បានឆ្លើយតបសារសម្លេងរួចរាល់`, senderName);

          // Automatically send voice reply for farmers who used voice note
          if (this.ttsCaller) {
            await this.sendChatAction(chatId, 'record_voice');
            const audioBuf = await this.ttsCaller(reply);
            if (audioBuf) {
              await this.sendVoice(chatId, audioBuf, '🔊 សម្លេងបច្ចេកទេស LASEDIII_Help_Bot');
              this.addLog('voice', 'បានផ្ញើសារសម្លេងឆ្លើយតបស្វ័យប្រវត្តិ', senderName);
            }
          }
          return;
        } catch (e: any) {
          console.warn('Error processing voice message:', e);
          await this.sendMessage(chatId, 'សូមអភ័យទោស មិនអាចបកប្រែសម្លេងបានច្បាស់ទេ។ សូមសាកល្បងនិយាយម្តងទៀត ឬវាយជាអក្សរ។');
          return;
        }
      }
    }

    // 4. Handle General Text Question
    if (text) {
      this.addLog('message', text, senderName);
      await this.sendChatAction(chatId, 'typing');

      if (this.aiCaller) {
        try {
          const reply = await this.aiCaller(text);
          this.lastReplies.set(String(chatId), reply);
          await this.sendMessage(chatId, reply, listenInlineMarkup);
          this.addLog('success', `បានឆ្លើយតបសំណួរអក្សររួចរាល់`, senderName);
        } catch (e: any) {
          console.warn('Error processing text message:', e);
          await this.sendMessage(chatId, 'សូមអភ័យទោស ប្រព័ន្ធមានបញ្ហាក្នុងការឆ្លើយតបនៅពេលនេះ។ សូមសាកល្បងសួរម្តងទៀត។');
        }
      }
    }
  }

  // Set Webhook if preferred
  public async setWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
    if (!this.token) {
      return { success: false, message: 'សូមបញ្ចូល Token ជាមុនសិន' };
    }

    try {
      this.stopPolling();
      const res = await fetch(`https://api.telegram.org/bot${this.token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      });
      const data = await res.json();
      if (data.ok) {
        this.mode = 'webhook';
        this.addLog('success', `បានកំណត់ Webhook ទៅកាន់: ${webhookUrl}`);
        return { success: true, message: 'បានកំណត់ Webhook ជោគជ័យ' };
      } else {
        return { success: false, message: data.description || 'បរាជ័យក្នុងការកំណត់ Webhook' };
      }
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}

export const telegramBot = new TelegramBotManager();
