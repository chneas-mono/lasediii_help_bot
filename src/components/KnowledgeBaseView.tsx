import React, { useState } from 'react';
import { 
  AGRI_TOPICS 
} from '../data/agriKnowledge';
import { AgriTopic, AgriCategory } from '../types/agri';
import { 
  BookOpen, Search, ArrowRight, ShieldCheck, 
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Sparkles, MessageSquare
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
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
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
          return (
            <div
              key={topic.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
            >
              {/* Header Accordion */}
              <button
                onClick={() => setExpandedTopicId(isExpanded ? '' : topic.id)}
                className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
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
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                    {topic.commonDiseases.length} ជំងឺចម្បង
                  </span>
                  <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-6 animate-fade-in">
                  {/* LASED III Project Context */}
                  <div className="mt-4 p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
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
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>ជំងឺ និងសត្វល្អិតចង្រៃជួបញឹកញាប់ រួមទាំងដំណោះស្រាយ៖</span>
                    </h4>
                    <div className="space-y-3">
                      {topic.commonDiseases.map((disease, dIdx) => (
                        <div
                          key={dIdx}
                          className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-bold text-slate-900 dark:text-white">
                              {disease.nameKh}
                            </h5>
                            <span className="text-[11px] text-slate-400 italic">
                              {disease.nameEn}
                            </span>
                          </div>
                          
                          <div className="text-slate-600 dark:text-slate-300 space-y-1 text-[11px] leading-relaxed">
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
                      ))}
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
    </div>
  );
};
