import React, { useState, useEffect } from 'react';
import { 
  X, Send, CheckCircle2, ExternalLink, ShieldCheck, 
  Copy, Check, AlertCircle, RefreshCw, Radio, Play, Square, MessageSquare, Terminal
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface TelegramStatus {
  configured: boolean;
  connected: boolean;
  botInfo?: {
    id: number;
    first_name: string;
    username: string;
  };
  mode: 'polling' | 'webhook';
  isPolling: boolean;
  updatesProcessed: number;
  lastActive: string;
  logs: Array<{
    id: string;
    timestamp: string;
    type: string;
    sender?: string;
    text: string;
  }>;
  tokenMasked?: string;
}

export const TelegramConnectModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [botToken, setBotToken] = useState('');
  const [selectedMode, setSelectedMode] = useState<'polling' | 'webhook'>('polling');
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [testChatId, setTestChatId] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/telegram/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.warn('Could not fetch Telegram status:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
  const webhookUrl = `${currentOrigin}/api/telegram/webhook`;

  const handleConnect = async () => {
    if (!botToken.trim()) {
      setErrorMsg('សូមបញ្ចូល Bot Token ដែលទទួលបានពី @BotFather ជាមុនសិន!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/telegram/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: botToken.trim(),
          mode: selectedMode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ការតភ្ជាប់បរាជ័យ');
      }

      setSuccessMsg(`ជោគជ័យ! Bot @${data.botInfo?.username} ត្រូវបានតភ្ជាប់ និងចាប់ផ្តើមដំណើរការលើ Telegram App រួចរាល់ហើយ!`);
      setBotToken('');
      fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'មានបញ្ហាក្នុងការភ្ជាប់ជាមួយ Telegram API');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePolling = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/telegram/toggle-polling', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testChatId.trim()) {
      setTestResult('សូមបញ្ចូល Chat ID របស់អ្នក (ឬផ្ញើសារ /start ទៅ Bot លើ Telegram ជាមុនសិន)');
      return;
    }
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/telegram/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: testChatId.trim(),
          message: '🌾 សួស្តីពី LASEDIII_Help_Bot! ការតភ្ជាប់ Telegram ដំណើរការបានជោគជ័យ ១០០%។ លោកអ្នកអាចសួរសំណួរ ផ្ញើសារសម្លេង ឬរូបភាពជំងឺបានហើយ!'
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult('✅ បានផ្ញើសារជោគជ័យទៅកាន់ Telegram របស់អ្នកហើយ!');
      } else {
        setTestResult('❌ មិនអាចផ្ញើបានទេ៖ សូមប្រាកដថាអ្នកបានចុច Start លើ Bot នោះក្នុង Telegram ជាមុនសិន។');
      }
    } catch (e: any) {
      setTestResult('កំហុស៖ ' + e.message);
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-teal-500/40 p-1 flex items-center justify-center shadow-md shrink-0">
            <img
              src="/assets/aistudio/Logo_LASED_III_2024_Final_46f51ed0.png"
              alt="LASEDIII_Help_Bot Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              ការដំឡើង LASEDIII_Help_Bot លើ Telegram App
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ភ្ជាប់ BotFather Token ដើម្បីឱ្យកសិករអាច Chat, ផ្ញើសម្លេង និងថតរូបលើកម្មវិធី Telegram ផ្ទាល់
            </p>
          </div>
        </div>

        {/* Live Status Banner */}
        <div className={`p-4 rounded-2xl border mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          status?.connected && status?.isPolling
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
            : status?.connected
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${
              status?.connected && status?.isPolling
                ? 'bg-emerald-500 animate-pulse'
                : status?.connected
                ? 'bg-amber-500'
                : 'bg-slate-400'
            }`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  ស្ថានភាព Bot៖
                </span>
                {status?.connected ? (
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 inline" />
                    <span>បានតភ្ជាប់ (@{status.botInfo?.username})</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    មិនទាន់បានភ្ជាប់ Bot Token នៅឡើយ
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {status?.isPolling 
                  ? `កំពុងដំណើរការ Long Polling (ឆ្លើយតបសារស្វ័យប្រវត្ត) · សារសរុប៖ ${status.updatesProcessed}`
                  : status?.connected 
                  ? 'Bot ត្រូវបានផ្អាកការ Polling' 
                  : 'សូមបញ្ចូល Token ពី @BotFather ខាងក្រោមដើម្បីដំណើរការ'}
              </p>
            </div>
          </div>

          {status?.connected && (
            <div className="flex items-center gap-2 self-end sm:self-center">
              <a
                href={`https://t.me/${status.botInfo?.username}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <span>បើក Bot ក្នុង Telegram</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={handleTogglePolling}
                disabled={loading}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                {status.isPolling ? 'ផ្អាក Polling' : 'ចាប់ផ្តើម Polling'}
              </button>
            </div>
          )}
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#2AABEE]" />
              <span>របៀបយក Bot Token ពី Telegram ក្នុងរយៈពេល ១ នាទី៖</span>
            </h4>
            <ol className="space-y-1.5 list-decimal list-inside text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>
                បើកកម្មវិធី Telegram ហើយស្វែងរក <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-[#2AABEE] font-bold underline">@BotFather</a> (មានសញ្ញាធីកខៀវ)
              </li>
              <li>
                ចុច <strong>Start</strong> រួចផ្ញើពាក្យបញ្ជា <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-pink-600">/newbot</code>
              </li>
              <li>
                ដាក់ឈ្មោះ Bot (ឧ. <strong>LASEDIII_Help_Bot</strong>) និង username (ឧ. <strong>lasediii_bot</strong>)
              </li>
              <li>
                @BotFather នឹងផ្ញើ <strong>HTTP API Token</strong> (ឧ. <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">7123456789:AAH...</code>)។ សូមចម្លងវាមកបិទភ្ជាប់ក្នុងប្រអប់ខាងក្រោម!
              </li>
            </ol>
          </div>

          {/* Form to Enter Token */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                បញ្ចូល Telegram Bot Token របស់អ្នក៖
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={status?.tokenMasked || "ឧ. 7123456789:AAHq_mJk592..."}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="flex-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
                />
                <button
                  onClick={handleConnect}
                  disabled={loading || !botToken.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{loading ? 'កំពុងភ្ជាប់...' : 'ភ្ជាប់ & ចាប់ផ្តើម Bot'}</span>
                </button>
              </div>
            </div>

            {/* Mode selection */}
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">ទម្រង់ដំណើរការ៖</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={selectedMode === 'polling'}
                  onChange={() => setSelectedMode('polling')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Long Polling (ណែនាំខ្លាំងបំផុត - ដំណើរការភ្លាមៗ)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={selectedMode === 'webhook'}
                  onChange={() => setSelectedMode('webhook')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Webhook</span>
              </label>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* Test Message Section */}
          {status?.connected && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>សាកល្បងផ្ញើសារទៅកាន់ Telegram App របស់អ្នក៖</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                បើក Telegram រួចស្វែងរក <strong>@{status.botInfo?.username}</strong> ហើយចុច <strong>Start</strong>។ បន្ទាប់មកបញ្ចូល Chat ID (ឬលេខសម្គាល់គណនីរបស់អ្នក) ដើម្បីផ្ញើសារតេស្ត៖
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="បញ្ចូល Chat ID របស់អ្នក (ឧ. 123456789)"
                  value={testChatId}
                  onChange={(e) => setTestChatId(e.target.value)}
                  className="flex-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleSendTestMessage}
                  disabled={testSending || !testChatId.trim()}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testSending ? 'កំពុងផ្ញើ...' : 'ផ្ញើសារតេស្ត'}</span>
                </button>
              </div>
              {testResult && (
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-1">
                  {testResult}
                </p>
              )}
            </div>
          )}

          {/* Live Activity Logs */}
          {status?.logs && status.logs.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>កំណត់ហេតុសកម្មភាពផ្ទាល់ (Live Telegram Logs)</span>
                </span>
                <span>{status.logs.length} សកម្មភាពចុងក្រោយ</span>
              </div>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-2xl max-h-36 overflow-y-auto font-mono text-[11px] space-y-1">
                {status.logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                    <span className={`px-1 py-0.2 rounded text-[10px] shrink-0 ${
                      log.type === 'success' ? 'bg-emerald-900 text-emerald-300' :
                      log.type === 'error' ? 'bg-rose-900 text-rose-300' :
                      log.type === 'photo' ? 'bg-purple-900 text-purple-300' :
                      log.type === 'voice' ? 'bg-amber-900 text-amber-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {log.type.toUpperCase()}
                    </span>
                    <span className="truncate">
                      {log.sender ? `[${log.sender}] ` : ''}{log.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            រួចរាល់ / បិទ
          </button>
        </div>
      </div>
    </div>
  );
};
