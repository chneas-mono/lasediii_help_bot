import React, { useState } from 'react';
import { 
  MessageSquare, Camera, BookOpen, Info, Send, 
  Sparkles, Leaf, Phone, ShieldCheck, Moon, Sun, 
  ExternalLink, CheckCircle, ArrowRight
} from 'lucide-react';
import { TelegramBotView } from './components/TelegramBotView';
import { DiseaseScannerView } from './components/DiseaseScannerView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { TelegramConnectModal } from './components/TelegramConnectModal';
import { AgriFAQSection } from './components/AgriFAQSection';
import { DiagnosisResult } from './types/agri';

type ActiveTab = 'bot' | 'scanner' | 'knowledge' | 'about';

const HERO_IMAGE_URL = '/src/assets/images/lased_farmer_hero_1793943724008.jpg';
const CROPS_IMAGE_URL = '/src/assets/images/cambodia_crops_collage_1793943724736.jpg';
const LIVESTOCK_IMAGE_URL = '/src/assets/images/cambodia_livestock_farm_1793943725772.jpg';
const BOT_AVATAR_URL = '/assets/aistudio/Logo_LASED_III_2024_Final_46f51ed0.png';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('bot');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pendingChatQuery, setPendingChatQuery] = useState<string | undefined>();
  const [pendingDiagnosis, setPendingDiagnosis] = useState<DiagnosisResult | undefined>();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAskTopicFromKnowledge = (topicTitle: string, question: string) => {
    setPendingChatQuery(question);
    setActiveTab('bot');
  };

  const handleSendDiagnosisToChat = (text: string, diagnosis?: DiagnosisResult) => {
    setPendingChatQuery(text);
    setPendingDiagnosis(diagnosis);
    setActiveTab('bot');
  };

  return (
    <div className={`min-h-screen bg-[#F8FAF9] dark:bg-[#0B1015] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Bar (Follows 3-Zone Top Bar Contract) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (Single text element) */}
        <a 
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('bot');
          }}
          className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white p-0.5 flex items-center justify-center shrink-0 border border-teal-500/40 shadow-xs">
            <img 
              src={BOT_AVATAR_URL} 
              alt="LASEDIII_Help_Bot Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <span>LASEDIII_Help_Bot</span>
        </a>

        {/* Zone 2: Navigation Links (single-line, whitespace-nowrap) */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('bot')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'bot'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            តេលេក្រាម Bot
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'scanner'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ស្កេនជំងឺរហ័ស
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'knowledge'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            បច្ចេកទេស ៤ ដំណាំ ៥ សត្វ
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'about'
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            អំពីគម្រោង LASED III
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDarkMode ? 'ប្តូរទៅផ្ទៃភ្លឺ' : 'ប្តូរទៅផ្ទៃងងឹត'}
            aria-label="Theme toggle"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#2AABEE] hover:bg-[#229ED9] rounded-xl transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>ភ្ជាប់ Telegram App</span>
          </button>
        </div>
      </header>

      {/* Mobile Segmented Sub-Nav */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('bot')}
          className={`flex-1 py-1.5 px-2.5 text-xs font-medium rounded-lg whitespace-nowrap ${
            activeTab === 'bot'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          💬 Bot Chat
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex-1 py-1.5 px-2.5 text-xs font-medium rounded-lg whitespace-nowrap ${
            activeTab === 'scanner'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          📸 ស្កេនជំងឺ
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex-1 py-1.5 px-2.5 text-xs font-medium rounded-lg whitespace-nowrap ${
            activeTab === 'knowledge'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          📚 បណ្ណាល័យ
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex-1 py-1.5 px-2.5 text-xs font-medium rounded-lg whitespace-nowrap ${
            activeTab === 'about'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          ℹ️ គម្រោង
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8">
        {activeTab === 'bot' && (
          <TelegramBotView
            onOpenScannerTab={() => setActiveTab('scanner')}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            initialQuery={pendingChatQuery}
            initialDiagnosis={pendingDiagnosis}
          />
        )}

        {activeTab === 'scanner' && (
          <DiseaseScannerView
            onSendToChat={handleSendDiagnosisToChat}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBaseView
            onAskTopic={handleAskTopicFromKnowledge}
            onOpenScanner={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'about' && (
          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Hero Card */}
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
              <img
                src={HERO_IMAGE_URL}
                alt="LASED III Farmer"
                className="w-full h-64 sm:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                  គម្រោង LASED III · ក្រសួងកសិកម្ម រុក្ខាប្រមាញ់ និងនេសាទ
                </span>
                <h2 className="text-xl sm:text-3xl font-bold">
                  គម្រោងបែងចែកដីដើម្បីសង្គមកិច្ច និងការអភិវឌ្ឍសេដ្ឋកិច្ច ជំហាន៣
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-2xl leading-relaxed">
                  លើកកម្ពស់សន្តិសុខកាន់កាប់ដីធ្លី ការអភិវឌ្ឍជីវភាពកសិកម្ម និងការគ្រប់គ្រងធនធានធម្មជាតិប្រកបដោយចីរភាព សម្រាប់សហគមន៍ជនបទ និងជនជាតិដើមភាគតិចនៅកម្ពុជា។
                </p>
              </div>
            </div>

            {/* Visual Showcase: Crops & Livestock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <img
                  src={CROPS_IMAGE_URL}
                  alt="Cambodian Crops"
                  className="w-full h-44 object-cover"
                />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      🌾 ដំណាំ ៤ មុខជាអាទិភាព
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      ស្រូវពូជសុទ្ធ (ផ្ការំដួល សែនក្រអូប), បន្លែសុវត្ថិភាព CamGAP (ត្រសក់ ម្ទេស ប៉េងប៉ោះ), កៅស៊ូគ្រួសារ, និងដំណាំចន្ទី (M23, H09) ធន់នឹងការប្រែប្រួលអាកាសធាតុ។
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('knowledge')}
                    className="mt-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                  >
                    <span>ស្វែងយល់បច្ចេកទេសដំណាំ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <img
                  src={LIVESTOCK_IMAGE_URL}
                  alt="Cambodian Livestock"
                  className="w-full h-44 object-cover"
                />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      🐂 ការចិញ្ចឹមសត្វ ៥ មុខ
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      គោ ក្របី (ការដាំស្មៅចំណី វ៉ាក់សាំង LSD/FMD), ជ្រូកលើទ្រនាប់ជីវសាស្ត្រ (EM), មាន់ស្រុកពាក់កណ្តាលលែង, និងការចិញ្ចឹមត្រីក្នុងស្រះដី/អាងតង់កៅស៊ូ។
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('knowledge')}
                    className="mt-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                  >
                    <span>ស្វែងយល់បច្ចេកទេសសត្វ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Hotline & Community Contacts */}
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-200 dark:border-emerald-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                    បណ្តាញទំនាក់ទំនងគាំទ្រកសិករគម្រោង LASED III
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    ទាក់ទងមន្ត្រីកសិកម្មឃុំ ឬភ្នាក់ងារបសុព្យាបាលភូមិ (CAHW) ប្រចាំតំបន់សម្បទានដីសង្គមកិច្ច
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <span className="text-slate-400 block text-[11px]">ខេត្តគោលដៅ៖</span>
                  <strong className="text-slate-800 dark:text-slate-200">ក្រចេះ, ត្បូងឃ្មុំ, កំពង់ធំ, កំពង់ឆ្នាំង, ពោធិ៍សាត់, បាត់ដំបង</strong>
                </div>
                <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <span className="text-slate-400 block text-[11px]">ដៃគូគាំទ្រ៖</span>
                  <strong className="text-slate-800 dark:text-slate-200">MAFF, MLMUPC, ធនាគារពិភពលោក (World Bank)</strong>
                </div>
                <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <span className="text-slate-400 block text-[11px]">ជំនួយការ AI Bot៖</span>
                  <strong className="text-slate-800 dark:text-slate-200">ដំណើរការ ២៤/៧ លើ Chat, Voice និង Scan</strong>
                </div>
              </div>
            </div>

            {/* Dynamic Frequently Asked Questions (FAQ) Section */}
            <AgriFAQSection onAskInBot={(q) => handleAskTopicFromKnowledge('FAQ', q)} />
          </div>
        )}
      </main>

      {/* Telegram Connection Modal */}
      <TelegramConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
}
