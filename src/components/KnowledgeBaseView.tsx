import React, { useState, useEffect, useRef } from 'react';
import { 
  AGRI_TOPICS 
} from '../data/agriKnowledge';
import { AgriTopic, CommonDisease } from '../types/agri';
import { 
  Search, ArrowRight, ShieldCheck, 
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Sparkles, MessageSquare,
  Volume2, VolumeX, Square, Headphones, Radio
} from 'lucide-react';

interface Props {
  onAskTopic?: (topicTitle: string, question: string) => void;
  onOpenScanner?: () => void;
}

export const KnowledgeBaseView: React.FC<Props> = ({ onAskTopic, onOpenScanner }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'crop' | 'livestock'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopicId, setExpandedTopicId] = useState<string>('rice');

  // Speech Synthesis state
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);
  const [currentSpeakingTitle, setCurrentSpeakingTitle] = useState<string>('');
  const [speechRate, setSpeechRate] = useState<number>(0.92);
  const [hasSpeechSupport, setHasSpeechSupport] = useState<boolean>(true);
  const isPlayingRef = useRef<boolean>(false);

  // Initialize and check Speech Synthesis support
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setHasSpeechSupport(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop speech playback
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentSpeakingId(null);
    setCurrentSpeakingTitle('');
    isPlayingRef.current = false;
  };

  // Helper to find best Khmer voice if available
  const getKhmerVoice = (): SpeechSynthesisVoice | undefined => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.lang === 'km-KH') ||
      voices.find(v => v.lang.startsWith('km')) ||
      voices.find(v => v.name.toLowerCase().includes('khmer'))
    );
  };

  // Speak text using Web Speech API with chunking for natural Cambodian cadence
  const speakKhmerAdvice = (text: string, id: string, title: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    // Toggle off if already speaking the same id
    if (currentSpeakingId === id) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    // Clean text of markdown formatting
    const cleanText = text
      .replace(/[*#_`>~-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split text into natural sentence chunks using Khmer and standard delimiters (។, ., !, ?)
    const sentences = cleanText
      .split(/(?<=[។\.\!\?])\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sentences.length === 0) return;

    setCurrentSpeakingId(id);
    setCurrentSpeakingTitle(title);
    isPlayingRef.current = true;

    const khmerVoice = getKhmerVoice();
    let index = 0;

    const speakNextSentence = () => {
      if (!isPlayingRef.current || index >= sentences.length) {
        stopSpeaking();
        return;
      }

      const chunk = sentences[index];
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = 'km-KH';
      if (khmerVoice) {
        utterance.voice = khmerVoice;
      }
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        index++;
        speakNextSentence();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance notice:', e);
        index++;
        speakNextSentence();
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextSentence();
  };

  // Speak an entire topic's advice
  const speakTopicAdvice = (topic: AgriTopic) => {
    const textToRead = `
      បច្ចេកទេស ${topic.titleKh}។ ${topic.description}។
      ការណែនាំរបស់គម្រោង LASED III៖ ${topic.lasedGuidance}។
      បច្ចេកទេស និងក្បួនសំខាន់ៗ៖ ${topic.keyPractices.join('។ ')}។
      ជំងឺ និងសត្វល្អិតចង្រៃជួបញឹកញាប់៖
      ${topic.commonDiseases.map(d => `ជំងឺ ${d.nameKh}។ រោគសញ្ញា៖ ${d.symptoms}។ វិធីព្យាបាល និងដោះស្រាយ៖ ${d.treatment}។ ការបង្ការ៖ ${d.prevention}។`).join(' ')}
    `;

    speakKhmerAdvice(textToRead, topic.id, topic.titleKh);
  };

  // Speak a single disease remedy
  const speakDiseaseRemedy = (topicTitle: string, disease: CommonDisease, diseaseId: string) => {
    const textToRead = `
      ${topicTitle}៖ ${disease.nameKh} (${disease.nameEn})។
      រោគសញ្ញាសំខាន់ៗ៖ ${disease.symptoms}។
      វិធីព្យាបាល និងដោះស្រាយ៖ ${disease.treatment}។
      វិធានការបង្ការ៖ ${disease.prevention}។
    `;

    speakKhmerAdvice(textToRead, diseaseId, `${topicTitle} - ${disease.nameKh}`);
  };

  const filteredTopics = AGRI_TOPICS.filter((topic) => {
    const matchesTab = activeTab === 'all' || topic.type === activeTab;
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    const matchesQuery = 
      topic.titleKh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.commonDiseases.some(d => d.nameKh.includes(searchQuery));
    return matchesTab && matchesCategory && matchesQuery;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-80 h-full opacity-15 pointer-events-none flex items-center justify-center text-9xl">
          🌾
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-emerald-200 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>សៀវភៅណែនាំបច្ចេកទេសគម្រោង LASED III</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            បណ្ណាល័យបច្ចេកទេសដាំដុះដំណាំ និងចិញ្ចឹមសត្វ
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed">
            បណ្តុំចំណេះដឹងក្សេត្រសាស្ត្រ និងបសុព្យាបាលផ្លូវការ ស្របតាមស្តង់ដារក្រសួងកសិកម្ម និងគម្រោង LASED III សម្រាប់ដំណាំ ៤ ប្រភេទ និងសត្វចិញ្ចឹម ៥ ប្រភេទ។
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Segmented Tab */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ទាំងអស់ (៩ ប្រធានបទ)
          </button>
          <button
            onClick={() => setActiveTab('crop')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'crop'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🌱 ដំណាំ ៤ មុខ
          </button>
          <button
            onClick={() => setActiveTab('livestock')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'livestock'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🐂 សត្វចិញ្ចឹម ៥ មុខ
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ស្វែងរកជំងឺ ពូជ ឬបច្ចេកទេស..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Topic List */}
      <div className="space-y-4">
        {filteredTopics.map((topic) => {
          const isExpanded = expandedTopicId === topic.id;
          const isSpeakingThisTopic = currentSpeakingId === topic.id;

          return (
            <div
              key={topic.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all ${
                isSpeakingThisTopic 
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' 
                  : 'border-slate-200 dark:border-slate-800 shadow-sm'
              } overflow-hidden`}
            >
              {/* Header Accordion */}
              <div className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <button
                  onClick={() => setExpandedTopicId(isExpanded ? '' : topic.id)}
                  className="flex items-center gap-3.5 flex-1 text-left"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-2xl shrink-0">
                    {topic.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {topic.titleKh}
                      </h3>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-serif italic">
                        {topic.titleEn}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                      {topic.description}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Quick Listen Button on Header */}
                  {hasSpeechSupport && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSpeakingThisTopic) {
                          stopSpeaking();
                        } else {
                          if (!isExpanded) setExpandedTopicId(topic.id);
                          speakTopicAdvice(topic);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                        isSpeakingThisTopic
                          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                          : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                      title="ស្តាប់ការណែនាំជាសម្លេង (Listen to Advice)"
                    >
                      {isSpeakingThisTopic ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span className="hidden sm:inline">បញ្ឈប់</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">ស្តាប់ការណែនាំ</span>
                        </>
                      )}
                    </button>
                  )}

                  <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline">
                    {topic.commonDiseases.length} ជំងឺចម្បង
                  </span>
                  
                  <button
                    onClick={() => setExpandedTopicId(isExpanded ? '' : topic.id)}
                    className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-6 animate-fade-in">
                  
                  {/* Listen to Advice Audio Bar */}
                  {hasSpeechSupport && (
                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isSpeakingThisTopic 
                            ? 'bg-emerald-600 text-white animate-pulse' 
                            : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {isSpeakingThisTopic ? (
                            <Radio className="w-5 h-5 animate-spin" />
                          ) : (
                            <Headphones className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              ស្តាប់ការណែនាំបច្ចេកទេសជាសម្លេង (Listen to Advice)
                            </h4>
                            {isSpeakingThisTopic && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white animate-pulse">
                                កំពុងអាន...
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            ប្រព័ន្ធ Speech Synthesis អានបច្ចេកទេសជាភាសាខ្មែរ សម្រាប់ជួយសម្រួលដល់បងប្អូនកសិករ
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {isSpeakingThisTopic ? (
                          <button
                            onClick={stopSpeaking}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                            title="បញ្ឈប់ការអាន"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>បញ្ឈប់ការអាន</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => speakTopicAdvice(topic)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                            title="ស្តាប់ការណែនាំបច្ចេកទេសពេញលេញ"
                          >
                            <Volume2 className="w-4 h-4" />
                            <span>ស្តាប់ការណែនាំពេញលេញ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* LASED III Project Context */}
                  <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>ការណែនាំគម្រោង LASED III៖</strong> {topic.lasedGuidance}
                    </p>
                  </div>

                  {/* Key Practices */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>បច្ចេកទេស និងក្បួនដាំដុះ/ចិញ្ចឹមសំខាន់ៗ៖</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {topic.keyPractices.map((practice, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                        >
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{practice}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Common Diseases & Remedies */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>ជំងឺ និងសត្វល្អិតចង្រៃជួបញឹកញាប់ រួមទាំងដំណោះស្រាយ៖</span>
                      </h4>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        ចុចប៊ូតុងស្តាប់ ដើម្បីស្តាប់វិធីព្យាបាលនីមួយៗ
                      </span>
                    </div>

                    <div className="space-y-3">
                      {topic.commonDiseases.map((disease, dIdx) => {
                        const diseaseUniqueId = `${topic.id}_disease_${dIdx}`;
                        const isSpeakingThisDisease = currentSpeakingId === diseaseUniqueId;

                        return (
                          <div
                            key={dIdx}
                            className={`p-4 rounded-2xl border transition-all text-xs space-y-2.5 ${
                              isSpeakingThisDisease
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400/30'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-slate-900 dark:text-white">
                                  {disease.nameKh}
                                </h5>
                                <span className="text-[11px] text-slate-400 italic">
                                  {disease.nameEn}
                                </span>
                              </div>

                              {/* Disease-specific listen button */}
                              {hasSpeechSupport && (
                                <button
                                  onClick={() => speakDiseaseRemedy(topic.titleKh, disease, diseaseUniqueId)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                                    isSpeakingThisDisease
                                      ? 'bg-rose-600 text-white animate-pulse'
                                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/60 dark:hover:text-emerald-300'
                                  }`}
                                  title="ស្តាប់វិធីព្យាបាលជំងឺនេះ"
                                >
                                  {isSpeakingThisDisease ? (
                                    <>
                                      <Square className="w-3 h-3 fill-current" />
                                      <span>បញ្ឈប់</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3 h-3 text-emerald-600" />
                                      <span>ស្តាប់វិធីព្យាបាល</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            
                            <div className="text-slate-600 dark:text-slate-300 space-y-1.5 text-[11px] leading-relaxed">
                              <p>
                                <strong className="text-slate-800 dark:text-slate-200">រោគសញ្ញា៖</strong> {disease.symptoms}
                              </p>
                              <p>
                                <strong className="text-emerald-700 dark:text-emerald-400">វិធីព្យាបាល/ដោះស្រាយ៖</strong> {disease.treatment}
                              </p>
                              <p>
                                <strong className="text-sky-700 dark:text-sky-400">ការបង្ការ៖</strong> {disease.prevention}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => onAskTopic && onAskTopic(topic.titleKh, `សូមជួយពន្យល់លម្អិតបន្ថែមអំពីបច្ចេកទេស ${topic.titleKh} និងវិធីការពារជំងឺសំខាន់ៗ។`)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>សួរ LASEDIII_Help_Bot អំពី {topic.titleKh}</span>
                    </button>

                    {onOpenScanner && (
                      <button
                        onClick={onOpenScanner}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <span>ថតរូបស្កេនជំងឺលើ {topic.titleKh}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Active Speech Player when audio is playing */}
      {currentSpeakingId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-900 flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5 animate-bounce" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>កំពុងអានការណែនាំជាសម្លេង...</span>
              </div>
              <p className="text-xs font-bold text-slate-100 truncate max-w-[240px] sm:max-w-[300px]">
                {currentSpeakingTitle || 'បច្ចេកទេសកសិកម្ម'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Speed toggle */}
            <button
              onClick={() => {
                const nextRate = speechRate === 0.92 ? 1.05 : speechRate === 1.05 ? 0.8 : 0.92;
                setSpeechRate(nextRate);
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-mono border border-slate-700"
              title="ល្បឿនអាន"
            >
              {speechRate}x
            </button>

            {/* Stop button */}
            <button
              onClick={stopSpeaking}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>បញ្ឈប់</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
