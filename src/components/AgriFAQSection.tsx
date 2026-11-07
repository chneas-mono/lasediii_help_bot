import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, Search, ChevronDown, ChevronUp, Sparkles, 
  MessageSquare, ArrowRight, ShieldCheck, CheckCircle2, 
  Send, RefreshCw, BookOpen, Filter
} from 'lucide-react';

export interface FAQItem {
  id: string;
  category: 'project' | 'crops' | 'livestock' | 'bot';
  categoryLabel: string;
  questionKh: string;
  answerKh: string;
  keyPoints: string[];
  suggestedPrompt: string;
}

const FAQS_DATA: FAQItem[] = [
  {
    id: 'faq_1',
    category: 'project',
    categoryLabel: 'គម្រោង LASED III',
    questionKh: 'តើគម្រោង LASED III ជាអ្វី ហើយកសិករណាខ្លះដែលទទួលបានផលប្រយោជន៍?',
    answerKh: 'គម្រោងបែងចែកដីដើម្បីសង្គមកិច្ច និងការអភិវឌ្ឍសេដ្ឋកិច្ច ជំហាន៣ (LASED III) ដឹកនាំអនុវត្តដោយក្រសួងរៀបចំដែនដី នគរូបនីយកម្ម និងសំណង់ (MLMUPC) និងក្រសួងកសិកម្ម រុក្ខាប្រមាញ់ និងនេសាទ (MAFF) ក្រោមការគាំទ្រហិរញ្ញប្បទានពីធនាគារពិភពលោក (World Bank)។ គម្រោងនេះផ្តោតលើការផ្តល់ដីសម្បទានសង្គមកិច្ច ប័ណ្ណកម្មសិទ្ធិដីធ្លី ការកសាងហេដ្ឋារចនាសម្ព័ន្ធ និងការលើកកម្ពស់ជីវភាពកសិកម្មដល់គ្រួសារក្រីក្រ គ្រួសារគ្មានដីពិតប្រាកដ និងសហគមន៍ជនជាតិដើមភាគតិចក្នុងខេត្តគោលដៅចំនួន ១៤ (ខេត្តកំពង់ឆ្នាំង, បាត់ដំបង, បន្ទាយមានជ័យ, ឧត្តរមានជ័យ, ក្រចេះ, ស្ទឹងត្រែង, រតនគិរី, មណ្ឌលគិរី, កំពង់ធំ, ត្បូងឃ្មុំ, កំពង់ស្ពឺ, ព្រះសីហនុ, កំពត, និងកែប)។',
    keyPoints: [
      'ផ្តល់ដីធ្លី និងប័ណ្ណកម្មសិទ្ធិដីធ្លីស្របច្បាប់ជូនគ្រួសារក្រីក្រ',
      'ផ្តល់វគ្គបណ្តុះបណ្តាលក្សេត្រសាស្ត្រ និងបច្ចេកទេសចិញ្ចឹមសត្វឆ្លាតវៃធន់នឹងអាកាសធាតុ',
      'ជួយបង្កើតសហគមន៍កសិកម្ម និងផ្សារភ្ជាប់ទីផ្សារកសិផល'
    ],
    suggestedPrompt: 'សូមពន្យល់លម្អិតអំពីអត្ថប្រយោជន៍ និងការគាំទ្ររបស់គម្រោង LASED III ដល់កសិករក្នុងសហគមន៍។'
  },
  {
    id: 'faq_2',
    category: 'crops',
    categoryLabel: 'ដំណាំ ៤ មុខ',
    questionKh: 'តើបច្ចេកទេសដាំដុះស្រូវសន្សំសំចៃទឹក (SRI) និងពូជសុទ្ធជួយបង្កើនទិន្នផលយ៉ាងដូចម្តេច?',
    answerKh: 'ប្រព័ន្ធកែលម្អការដាំដុះស្រូវ (SRI) ដែល LASED III ណែនាំ តម្រូវឱ្យស្ទូងកូនស្រូវអាយុតិច (១២-១៥ ថ្ងៃ) ដោយស្ទូងមួយៗដើមក្នុងគម្លាត ២៥x២៥ ស.ម រួមជាមួយការគ្រប់គ្រងទឹកឆ្លាស់សើម-ស្ងួត (AWD)។ ការអនុវត្តនេះរួមផ្សំជាមួយពូជសុទ្ធគុណភាពខ្ពស់ដូចជា ផ្ការំដួល និងសែនក្រអូប-០១ ជួយឱ្យដើមស្រូវបែកគុម្ពខ្លាំង ឫសចាក់ជ្រៅធន់នឹងរាំងស្ងួត សន្សំសំចៃទឹក ៣០-៤០% និងបង្កើនទិន្នផលស្រូវរហូតដល់ ២០-៣០% បើធៀបនឹងការព្រោះញឹកប្រពៃណី។',
    keyPoints: [
      'ប្រើគ្រាប់ពូជតិចជាងមុន (ត្រឹម ៤០-៦០ គ.ក្រ/ហិកតា)',
      'ដើមស្រូវរឹងមាំ កាត់បន្ថយការដួលរលំ និងធន់នឹងជំងឺផ្លិតស្រូវ',
      'កាត់បន្ថយការចំណាយលើជីគីមី ដោយជំនួសដោយជីកំប៉ុស្តសរីរាង្គ'
    ],
    suggestedPrompt: 'តើការអនុវត្តបច្ចេកទេស SRI លើស្រូវផ្ការំដួលត្រូវធ្វើតាមជំហានណាខ្លះ?'
  },
  {
    id: 'faq_3',
    category: 'crops',
    categoryLabel: 'ដំណាំ ៤ មុខ',
    questionKh: 'តើត្រូវថែទាំចន្ទីដំណាក់កាលចេញផ្កា និងទប់ស្កាត់ជំងឺអង់ត្រាក់ណូសយ៉ាងដូចម្តេច?',
    answerKh: 'នៅពេលចន្ទីបែកត្រួយផ្កា (ខែធ្នូ ដល់ ខែកុម្ភៈ) បញ្ហាប្រឈមធំបំផុតគឺ ជំងឺអង់ត្រាក់ណូស (ផ្កាខ្លោចខ្មៅ) និងមមាចតែជញ្ជក់ទងផ្កា។ វិធានការរបស់ LASED III ណែនាំឱ្យកសិករ៖ ១. កាត់តាក់តែងមែកចាស់ៗក្រោយប្រមូលផលដើម្បីឱ្យពន្លឺថ្ងៃចាំងចូលគ្រប់ជ្រុង ២. បាញ់ថ្នាំផ្សំពីម្ទេសហឹរនិងស្លឹកស្តៅ ឬថ្នាំការពារផ្សិត Azoxystrobin + Difenoconazole នៅពេលផ្កាចាប់ផ្តើមលេចចេញពន្លកខ្ចី ៣. ស្រោចទឹកបំពេញសំណើមរៀងរាល់ ៧-១០ ថ្ងៃម្តងនៅដំណាក់កាលចងគ្រាប់ដើម្បីកុំឱ្យគ្រាប់ស្កក។',
    keyPoints: [
      'ហាមបាញ់ថ្នាំគីមីពេលផ្កាកំពុងរីកខ្លាំង ព្រោះសម្លាប់សត្វឃ្មុំបង្កាត់លម្អង',
      'អភិរក្សសត្វស្រមោចក្រហមក្នុងចម្ការចន្ទីដើម្បីដេញមមាចតែ',
      'ប្រមូលមែកនិងកញ្ចុំផ្កាស្ងួតដុតចោលក្រៅចម្ការ'
    ],
    suggestedPrompt: 'សូមណែនាំកាលវិភាគថែទាំ និងបាញ់ថ្នាំការពារផ្កាចន្ទីកុំឱ្យជ្រុះ និងស្កក។'
  },
  {
    id: 'faq_4',
    category: 'livestock',
    categoryLabel: 'សត្វចិញ្ចឹម ៥ មុខ',
    questionKh: 'តើត្រូវទប់ស្កាត់ជំងឺដុំពកស្បែកគោ (LSD) និងជំងឺអុតក្តារ (FMD) តាមវិធីណា?',
    answerKh: 'ជំងឺដុំពកស្បែកគោឆ្លងតាមរយៈមូស របោម និងចៃ។ កសិករត្រូវអនុវត្តវិធានការសំខាន់ ៣៖ ១. ចាក់វ៉ាក់សាំងការពារជំងឺដុំពកស្បែក (LSD) និងអុតក្តារ (FMD) ជារៀងរាល់ឆ្នាំតាមរយៈភ្នាក់ងារបសុព្យាបាលភូមិ (CAHW) ២. ដុតផ្សែងបណ្តេញសត្វល្អិតបឺតឈាមជុំវិញក្រោល និងសម្អាតក្រោលជាមួយកំបោរស ៣. បើមានគោចេញដុំពក ត្រូវញែកដាក់ក្រោលដាច់ដោយឡែកភ្លាមៗ ចាក់ថ្នាំបញ្ចុះកម្តៅ និងថ្នាំផ្សះការពារឆ្លងរោគបន្ថែម។',
    keyPoints: [
      'ចាក់វ៉ាក់សាំងការពារមុនពេលផ្ទុះជំងឺ (ការការពារប្រសើរជាងការព្យាបាល)',
      'ដាំស្មៅណេពា និងស្មៅគីនីដើម្បីធានាចំណីបំប៉នសុខភាពគោ',
      'ហាមទិញគោមិនច្បាស់ប្រភពចូលក្នុងហ្វូង'
    ],
    suggestedPrompt: 'គោរបស់ខ្ញុំមានដុំពកលើស្បែក និងក្តៅខ្លួន ត្រូវទិញថ្នាំអ្វីព្យាបាលបន្ទាន់?'
  },
  {
    id: 'faq_5',
    category: 'livestock',
    categoryLabel: 'សត្វចិញ្ចឹម ៥ មុខ',
    questionKh: 'ហេតុអ្វីគម្រោង LASED III លើកទឹកចិត្តឱ្យចិញ្ចឹមជ្រូកលើទ្រនាប់ជីវសាស្ត្រ (EM)?',
    answerKh: 'ការចិញ្ចឹមជ្រូកលើទ្រនាប់ជីវសាស្ត្រ (លាយកន្ទក់ + អង្កាម + កំទេចឈើ + មេមីក្រូសារពាង្គកាយ EM) ផ្តល់អត្ថប្រយោជន៍ធំៗ ៤៖ ១. គ្មានក្លិនស្អុយ និងគ្មានរុយរោម ២. មិនបាច់លាងទឹកជារៀងរាល់ថ្ងៃ សន្សំសំចៃកម្លាំងពលកម្ម និងទឹក ៣. កាត់បន្ថយការកើតជំងឺរាក និងជំងឺសួត ៤. ក្រោយចិញ្ចឹម អាចកើបទ្រនាប់នោះធ្វើជាជីកំប៉ុស្តសរីរាង្គគុណភាពខ្ពស់សម្រាប់ដាក់ដំណាំបន្លែ និងចន្ទីបានយ៉ាងច្រើនតោន។',
    keyPoints: [
      'កម្រាស់ទ្រនាប់ពី ៤០ ទៅ ៦០ សង់ទីម៉ែត្រ',
      'ជួយទប់ស្កាត់ការចម្លងជំងឺប៉េស្តជ្រូកអាហ្វ្រិក (ASF) តាមរយៈការគ្រប់គ្រងជីវសុវត្ថិភាព',
      'ស័ក្តិសមបំផុតសម្រាប់កសិករខ្នាតគ្រួសារ'
    ],
    suggestedPrompt: 'តើមានរបៀបធ្វើទ្រនាប់ជីវសាស្ត្រសម្រាប់ចិញ្ចឹមជ្រូកតាមក្បួនបច្ចេកទេសយ៉ាងដូចម្តេច?'
  },
  {
    id: 'faq_6',
    category: 'crops',
    categoryLabel: 'ដំណាំ ៤ មុខ',
    questionKh: 'តើរូបមន្តផ្សំថ្នាំពុលរុក្ខជាតិធម្មជាតិកម្ចាត់សត្វល្អិតបន្លែមានអ្វីខ្លះ?',
    answerKh: 'ដើម្បីដាំបន្លែសុវត្ថិភាពតាមស្ដង់ដារ CamGAP កសិករអាចផលិតថ្នាំពុលធម្មជាតិដោយប្រើ៖ ស្លឹកស្តៅស្រស់ ៣ គ.ក្រ + ម្ទេសហឹរទុំ ០.៥ គ.ក្រ + ខ្ទឹមស ០.៥ គ.ក្រ + ស្លឹកគ្រៃ ០.៥ គ.ក្រ។ បុកវត្ថុធាតុទាំងអស់ឱ្យម៉ត់ រួចត្រាំក្នុងទឹកស្អាត ១០ លីត្រ រយៈពេល ២៤-៤៨ ម៉ោង។ ពេលប្រើប្រាស់ ត្រងយកទឹកថ្នាំ ១០០-១៥០ មីលីលីត្រ លាយជាមួយទឹកស្អាត ១៦-២០ លីត្រ រួចបន្ថែមសាប៊ូកក់សក់ធម្មជាតិបន្តិចដើម្បីឱ្យថ្នាំស្អិតជាប់ស្លឹក រួចបាញ់លើបន្លែនៅពេលល្ងាចត្រជាក់។',
    keyPoints: [
      'កម្ចាត់ចៃ ស្រមោច ដង្កូវស៊ីស្លឹក និងមមាចបានយ៉ាងមានប្រសិទ្ធភាព',
      'គ្មានជាតិគីមីពុល មិនប៉ះពាល់សុខភាពអ្នកដាំ និងអ្នកហូប',
      'ចំណាយដើមទុនតិចបំផុត ព្រោះប្រើរុក្ខជាតិដែលមានស្រាប់ជុំវិញផ្ទះ'
    ],
    suggestedPrompt: 'សូមពន្យល់ពីវិធីធ្វើថ្នាំពុលរុក្ខជាតិធម្មជាតិ និងរបៀបប្រើប្រាស់លើដំណាំបន្លែ។'
  },
  {
    id: 'faq_7',
    category: 'bot',
    categoryLabel: 'ជំនួយការ Bot & AI',
    questionKh: 'តើខ្ញុំអាចប្រើមុខងារ Voice សម្លេង និងថតរូបស្កេនជំងឺលើ Telegram យ៉ាងដូចម្តេច?',
    answerKh: 'លោកអ្នកអាចប្រើប្រាស់មុខងារទាំងនេះយ៉ាងសាមញ្ញទាំងក្នុង Web App នេះ និងលើ Telegram App ផ្ទាល់៖\n- 🎙️ សម្រាប់សម្លេង៖ ចុចសង្កត់លើប៊ូតុងមីក្រូហ្វូន និយាយសំណួរជាភាសាខ្មែរ (ឧ. "ស្រូវរបស់ខ្ញុំក្រៀមស្លឹក ត្រូវធ្វើម៉េច?") រួចលែងដៃ Bot នឹងបម្លែងសម្លេងជាអក្សរ និងឆ្លើយតបដំណោះស្រាយភ្លាមៗ។\n- 📸 សម្រាប់រូបភាព៖ ថតរូបស្លឹកដំណាំ ឬសត្វឈឺឱ្យច្បាស់ល្អ រួចផ្ញើចូលក្នុង Chat ប្រព័ន្ធ AI នឹងស្កេនពិនិត្យកោសិកា និងប្រាប់ឈ្មោះជំងឺ កម្រិតធ្ងន់ធ្ងរ និងដំណោះស្រាយបន្ទាន់ ៣ ជំហានជូនលោកអ្នក។',
    keyPoints: [
      'គាំទ្រការនិយាយជាភាសាខ្មែរធម្មជាតិ',
      'មានប៊ូតុងអានសម្លេង (TTS) សម្រាប់អ្នកដែលពិបាកអានអក្សរ',
      'វិភាគរូបភាពជំងឺដំណាំ និងសត្វបានក្នុងរយៈពេលតែប៉ុន្មានវិនាទី'
    ],
    suggestedPrompt: 'តើត្រូវថតរូបជំងឺដំណាំបែបណាដើម្បីឱ្យ AI វិភាគបានត្រឹមត្រូវបំផុត?'
  },
  {
    id: 'faq_8',
    category: 'project',
    categoryLabel: 'គម្រោង LASED III',
    questionKh: 'តើខ្ញុំអាចទាក់ទងមន្ត្រីកសិកម្ម ឬភ្នាក់ងារបសុព្យាបាលភូមិ (CAHW) តាមវិធីណា?',
    answerKh: 'នៅគ្រប់តំបន់គម្រោងសម្បទានដីសង្គមកិច្ចនៃ LASED III មានមន្ត្រីកសិកម្មឃុំប្រចាំការ និងភ្នាក់ងារបសុព្យាបាលភូមិ (CAHW) ដែលបានទទួលការបណ្តុះបណ្តាលត្រឹមត្រូវពីមន្ទីរកសិកម្មខេត្ត។ កសិករអាចទាក់ទងតាមរយៈសាលាឃុំ ការិយាល័យកសិកម្មស្រុក មេភូមិ ឬផ្ញើសំណួរមកកាន់ LASEDIII_Help_Bot នេះដើម្បីឱ្យប្រព័ន្ធណែនាំបឋម មុនពេលមន្ត្រីជំនាញចុះមកដល់ចម្ការផ្ទាល់។',
    keyPoints: [
      'មន្ត្រីកសិកម្មឃុំជួយពិគ្រោះបច្ចេកទេស និងត្រួតពិនិត្យចម្ការ',
      'ភ្នាក់ងារ CAHW ជួយចាក់វ៉ាក់សាំងសត្វពាហនៈ និងទម្លាក់ព្រូន',
      'មានការគាំទ្រសម្ភារ និងពូជដំណាំតាមផែនការអភិវឌ្ឍន៍សហគមន៍'
    ],
    suggestedPrompt: 'តើខ្ញុំអាចស្នើសុំការចុះពិនិត្យជំងឺសត្វពាហនៈពីភ្នាក់ងារបសុព្យាបាលភូមិ (CAHW) ដោយរបៀបណា?'
  }
];

interface Props {
  onAskInBot: (prompt: string) => void;
}

export const AgriFAQSection: React.FC<Props> = ({ onAskInBot }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'project' | 'crops' | 'livestock' | 'bot'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string>('faq_1');

  // Interactive dynamic custom question state
  const [customQuestion, setCustomQuestion] = useState('');
  const [dynamicAnswer, setDynamicAnswer] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    return FAQS_DATA.filter(faq => {
      const matchCat = activeCategory === 'all' || faq.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        faq.questionKh.toLowerCase().includes(query) ||
        faq.answerKh.toLowerCase().includes(query) ||
        faq.categoryLabel.toLowerCase().includes(query) ||
        faq.keyPoints.some(p => p.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });
  }, [activeCategory, searchQuery]);

  const handleAskDynamicAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setDynamicAnswer(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `[សំណួរពីផ្នែក FAQ គម្រោង LASED III]: ${customQuestion.trim()}`
            }
          ]
        })
      });

      if (!res.ok) throw new Error('ការឆ្លើយតបបរាជ័យ');
      const data = await res.json();
      setDynamicAnswer(data.reply || 'មិនមានចម្លើយ');
    } catch (err: any) {
      setErrorMsg('មានបញ្ហាក្នុងការបង្កើតចម្លើយ៖ ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
      {/* FAQ Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
              <HelpCircle className="w-4 h-4" />
              <span>ចម្លើយបច្ចេកទេសផ្លូវការ</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              សំណួរ និងចម្លើយញឹកញាប់ (FAQ)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              ប្រមូលផ្តុំសំណួរដែលកសិករក្នុងគម្រោង LASED III ជួបប្រទះញឹកញាប់បំផុត រួមទាំងបច្ចេកទេសដោះស្រាយដំណាំ ៤ មុខ សត្វ ៥ មុខ និងការប្រើប្រាស់ជំនួយការ AI។
            </p>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500 shrink-0 self-start sm:self-auto">
            <span>រកឃើញ </span>
            <strong className="text-slate-900 dark:text-white font-mono">{filteredFaqs.length}</strong>
            <span> សំណួរ</span>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ទាំងអស់
            </button>
            <button
              onClick={() => setActiveCategory('project')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === 'project'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏛️ គម្រោង LASED III
            </button>
            <button
              onClick={() => setActiveCategory('crops')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === 'crops'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🌾 ដំណាំ ៤ មុខ
            </button>
            <button
              onClick={() => setActiveCategory('livestock')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === 'livestock'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🐂 សត្វ ៥ មុខ
            </button>
            <button
              onClick={() => setActiveCategory('bot')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === 'bot'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🤖 Bot & Voice
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ស្វែងរកសំណួរ (ឧ. ស្រូវ, ចន្ទី, LSD)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
              >
                {/* Question Trigger */}
                <button
                  onClick={() => setExpandedFaqId(isExpanded ? '' : faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-start sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-bold text-xs">
                      ?
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {faq.categoryLabel}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {faq.questionKh}
                      </h4>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 mt-0.5 sm:mt-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanded Answer */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fade-in text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <p className="mt-3 leading-relaxed">
                      {faq.answerKh}
                    </p>

                    {/* Key Highlights */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="font-bold text-slate-900 dark:text-white block text-[11px]">
                        📌 ចំណុចសំខាន់ៗគួរចងចាំ៖
                      </span>
                      <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-600 dark:text-slate-300">
                        {faq.keyPoints.map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Action: Ask in Bot */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <span className="text-[11px] text-slate-400 italic hidden sm:inline">
                        ចង់ដឹងបន្ថែមលើករណីចម្ការរបស់អ្នក?
                      </span>
                      <button
                        onClick={() => onAskInBot(faq.suggestedPrompt)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ml-auto"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>សួរ LASEDIII_Help_Bot បន្ថែម &gt;</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            មិនមានសំណួរត្រូវគ្នានឹងពាក្យស្វែងរក "{searchQuery}" ឡើយ។ សូមសាកល្បងពាក្យគន្លឹះផ្សេងទៀត ឬវាយសួរខាងក្រោម។
          </div>
        )}
      </div>

      {/* Dynamic AI Custom Query Box */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold">
              មានសំណួរកសិកម្មផ្សេងទៀតអំពីគម្រោង LASED III?
            </h4>
            <p className="text-xs text-emerald-200">
              វាយសំណួររបស់អ្នកនៅទីនេះដើម្បីឱ្យបញ្ញាសិប្បនិម្មិត AI បង្កើតចម្លើយបច្ចេកទេសផ្លូវការភ្លាមៗ
            </p>
          </div>
        </div>

        <form onSubmit={handleAskDynamicAi} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="ឧ. វិធីបណ្តុះកូនស្រូវ SRI ឱ្យរឹងមាំ, របៀបចិញ្ចឹមត្រីអណ្តែងក្នុងអាងតង់កៅស៊ូ..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="w-full pl-4 pr-28 py-3 text-xs bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-emerald-200/60 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              type="submit"
              disabled={isGenerating || !customQuestion.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>កំពុងឆ្លើយ...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>ឆ្លើយភ្លាម</span>
                </>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {dynamicAnswer && (
          <div className="p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs space-y-3 animate-fade-in">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ចម្លើយបច្ចេកទេស LASED III សម្រាប់៖ "{customQuestion}"</span>
              </span>
              <button
                onClick={() => onAskInBot(customQuestion)}
                className="text-[11px] text-white hover:underline shrink-0"
              >
                ផ្ញើទៅ Telegram Chat &gt;
              </button>
            </div>
            <div className="text-emerald-50 leading-relaxed whitespace-pre-wrap text-[11px]">
              {dynamicAnswer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
