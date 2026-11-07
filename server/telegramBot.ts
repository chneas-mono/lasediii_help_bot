import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

  constructor() {
    this.loadConfig();
  }

  public setAiCaller(caller: (prompt: string, imageBase64?: string, audioBase64?: string) => Promise<string>) {
    this.aiCaller = caller;
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
    const message = update?.message || update?.channel_post;
    if (!message) return;

    this.updatesProcessed++;
    this.lastActive = new Date().toISOString();

    const chatId = message.chat?.id;
    const senderName = message.from?.first_name || message.chat?.title || 'កសិករ';
    const text = message.text || message.caption || '';

    // Standard Quick Reply Keyboard
    const standardKeyboard = {
      keyboard: [
        [{ text: '🌾 ដំណាំស្រូវ' }, { text: '🥬 ដំណាំបន្លែ' }],
        [{ text: '🌳 ដំណាំកៅស៊ូ' }, { text: '🥜 ដំណាំចន្ទី' }],
        [{ text: '🐂 គោ និងក្របី' }, { text: '🐖 ជ្រូក' }],
        [{ text: '🐔 មាន់ទា' }, { text: '🐟 ត្រី' }],
        [{ text: '📸 របៀបថតរូបស្កេនជំងឺ' }, { text: 'ℹ️ អំពីគម្រោង LASED III' }]
      ],
      resize_keyboard: true,
      persistent: true
    };

    // 1. Handle Commands & Text
    if (text.startsWith('/start')) {
      this.addLog('message', `ចុច /start`, senderName);
      const welcome = `🌾 ជំរាបសួរ ${senderName}! 🙏\n\nខ្ញុំជា **LASEDIII_Help_Bot** ជំនួយការកសិកម្មឆ្លាតវៃសម្រាប់កសិករគម្រោង LASED III (គម្រោងបែងចែកដីដើម្បីសង្គមកិច្ច និងការអភិវឌ្ឍសេដ្ឋកិច្ច ជំហាន៣)។\n\nខ្ញុំអាចជួយដោះស្រាយបញ្ហាបច្ចេកទេសជូនលោកអ្នកលើ៖\n🌱 **ដំណាំ ៤ មុខ៖** ស្រូវ, បន្លែ, កៅស៊ូ, ចន្ទី\n🐂 **សត្វចិញ្ចឹម ៥ មុខ៖** គោ, ក្របី, ជ្រូក, មាន់ទា, ត្រី\n\n💡 **របៀបប្រើប្រាស់ងាយៗ៖**\n- 💬 វាយសួរសំណួរ ឬជ្រើសរើសប្រធានបទខាងក្រោម\n- 🎙️ ចុចមីក្រូហ្វូនផ្ញើសារជាសម្លេង\n- 📸 ថតរូបស្លឹកដំណាំ ឬសត្វឈឺផ្ញើមក ដើម្បីឱ្យខ្ញុំវិភាគជំងឺ និងរកវិធីព្យាបាលភ្លាមៗ!`;
      await this.sendMessage(chatId, welcome, standardKeyboard);
      return;
    }

    if (text === 'ℹ️ អំពីគម្រោង LASED III') {
      const about = `ℹ️ **អំពីគម្រោង LASED III**\n\nគម្រោងបែងចែកដីដើម្បីសង្គមកិច្ច និងការអភិវឌ្ឍសេដ្ឋកិច្ច ជំហាន៣ (LASED III) ដឹកនាំដោយក្រសួងកសិកម្ម រុក្ខាប្រមាញ់ និងនេសាទ (MAFF) និងក្រសួងរៀបចំដែនដី (MLMUPC) ក្រោមការគាំទ្រពីធនាគារពិភពលោក (World Bank)។\n\n📍 **ខេត្តគោលដៅចំនួន ១៤ រួមមាន៖**\nខេត្តកំពង់ឆ្នាំង, បាត់ដំបង, បន្ទាយមានជ័យ, ឧត្តរមានជ័យ, ក្រចេះ, ស្ទឹងត្រែង, រតនគិរី, មណ្ឌលគិរី, កំពង់ធំ, ត្បូងឃ្មុំ, កំពង់ស្ពឺ, ព្រះសីហនុ, កំពត, និងកែប។\n\nជំនួយការ AI នេះដំណើរការ ២៤/៧ ដើម្បីជួយកសិករឱ្យទទួលបានបច្ចេកទេសកសិកម្មទំនើប និងដោះស្រាយជំងឺដំណាំសត្វទាន់ពេលវេលា។`;
      await this.sendMessage(chatId, about, standardKeyboard);
      return;
    }

    if (text === '📸 របៀបថតរូបស្កេនជំងឺ') {
      const guide = `📸 **របៀបថតរូបស្កេនជំងឺដំណាំ និងសត្វ៖**\n\n១. ថតយករូបភាពស្លឹក ផ្លែ ឬដើមដំណាំដែលមានស្នាមជំងឺឱ្យច្បាស់ល្អ ក្រោមពន្លឺថ្ងៃធម្មជាតិ\n២. បើសត្វឈឺ សូមថតស្បែក ដុំពក ភ្នែក ឬអាការៈមិនប្រក្រតី\n៣. ផ្ញើរូបភាពមកកាន់ Bot នេះផ្ទាល់\n\n⚡ ប្រព័ន្ធ AI នឹងវិភាគឈ្មោះជំងឺ រោគសញ្ញា ដំណោះស្រាយបន្ទាន់ ៣ ជំហាន វិធីព្យាបាលបែបធម្មជាតិ និងថ្នាំសុវត្ថិភាពភ្លាមៗ!`;
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
          const prompt = `កសិករខ្មែរឈ្មោះ ${senderName} បានផ្ញើរូបភាពនេះមកតាម Telegram។ សូមវិភាគជំងឺដំណាំ ឬសត្វក្នុងរូបភាពនេះ ដោយបង្ហាញ៖
១. ឈ្មោះជំងឺ និងកម្រិតធ្ងន់ធ្ងរ
២. រោគសញ្ញាសំខាន់ៗ
៣. ដំណោះស្រាយបន្ទាន់ ៣ ជំហានដែលត្រូវធ្វើថ្ងៃនេះ
៤. វិធីសាស្ត្រធម្មជាតិ (ជី/ថ្នាំសរីរាង្គ)
៥. ថ្នាំកសិកម្ម ឬពេទ្យសត្វដែលមានការអនុញ្ញាត និងការការពាររយៈពេលវែង។
សូមឆ្លើយជាភាសាខ្មែរ រួសរាយ រាក់ទាក់ ច្បាស់លាស់ ងាយយល់។`;
          
          const reply = await this.aiCaller(prompt, downloaded.base64);
          await this.sendMessage(chatId, reply, standardKeyboard);
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
          await this.sendMessage(chatId, reply, standardKeyboard);
          this.addLog('success', `បានឆ្លើយតបសារសម្លេងរួចរាល់`, senderName);
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
          await this.sendMessage(chatId, reply, standardKeyboard);
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
