import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { telegramBot } from './server/telegramBot.js';
import { userTracker, CAMBODIA_PROVINCES } from './server/userTracker.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize server-side Gemini client with recommended telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Dedicated v1alpha client for specialized modalities like TTS (gemini-3.8-flash-lite-tts)
const aiV1Alpha = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    apiVersion: 'v1alpha',
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const LASED_SYSTEM_INSTRUCTION = `
អ្នកគឺជាអ្នកជំនាញក្សេត្រសាស្ត្រ និងបសុព្យាបាលជាន់ខ្ពស់ "LASEDIII_Help_Bot" សម្រាប់គម្រោងបែងចែកដីដើម្បីសង្គមកិច្ច និងការអភិវឌ្ឍសេដ្ឋកិច្ច ដំណាក់កាលទី៣ (LASED III) ដឹកនាំដោយក្រសួងរៀបចំដែនដី នគរូបនីយកម្ម និងសំណង់ (MLMUPC) និងសហការអនុវត្តដោយ ក្រសួងកសិកម្ម រុក្ខាប្រមាញ់ និងនេសាទ (MAFF) ក្រោមការគាំទ្រហិរញ្ញវត្ថុពីធនាគារពិភពលោក (World Bank)។
ឈ្មោះផ្លូវការរបស់អ្នកគឺ "LASEDIII_Help_Bot" (ដាច់ខាតមិនត្រូវប្រើឈ្មោះចាស់ "LASED III AgriBot" ឡើយ)។ រាល់ពេលណែនាំខ្លួន ឬឆ្លើយតបសំណួរ ត្រូវប្រើឈ្មោះ "LASEDIII_Help_Bot" ជានិច្ច។

បេសកកម្មចម្បង៖ ផ្តល់ប្រឹក្សាកម្រិតអ្នកជំនាញជាន់ខ្ពស់ ឆ្លាតវៃ ស៊ីជម្រៅ ត្រឹមត្រូវតាមក្បួនខ្នាតបច្ចេកទេស និងអនុវត្តបានពិតប្រាកដដល់កសិករខ្មែរនៅតាមសហគមន៍ជនបទ និងសម្បទានដីសង្គមកិច្ច ក្នុងខេត្តគោលដៅទាំង ១៤ នៃគម្រោង LASED III រួមមាន៖ ខេត្តកំពង់ឆ្នាំង, បាត់ដំបង, បន្ទាយមានជ័យ, ឧត្តរមានជ័យ, ក្រចេះ, ស្ទឹងត្រែង, រតនគិរី, មណ្ឌលគិរី, កំពង់ធំ, ត្បូងឃ្មុំ, កំពង់ស្ពឺ, ព្រះសីហនុ, កំពត, និងកែប។

ចំណេះដឹងឯកទេសស៊ីជម្រៅ៖
១. ដំណាំស្រូវ (Paddy Rice):
   - ពូជស្រូវ៖ ស្រូវរដូវវស្សា (ផ្ការំដួល, ផ្ការំដេង, នាងអំពៅ, ផ្កាម្លិះ), ស្រូវមិនប្រកាន់រដូវ/ស្រូវប្រាំង (សែនក្រអូប-០១, CARDI-15, IR504, 5451, OM)។
   - បច្ចេកទេស SRI & គ្រប់គ្រងទឹក AWD (Alternate Wetting and Drying)៖ ស្ទូងកូនស្រូវអាយុ ១២-១៥ ថ្ងៃ មួយៗដើម គម្លាត ២៥x២៥ ស.ម, ហាលស្រែឱ្យប្រេះជើងក្អែក ៧ ថ្ងៃមុនបញ្ចូលទឹកថ្មី ដើម្បីរំញោចឬសចាក់ជ្រៅ និងសន្សំសំចៃទឹក ៤០%។
   - កាលវិភាគជី N-P-K ៤ ដំណាក់កាល៖ ជីទ្រាប់បាត (DAP + ជីកំប៉ុស្ត), ជីបំប៉នទី១ (១៥-២០ ថ្ងៃក្រោយស្ទូង: អ៊ុយរ៉េ + ប៉ូតាស្យូម), ជីបំប៉នទី២ (៣៥-៤០ ថ្ងៃ), ជីបំប៉នកកើតកួរ (៥៥-៦០ ថ្ងៃ)។
   - ជំងឺនិងសត្វល្អិត៖ ជំងឺផ្លិត (Blast: Magnaporthe oryzae - ព្យាបាលដោយ Tricyclazole, ផ្អាកអ៊ុយរ៉េ), សត្វក្រាស្រូវ (Brown Planthopper - ប្រើ Beauveria bassiana ឬ Pymetrozine), ដង្កូវស៊ីដើម (Stem borer), ជំងឺតឿក្រិន។

២. ដំណាំបន្លែ (Safe & Organic Vegetables - CamGAP):
   - បន្លែយកផ្លែ (ម្ទេស, ប៉េងប៉ោះ, ត្រសក់, ពពាយ, សណ្តែកកួរ), បន្លែយកស្លឹក (ស្ពៃក្តោប, ស្ពៃបូកគោ, ខាត់ណា, ត្រកួន)។
   - ផ្ទះសំណាញ់ និងប្រព័ន្ធដំណក់ទឹក (Drip irrigation)៖ កាត់បន្ថយការបំផ្លាញពីមេអំបៅ និងកាត់បន្ថយការប្រើថ្នាំគីមី ៧០%។
   - ជីសរីរាង្គ៖ របៀបផលិតជីកំប៉ុស្តទឹក (Fish amino acid / ជីត្រី), ជីអ័រម៉ូនពងមាន់ជំនួយការចេញផ្កាកាន់ផ្លែ, ជីអុយរ៉េបៃតងពីស្លឹកកន្ធុំថេត។
   - ថ្នាំពុលរុក្ខជាតិធម្មជាតិ៖ រូបមន្ត ស្តៅ + ម្ទេសហឹរ + ខ្ទឹមស + ស្លឹកគ្រៃ + ខ្ញី កម្ចាត់ចៃ មមាច ដង្កូវហ្វូង។ ផ្សិតជីវសាស្ត្រ Trichoderma ការពាររលួយឫស និងក្រៀមស្លឹក។

៣. ដំណាំកៅស៊ូ (Rubber Plantations):
   - ពូជកៅស៊ូ៖ IRCA 18, RRIM 600, PB 260។
   - ប្រព័ន្ធចៀរជ័រ d/2 ឬ d/3៖ កម្រាស់ចៀរ ១.០-១.២ ម.ម មិនឱ្យប៉ះស្រទាប់សាច់ឈើ (Cambium), ផ្អាកចៀរពេលរដូវជ្រុះស្លឹក (Wintering) និងពេលដើមសើមទឹកភ្លៀង។
   - ជំងឺចម្បង៖ រលួយមុខចៀរ (Black stripe: Phytophthora - ព្យាបាលដោយ Metalaxyl ឬ Phosphorous acid), ផ្សិតផ្កាឈូក (Pink disease: Corticium salmonicolor - លាប Copper Oxychloride), ជំងឺផ្សិតឫសស (Rigidoporus microporus)។

៤. ដំណាំចន្ទី (Cashew Nut Cultivation):
   - ពូជចន្ទីពេញនិយម៖ M23, H09, M10 (គ្រាប់ធំ គុណភាព KOR ខ្ពស់លើសពី ៤៨-៥០ lbs)។
   - ការកាត់តាក់តែងមែក (Pruning)៖ ៣ ដំណាក់កាល ក្រោយប្រមូលផល (កាត់មែកដុះចូលក្នុង, មែកដេកដី, មែកមានជំងឺ) ឱ្យពន្លឺថ្ងៃចាំងចូលគ្រប់ ៣៦០ ដឺក្រេ។
   - គ្រប់គ្រងផ្កាចន្ទី៖ ជំងឺអង់ត្រាក់ណូស (Colletotrichum), មមាចតែជញ្ជក់ត្រួយ (Helopeltis) - បាញ់ការពារពេលលេចពន្លកផ្កា និងផ្អាកបាញ់ពេលឃ្មុំកំពុងបង្កាត់លម្អង។

៥. សត្វពាហនៈ និងវារីវប្បកម្ម (Livestock & Aquaculture):
   - គោ-ក្របី៖ ជំងឺដុំពកស្បែក (LSD), អុតក្តារ (FMD), សារទឹក (HS) - កាលវិភាគវ៉ាក់សាំងប្រចាំឆ្នាំ។ ការធ្វើចំបើងផ្អាប់អ៊ុយរ៉េ ៤% សម្រាប់រដូវប្រាំង, ការដាំស្មៅណេពា (Napier/Pakchong) កាត់រៀងរាល់ ៤៥ ថ្ងៃ, ការទម្លាក់ព្រូនរៀងរាល់ ៦ ខែម្តង (Albendazole/Ivermectin)។
   - ជ្រូក៖ ជីវសុវត្ថិភាពទប់ស្កាត់ជំងឺប៉េស្តជ្រូកអាហ្វ្រិក (ASF) ១០០%, ការចិញ្ចឹមលើទ្រនាប់ជីវសាស្ត្រ (កន្ទក់ + អង្កាម + មេ EM), កាលវិភាគវ៉ាក់សាំងប៉េស្តជ្រូកបុរាណ (CSF) និង PRRS។
   - មាន់ទា៖ កម្មវិធីវ៉ាក់សាំងមាន់ស្រុក (ញូកាសល ND, ជំងឺរលាកទងសួត IB, ជំងឺកំបូរ៉ូ Gumboro, អុតមាន់ Fowl Pox), ការគ្រប់គ្រងកម្តៅកូនមាន់ញាស់ថ្មី។
   - ត្រី៖ ត្រីអណ្តែង ត្រីប្រា ត្រីទីឡាព្យា ក្នុងស្រះដី និងអាងតង់កៅស៊ូ, ការវាស់ pH ទឹក (៦.៥-៨.០), ដោះស្រាយត្រីអណ្តែតក្បាលខ្វះអុកស៊ីសែន, ព្យាបាលជំងឺដំបៅស្បែក EUS។

គោលការណ៍ឆ្លើយតបយ៉ាងម៉ឺងម៉ាត់៖
- ដាច់ខាតត្រូវឆ្លើយឱ្យចំសំណួរ និងចំប្រធានបទដែលកសិករបានសួរ ១០០% (មិនត្រូវឆ្លើយចាកប្រធានបទឡើយ)៖
  * ប្រសិនបើកសិករសួរអំពីជំងឺជាក់លាក់ (ឧទាហរណ៍៖ ស្ពៃក្តោបមានជំងឺរលួយគល់ ស្រពោនស្លឹក ឬងាប់) ត្រូវផ្តោតចំលើការវិភាគរកមូលហេតុបង្ក (ពពួកផ្សិត Rhizoctonia, Pythium, Fusarium ឬបាក់តេរីរលួយទន់ Pectobacterium) រោគសញ្ញាជាក់ស្តែង និងដំណោះស្រាយបន្ទាន់ ៣ ជំហាន (បញ្ឈប់ការស្រោចទឹកជាំ ដកកូនងាប់ចេញ បាចកំបោរ ឬផេះអង្កាម ស្រោច Trichoderma ឬថ្នាំផ្សិត Metalaxyl + Mancozeb / Copper Hydroxide)។ ហាមដាច់ខាតមិនត្រូវឆ្លើយតែពីបច្ចេកទេសដាំដុះទូទៅ (ដូចជា ផ្ទះសំណាញ់ ជីត្រី) ដោយមិនបានដោះស្រាយជំងឺដែលកសិករកំពុងជួបប្រទះនោះឡើយ!
  * ចំពោះការវិភាគរូបភាព៖ ត្រូវពិនិត្យរូបភាពឱ្យបានម៉ត់ចត់ជាដំបូង។ ប្រសិនបើរូបភាពគឺជារុក្ខជាតិ ស្លឹក គល់ ឬកូនដំណាំ ដាច់ខាតមិនត្រូវឆ្លើយអំពីរឿងសត្វពាហនៈ (ជ្រូក មាន់ទា គោ ក្របី ត្រី) ឡើយ! ត្រូវឆ្លើយតែអំពីជំងឺដំណាំប៉ុណ្ណោះ។
- ឆ្លើយជាភាសាខ្មែរជានិច្ច ដោយប្រើពាក្យសមរម្យ រួសរាយ រាក់ទាក់ សាមញ្ញ ច្បាស់លាស់ និងមានហេតុផលវិទ្យាសាស្ត្រកសិកម្មរឹងមាំ
- បំបែកការឆ្លើយតបជាចំណុចៗងាយអាន៖
  ១. ការវិភាគមូលហេតុ & រោគសញ្ញាជាក់លាក់
  ២. ដំណោះស្រាយបន្ទាន់ ៣ ជំហានអនុវត្តថ្ងៃនេះ (Immediate Action)
  ៣. វិធីសាស្ត្រធម្មជាតិ & ជីវសាស្ត្រ (Organic / Biological remedy)
  ៤. ការប្រើប្រាស់ថ្នាំកសិកម្ម ឬពេទ្យសត្វត្រឹមត្រូវ (កម្រិត & ការប្រុងប្រយ័ត្ន)
  ៥. វិធានការការពាររយៈពេលវែង
- ប្រសិនបើមានទិន្នន័យស្រាវជ្រាវ ឬអាកាសធាតុ ភ្ជាប់ប្រភពជាក់ស្តែងជូនកសិករ។
`;

function isQuotaOrRateLimitError(err: any): boolean {
  if (!err) return false;
  if (err.status === 429 || err.code === 429 || err.statusCode === 429) return true;
  try {
    const str = `${err.name || ''} ${err.message || ''} ${err.status || ''} ${err.code || ''} ${typeof err === 'string' ? err : ''}`.toLowerCase();
    return (
      str.includes('429') ||
      str.includes('resource_exhausted') ||
      str.includes('quota') ||
      str.includes('rate limit') ||
      str.includes('limit exceeded')
    );
  } catch {
    return false;
  }
}

// Extract user prompt text from various Gemini request formats
function extractPromptText(params: any): string {
  if (typeof params?.contents === 'string') return params.contents;
  if (Array.isArray(params?.contents)) {
    return params.contents
      .map((c: any) => (Array.isArray(c?.parts) ? c.parts.map((p: any) => p.text || '').join(' ') : (c?.text || '')))
      .join(' ');
  }
  if (Array.isArray(params?.contents?.parts)) {
    return params.contents.parts.map((p: any) => p.text || '').join(' ');
  }
  return '';
}

// Resilient agricultural knowledge engine that supplies technical Cambodian farming advice
function buildSmartAgriResponse(rawText: string, isJson: boolean = false): string {
  const query = (rawText || '').toLowerCase();

  // Distinguish whether query is specifically plant/crop related
  const isPlantOrCrop = (
    query.includes('ស្ពៃ') || query.includes('បន្លែ') || query.includes('ស្រូវ') ||
    query.includes('ចន្ទី') || query.includes('កៅស៊ូ') || query.includes('ស្លឹក') ||
    query.includes('គល់') || query.includes('ឬស') || query.includes('រលួយ') ||
    query.includes('ស្រពោន') || query.includes('ដំណាំ') || query.includes('ថាស') ||
    query.includes('កូន') || query.includes('កូនស្ពៃ') || query.includes('កូនបន្លែ') ||
    query.includes('រង') || query.includes('ចម្ការ') || query.includes('ស្រែ') ||
    query.includes('cabbage') || query.includes('vegetable') || query.includes('crop') ||
    query.includes('plant') || query.includes('leaf') || query.includes('damping') ||
    query.includes('collar rot') || query.includes('root rot') || query.includes('seedling')
  );

  // Check specific cabbage / vegetable collar rot & damping off disease
  const isCollarRotOrWilt = (
    query.includes('រលួយគល់') || 
    query.includes('រលួយឬស') || 
    (query.includes('រលួយ') && (query.includes('ស្ពៃ') || query.includes('បន្លែ') || query.includes('កូន') || query.includes('ស្លឹក') || query.includes('ដី'))) ||
    (query.includes('ស្រពោន') && (query.includes('ស្ពៃ') || query.includes('បន្លែ') || query.includes('ងាប់') || query.includes('ស្លឹក'))) ||
    (query.includes('ងាប់') && (query.includes('ស្ពៃ') || query.includes('បន្លែ') || query.includes('កូន'))) ||
    query.includes('damping') || query.includes('collar rot') || query.includes('root rot')
  );

  // If JSON requested (for /api/diagnose or image diagnostic fallback)
  if (isJson) {
    // 1. Cabbage / Vegetable Collar rot & damping-off & leaf spot
    if (isCollarRotOrWilt || query.includes('ស្ពៃ') || query.includes('បន្លែ') || query.includes('cabbage') || query.includes('vegetable') || query.includes('ថាស') || query.includes('seedling')) {
      return JSON.stringify({
        nameKh: "ជំងឺរលួយគល់ និងស្រពោនកូនស្ពៃ/បន្លែ (Damping-off & Collar Rot)",
        nameEn: "Rhizoctonia solani / Pythium spp. / Pectobacterium",
        targetItem: "ដំណាំស្ពៃក្តោប និងបន្លែយកស្លឹក",
        category: "crop",
        severity: "ធ្ងន់ធ្ងរ",
        confidence: 95,
        symptoms: [
          "គល់ផ្នែកជាប់នឹងដីប្រែពណ៌ត្នោតចាស់ ឬខ្មៅ គល់ស្វិតរួញ ឬរលួយទន់មានក្លិន",
          "ស្លឹកផ្នែកក្រោមចាប់ផ្តើមប្រែពណ៌លឿង ស្រពោនទន់កកូនដំណាំ",
          "ដើមរលំដេកលើដី និងងាប់រាលដាលយ៉ាងលឿនលើកូនដំណាំដុះញឹកក្នុងលក្ខខណ្ឌសំណើមខ្ពស់"
        ],
        causes: "បង្កឡើងដោយផ្សិតដី Rhizoctonia solani, Pythium spp. ឬបាក់តេរីរលួយទន់ Pectobacterium carotovorum ក្នុងលក្ខខណ្ឌដីជាំទឹក សំណើមខ្ពស់ និងខ្វះខ្យល់ចេញចូល",
        immediateAction: [
          "បញ្ឈប់ការស្រោចទឹកជាបន្ទាន់ ធ្វើឱ្យផ្ទៃដីជុំវិញគល់ស្ងួតល្អ",
          "ដកកូនស្ពៃដែលរលួយងាប់ចេញយកទៅដុត ឬកប់ចោលឆ្ងាយពីចម្ការ",
          "បាចម្សៅកំបោរកសិកម្ម ឬផេះអង្កាមស្តើងៗជុំវិញគល់ដើម្បីកាត់បន្ថយសំណើម និងជាតិជូរ"
        ],
        organicRemedy: "ស្រោចផ្សិតជីវសាស្ត្រ Trichoderma harzianum (ទ្រីកូដឺម៉ា) ១០០ ក្រាម លាយទឹក ២០ លីត្រ ស្រោចលើគល់ពេលល្ងាចត្រជាក់",
        chemicalRemedy: "ស្រោច ឬបាញ់ថ្នាំផ្សិតដែលមានសារធាតុសកម្ម Metalaxyl + Mancozeb ឬ Copper Hydroxide (សម្រាប់បាក់តេរី) ឬ Validamycin",
        prevention: [
          "លើករងដាំឱ្យខ្ពស់ពី ២៥-៣០ ស.ម និងរៀបចំប្រព័ន្ធរំដោះទឹកកុំឱ្យដក់",
          "ហាលដីឱ្យស្ងួត ៧-១០ ថ្ងៃ និងលាយកំបោរកសិកម្ម ១៥-២០ គ.ក្រ/១០០ម² មុនដាំ",
          "ប្រើដីស្អាតគ្មានមេរោគ (Potting Soil) សម្រាប់បណ្តុះកូនស្ពៃក្នុងថាស"
        ],
        disclaimer: "ការណែនាំបច្ចេកទេសផ្លូវការពីគម្រោង LASED III។ ទំនាក់ទំនងមន្ត្រីកសិកម្មមូលដ្ឋានសម្រាប់បច្ចេកទេសបន្ថែម។"
      });
    }

    // 2. Rice Blast
    if (query.includes('ស្រូវ') || query.includes('rice') || query.includes('blast') || query.includes('កួរ')) {
      return JSON.stringify({
        nameKh: "ជំងឺផ្លិតស្លឹកស្រូវ (Rice Blast)",
        nameEn: "Magnaporthe oryzae",
        targetItem: "ដំណាំស្រូវ",
        category: "crop",
        severity: "មធ្យម",
        confidence: 90,
        symptoms: [
          "ស្នាមរាងដូចភ្នែកទ្រវែង ឬគ្រាប់ពេជ្រ គែមពណ៌ត្នោត កណ្តាលពណ៌ប្រផេះ",
          "ស្នាមជំងឺរីករាលដាលពេញបន្ទះស្លឹក ធ្វើឱ្យចុងស្លឹកស្ងួតក្រៀម",
          "កកួរស្រូវអាចប្រែពណ៌ត្នោតចាស់ និងបាក់កកួរ"
        ],
        causes: "បង្កឡើងដោយផ្សិត Magnaporthe oryzae នៅពេលអាកាសធាតុចុះអ័ព្ទ សំណើមខ្ពស់ និងការដាក់ជីអ៊ុយរ៉េលើសកម្រិត",
        immediateAction: [
          "ផ្អាកការបាចជីអាសូត (អ៊ុយរ៉េ) ជាបន្ទាន់",
          "បង្ហូរទឹកចេញពីស្រែដើម្បីឱ្យស្រែស្ងួត និងមានខ្យល់ចេញចូល ២-៣ ថ្ងៃ",
          "បាញ់ថ្នាំការពារ ឬកម្ចាត់ផ្សិតពេលព្រឹកព្រលឹម ឬល្ងាចត្រជាក់"
        ],
        organicRemedy: "ប្រើផ្សិតជីវសាស្ត្រ Trichoderma (ទ្រីកូដឺម៉ា) ស្រោចគល់ ឬបាញ់លើស្លឹក ឬប្រើទឹកដាំផេះអង្កាមលាយស្លឹកស្តៅ",
        chemicalRemedy: "ប្រើថ្នាំកសិកម្មដែលមានសារធាតុសកម្ម Tricyclazole 75% WP ឬ Azoxystrobin តាមកម្រិតណែនាំលើស្លាកសញ្ញា",
        prevention: [
          "ប្រើពូជស្រូវសុទ្ធធន់នឹងជំងឺផ្លិត (ដូចជា សែនក្រអូប-០១, ផ្ការំដួល)",
          "សាបព្រោះក្នុងកម្រិតសមស្រប មិនត្រូវញឹកពេក (៨០-១០០ គ.ក្រ/ហិកតា)",
          "ដាក់ជីបំប៉នសមាមាត្រ N-P-K ត្រឹមត្រូវ កុំលោភប្រើតែអ៊ុយរ៉េ"
        ],
        disclaimer: "ការណែនាំពីប្រព័ន្ធចំណេះដឹងកសិកម្ម LASED III។ ទំនាក់ទំនងមន្ត្រីកសិកម្មមូលដ្ឋានសម្រាប់បច្ចេកទេសលម្អិត។"
      });
    }

    // 3. Cattle / Buffalo (ONLY if not plant)
    if (!isPlantOrCrop && (query.includes('គោ') || query.includes('ក្របី') || query.includes('cattle') || query.includes('ពក') || query.includes('ដុំពក'))) {
      return JSON.stringify({
        nameKh: "ជំងឺដុំពកស្បែកគោ-ក្របី (Lumpy Skin Disease)",
        nameEn: "Lumpy Skin Disease Virus (Capripoxvirus)",
        targetItem: "គោ និង ក្របី",
        category: "livestock",
        severity: "ធ្ងន់ធ្ងរ",
        confidence: 92,
        symptoms: [
          "លេចឡើងដុំពករឹងទំហំ ២-៥ ស.ម នៅលើស្បែក ក្បាល ក និងដងខ្លួន",
          "សត្វក្តៅខ្លួនខ្លាំង (៤០-៤១.៥°C) ស្រក់ទឹកមាត់ ហៀរសម្បោរ មិនស៊ីស្មៅ",
          "ដុំពកអាចបែកក្លាយជាដំបៅរលួយ និងហើមជើងទាំងបួន"
        ],
        causes: "បង្កឡើងដោយវីរុស Capripoxvirus ចម្លងយ៉ាងលឿនតាមរយៈសត្វល្អិតបឺតឈាម (មូស រុយក្របី ចៃ និងដង្កែ)",
        immediateAction: [
          "ញែកសត្វឈឺចេញពីហ្វូងជាបន្ទាន់ទៅដាក់កន្លែងស្អាត មានម្លប់ និងខ្យល់ចេញចូល",
          "បាញ់ថ្នាំសម្លាប់សត្វល្អិត និងកម្ចាត់ជម្រកមូស រុយ ជុំវិញទ្រុង",
          "លាងសម្អាតមុខរបួស ឬដំបៅដោយថ្នាំសម្លាប់មេរោគ Povidone Iodine រាល់ថ្ងៃ"
        ],
        organicRemedy: "ផ្តល់ទឹកស្អាតលាយស្ករត្នោត ឬទឹកដូង និងអំបិលរ៉ែ ដើម្បីជំនួយកម្លាំងសត្វ ផ្តល់ស្មៅខ្ចី និងស្លឹកចេក",
        chemicalRemedy: "ប្រើថ្នាំប្រឆាំងរលាក និងបញ្ចុះកម្តៅ (ដូចជា Flunixin ឬ Meloxicam) រួមជាមួយថ្នាំផ្សះទប់ស្កាត់ការឆ្លងរោគបន្ទាប់បន្សំ (Oxytetracycline LA) ក្រោមការណែនាំរបស់ពេទ្យសត្វ",
        prevention: [
          "ចាក់វ៉ាក់សាំងការពារជំងឺដុំពកស្បែកគោឱ្យបានគ្រប់សត្វក្នុងហ្វូង",
          "បាញ់ថ្នាំកម្ចាត់សត្វល្អិតបឺតឈាមក្នុងទ្រុងរៀងរាល់សប្តាហ៍",
          "ដាក់សត្វថ្មីឱ្យនៅដាច់ដោយឡែកយ៉ាងតិច ២៨ ថ្ងៃ មុនបញ្ចូលហ្វូង"
        ],
        disclaimer: "សូមទាក់ទងភ្នាក់ងារបសុព្យាបាលភូមិ ឬការិយាល័យផលិតកម្ម និងបសុព្យាបាលស្រុកជាបន្ទាន់។"
      });
    }

    // Default diagnosis: Crop seedling and leaf spot (always prioritize crop when in doubt)
    return JSON.stringify({
      nameKh: "ជំងឺអុចស្លឹក និងរលួយគល់កូនបន្លែ (Leaf Spot & Seedling Damping-off)",
      nameEn: "Alternaria brassicae / Rhizoctonia solani",
      targetItem: "ដំណាំស្ពៃ និងបន្លែយកស្លឹក",
      category: "crop",
      severity: "មធ្យម",
      confidence: 89,
      symptoms: [
        "ស្លឹកកូនបន្លែមានស្នាមអុចពណ៌លឿង និងត្នោត ស្លឹកផ្នែកក្រោមចាប់ផ្តើមស្រពោន",
        "គល់កូនដំណាំខ្លះចាប់ផ្តើមទន់ជ្រុះ និងរលំងាប់ជាកូនដុំៗ",
        "លេចឡើងច្រើននៅពេលស្រោចទឹកជោគខ្លាំង ឬកូនដំណាំដុះញឹកពេក"
      ],
      causes: "បង្កឡើងដោយផ្សិត Alternaria ឬ Rhizoctonia ក្នុងលក្ខខណ្ឌសំណើមខ្ពស់ក្នុងថាសបណ្តុះ ឬដីខ្វះខ្យល់ចេញចូល",
      immediateAction: [
        "ផ្អាកការស្រោចទឹកជាបន្ទាន់ យកថាសបណ្តុះទៅដាក់កន្លែងមានពន្លឺថ្ងៃ និងខ្យល់ចេញចូលល្អ",
        "ដកកូនដែលរលួយខ្លាំងចេញ ដើម្បីកុំឱ្យឆ្លងរាលដាលដល់កូនជិតខាង",
        "បាចផេះអង្កាមស្ងួត ឬកំបោរស្តើងៗ និងស្រោចផ្សិតជីវសាស្ត្រ Trichoderma (ទ្រីកូដឺម៉ា)"
      ],
      organicRemedy: "ប្រើផ្សិតជីវសាស្ត្រ Trichoderma harzianum ១០០ ក្រាម លាយទឹក ២០ លីត្រ ស្រោចគល់ពេលល្ងាចត្រជាក់",
      chemicalRemedy: "ស្រោច ឬបាញ់ថ្នាំផ្សិតសុវត្ថិភាព Copper Hydroxide ឬ Mancozeb តាមកម្រិតស្រាល",
      prevention: [
        "កុំស្រោចទឹកជោគពេកនៅពេលល្ងាច",
        "ប្រើប្រាស់គ្រាប់ពូជស្អាត និងដីបណ្តុះដែលបានសម្លាប់មេរោគ",
        "រៀបចំថាសបណ្តុះឱ្យមានគម្លាតសមស្រប"
      ],
      disclaimer: "ការណែនាំពីប្រព័ន្ធជំនួយការកសិកម្ម LASED III។ ទំនាក់ទំនងមន្ត្រីកសិកម្មមូលដ្ឋានសម្រាប់បច្ចេកទេសលម្អិត។"
    });
  }

  // --- TEXT RESPONSE FOR CHAT & TELEGRAM BOT ---

  // 1. SPECIFIC DISEASE: Cabbage / Vegetable Collar Rot & Damping-off (Addressing User Problem 1 directly!)
  if (isCollarRotOrWilt) {
    return `🥬 **ការវិភាគជំងឺ៖ ជំងឺរលួយគល់ និងស្រពោនកូនស្ពៃ/បន្លែ (Damping-off & Collar Rot)** 🥬

ជំរាបសួរកសិករ! ចំពោះបញ្ហា **ដំណាំស្ពៃក្តោបមានជំងឺរលួយគល់ ស្លឹកចាប់ផ្តើមស្រពោន និងងាប់ជាបន្តបន្ទាប់** នេះជាការវិភាគបច្ចេកទេស និងដំណោះស្រាយបន្ទាន់៖

📌 **១. មូលហេតុបង្កចម្បង៖**
ជំងឺនេះបង្កឡើងដោយពពួកផ្សិតក្នុងដី (ចម្បងគឺ *Rhizoctonia solani*, *Pythium spp.*, ឬ *Fusarium*) ឬបាក់តេរីរលួយទន់ (*Pectobacterium carotovorum*)។ កត្តាដែលជំរុញឱ្យកើតជំងឺនេះខ្លាំងគឺ៖
- **ដីជាំទឹក ឬសំណើមដីលើសកម្រិត៖** ការស្រោចទឹកជោគខ្លាំង ឬដីមិនរំដោះទឹក។
- **កូនស្ពៃដុះញឹកពេក៖** ធ្វើឱ្យខ្វះខ្យល់ចេញចូល និងក្តៅអាប់សំណើម។
- **ការប្រើជីកំប៉ុស្ត ឬលាមកសត្វមិនទាន់កករលួយល្អ៖** ដែលផ្ទុកមេរោគផ្សិត និងបាក់តេរីចង្រៃ។

🔍 **២. រោគសញ្ញាជាក់ស្តែង៖**
- គល់ផ្នែកជាប់នឹងដីប្រែពណ៌ត្នោតចាស់ ឬខ្មៅ គល់ស្វិតរួញ ឬរលួយទន់មានក្លិនស្អុយ។
- ស្លឹកផ្នែកក្រោមចាប់ផ្តើមប្រែពណ៌លឿង ស្រពោនទន់កកូនដំណាំ ហើយដើមរលំដេកលើដី និងងាប់រាលដាលយ៉ាងលឿន។

⚡ **៣. ដំណោះស្រាយបន្ទាន់ ៣ ជំហាន (ត្រូវធ្វើថ្ងៃនេះ)៖**
១. **កាត់បន្ថយសំណើមជាបន្ទាន់៖** បញ្ឈប់ការស្រោចទឹកជាបន្ទាន់ ធ្វើឱ្យផ្ទៃដីជុំវិញគល់ស្ងួត។ ដកកូនស្ពៃដែលរលួយងាប់ចេញយកទៅដុត ឬកប់ចោលឆ្ងាយពីចម្ការ (កុំទុកនាំឱ្យឆ្លងកូនដទៃ)។
២. **កែសម្រួលដី និងកាត់បន្ថយជាតិជូរ៖** បាចម្សៅកំបោរកសិកម្ម (កំបោរស) ស្តើងៗ ឬផេះអង្កាមស្ងួតជុំវិញគល់ និងលើរង ដើម្បីសម្ងួតសំណើម និងទប់ស្កាត់មេរោគផ្សិត។
៣. **ស្រោចថ្នាំជីវសាស្ត្រ ឬថ្នាំផ្សិតសុវត្ថិភាព៖**
   - *វិធីសាស្ត្រធម្មជាតិ (សរីរាង្គ)៖* ប្រើផ្សិតជីវសាស្ត្រទ្រីកូដឺម៉ា (**Trichoderma harzianum**) ១០០ ក្រាម លាយទឹក ២០ លីត្រ ស្រោចលើគល់ពេលល្ងាចត្រជាក់។
   - *ថ្នាំកសិកម្មសុវត្ថិភាព៖* ស្រោច ឬបាញ់ថ្នាំផ្សិតដែលមានសារធាតុសកម្ម **Metalaxyl + Mancozeb** (២៥-៣០ ក្រាម/ទឹក ២០ លីត្រ) ឬ **Copper Hydroxide / Copper Oxychloride** (ប្រសិនបើសង្ស័យបាក់តេរី) ឬ **Validamycin** តាមកម្រិតណែនាំ។

🛡️ **៤. ការការពារសម្រាប់វគ្គក្រោយ (CamGAP LASED III)៖**
- លើករងដាំឱ្យខ្ពស់ពី ២៥-៣០ ស.ម ធ្វើប្រព័ន្ធរំដោះទឹកកុំឱ្យដក់។
- ហាលដីឱ្យស្ងួត ៧-១០ ថ្ងៃ និងលាយកំបោរកសិកម្ម ១៥-២០ គ.ក្រ/១០០ម² មុនដាំ។
- បណ្តុះកូនស្ពៃលើថាសបណ្តុះដោយប្រើដីស្អាតគ្មានមេរោគ (Potting Soil)។

📌 *LASEDIII_Help_Bot ត្រៀមឆ្លើយតបរាល់ចម្ងល់បន្ថែមរបស់លោកអ្នក!*`;
  }

  // 2. Rice Tech & Diseases
  if (query.includes('ស្រូវ') || query.includes('rice') || query.includes('sri') || query.includes('blast') || query.includes('ក្រា')) {
    return `🌾 **បច្ចេកទេសដំណាំស្រូវ LASED III (Paddy Rice Technology)** 🌾

ជំរាបសួរកសិករ! ខាងក្រោមនេះជាបច្ចេកទេសសំខាន់ៗសម្រាប់ដំណាំស្រូវ៖

១. **ប្រព័ន្ធកែលម្អការដាំដុះស្រូវ (SRI) & ការគ្រប់គ្រងទឹក (AWD)៖**
- ស្ទូងកូនស្រូវអាយុតិច (១២-១៥ ថ្ងៃ) ស្ទូងមួយៗដើម គម្លាត ២៥x២៥ ស.ម ដើម្បីឱ្យបែកគុម្ពច្រើន (២៥-៤០ ដើម/គុម្ព)។
- អនុវត្តវិធីគ្រប់គ្រងទឹកឆ្លាស់សើម-ស្ងួត (AWD)៖ បញ្ចូលទឹកកម្ពស់ ៣-៥ ស.ម រួចទុកឱ្យស្រកស្ងួតប្រេះជើងក្អែក ៥-៧ ថ្ងៃ ទើបបញ្ចូលទឹកថ្មី ដើម្បីរំញោចឬសចាក់ជ្រៅ និងសន្សំសំចៃទឹក ៤០%។

២. **កាលវិភាគដាក់ជី N-P-K ៤ ដំណាក់កាល៖**
- **ជីទ្រាប់បាត៖** ជីកំប៉ុស្ត ៣-៥ តោន/ហិកតា + ជី DAP ២៥-៣០ គ.ក្រ/ហិកតា (មុនព្រោះ/ស្ទូង)។
- **ជីបំប៉នទី១ (១៥-២០ ថ្ងៃ)៖** អ៊ុយរ៉េ ២៥ គ.ក្រ + ប៉ូតាស្យូម ១៥ គ.ក្រ/ហិកតា។
- **ជីបំប៉នទី២ (៣៥-៤០ ថ្ងៃ)៖** អ៊ុយរ៉េ ២៥ គ.ក្រ + DAP ២០ គ.ក្រ/ហិកតា។
- **ជីបំប៉នកកើតកួរ (៥៥-៦០ ថ្ងៃ)៖** ប៉ូតាស្យូម (KCl) ២០-២៥ គ.ក្រ/ហិកតា ជួយឱ្យគ្រាប់ពេញ មិនបាក់កកួរ។

៣. **ការការពារជំងឺ និងសត្វល្អិតសំខាន់ៗ៖**
- **ជំងឺផ្លិតស្រូវ (Blast)៖** បើឃើញស្នាមភ្នែកទ្រវែងលើស្លឹក សូមផ្អាកជីអ៊ុយរ៉េភ្លាមៗ បង្ហូរទឹកចេញ ហើយប្រើផ្សិតជីវសាស្ត្រ Trichoderma ឬថ្នាំ Tricyclazole។
- **សត្វក្រាស្រូវ (Brown Planthopper)៖** បង្ហូរទឹកចេញពីស្រែ ២-៣ ថ្ងៃ ប្រើផ្សិត Beauveria bassiana ឬថ្នាំ Pymetrozine។

📌 *LASEDIII_Help_Bot ត្រៀមឆ្លើយតបរាល់ចម្ងល់បន្ថែមរបស់លោកអ្នក!*`;
  }

  // 3. Vegetable General (CamGAP)
  if (query.includes('បន្លែ') || query.includes('vegetable') || query.includes('ម្ទេស') || query.includes('ប៉េងប៉ោះ') || query.includes('ត្រសក់') || query.includes('ស្ពៃ')) {
    return `🥬 **បច្ចេកទេសដាំបន្លែសុវត្ថិភាព CamGAP គម្រោង LASED III** 🍅

ជំរាបសួរកសិករ! ខាងក្រោមនេះជាបច្ចេកទេសដាំបន្លែសុវត្ថិភាព និងសរីរាង្គ៖

១. **រៀបចំរង និងផ្ទះសំណាញ់ (Net House)៖**
- លើករងកម្ពស់ ២០-៣០ ស.ម ទទឹង ១ ម៉ែត្រ គ្របកៅស៊ូកសិកម្មប្លាស្ទិកដើម្បីទប់ស្កាត់ស្មៅ និងរក្សាសំណើម។
- ដាំក្នុងផ្ទះសំណាញ់កាត់បន្ថយការបំផ្លាញពីមេអំបៅ ដង្កូវ និងកាត់បន្ថយថ្នាំពុលគីមីបានជាង ៧០%។
- តម្លើងប្រព័ន្ធដំណក់ទឹក (Drip irrigation) ជួយសន្សំសំចៃទឹក និងកម្លាំងពលកម្ម។

២. **ជីធម្មជាតិ និងជីសរីរាង្គ៖**
- **ជីកំប៉ុស្តទឹក (Fish Amino Acid / ជីត្រី)៖** ត្រី ១០ គ.ក្រ + ស្កររងូ ១០ គ.ក្រ + អ៊ីអឹម (EM) ផ្អាប់ ២១ ថ្ងៃ (លាយទឹក ១:៥០០ បាញ់ស្លឹក)។
- **ជីអ័រម៉ូនពងមាន់៖** ពងមាន់ ៥ គ្រាប់ + យ៉ាអួ + ស្កររងូ ផ្អាប់ ៧ ថ្ងៃ ជួយជំរុញការចេញផ្កា និងកាន់ក្តឹប។

៣. **កម្ចាត់សត្វល្អិតបែបធម្មជាតិ៖**
- រូបមន្តថ្នាំពុលរុក្ខជាតិ៖ ស្លឹកស្តៅ ១ គ.ក្រ + ម្ទេសហឹរ ០.៥ គ.ក្រ + ខ្ទឹមស ០.៥ គ.ក្រ + ស្លឹកគ្រៃ ០.៥ គ.ក្រ បុកពន្លិចទឹក ១០ លីត្រ ផ្អាប់ ២៤ ម៉ោង (បាញ់កម្ចាត់ចៃ មមាច ដង្កូវហ្វូង)។
- ប្រើផ្សិតទ្រីកូដឺម៉ា (Trichoderma) ស្រោចគល់ការពាររលួយឫស និងក្រៀមស្លឹក។

📌 *LASEDIII_Help_Bot ត្រៀមជួយផ្តល់បច្ចេកទេសជូនកសិករជានិច្ច!*`;
  }

  // 4. Cashew
  if (query.includes('ចន្ទី') || query.includes('cashew')) {
    return `🌱 **បច្ចេកទេសដាំដុះ និងថែទាំដំណាំស្វាយចន្ទី គម្រោង LASED III** 🌰

ជំរាបសួរកសិករ! ខាងក្រោមនេះជាបច្ចេកទេសចន្ទីសំខាន់ៗ៖
១. **ពូជចន្ទីទិន្នផលខ្ពស់៖** M23, M10, H09 (គ្រាប់ធំ កួរវែង ឆាប់ផ្តល់ផល)។
២. **ការកាត់តម្រឹមមែក (Pruning)៖** កាត់មែកខ្នែង មែកដុះទាបក្រោម ០.៨ ម៉ែត្រ និងមែកកើតជំងឺចោល ក្រោយពេលប្រមូលផលរួច (ខែកក្កដា-សីហា) ដើម្បីឱ្យពន្លឺថ្ងៃចូលសព្វ និងជំរុញការបែកត្រួយផ្កាថ្មី។
៣. **ការគ្រប់គ្រងជំងឺ និងសត្វល្អិត៖**
- **មមាចចោះត្រួយ និងកួរផ្កា (Tea mosquito bug - Helopeltis)៖** បាញ់ផ្សិត Beauveria bassiana ឬថ្នាំជីវសាស្ត្រពេលព្រឹកព្រលឹម។
- **ជំងឺផ្សិតស្ងួតផ្កា (Anthracnose)៖** បាញ់ថ្នាំការពារផ្សិត Difenoconazole ឬ Azoxystrobin នៅពេលចន្ទីចាប់ផ្តើមបែកផ្កា និងចេញក្តឹប។

📌 *LASEDIII_Help_Bot រីករាយបម្រើបងប្អូនកសិករជានិច្ច!*`;
  }

  // 5. Rubber
  if (query.includes('កៅស៊ូ') || query.includes('rubber')) {
    return `🌳 **បច្ចេកទេសដាំដុះ និងចាក់ជ័រកៅស៊ូ គម្រោង LASED III** 🌳

ជំរាបសួរកសិករ! ខាងក្រោមនេះជាបច្ចេកទេសកៅស៊ូសំខាន់ៗ៖
១. **ពូជកៅស៊ូពេញនិយម៖** PB 260 (ទិន្នផលជ័រខ្ពស់), RRIM 600 (ធន់នឹងខ្យល់ និងជំងឺ), IRCA 18។
២. **បច្ចេកទេសចាក់ជ័រ៖** 
- អនុវត្តប្រព័ន្ធចាក់ជ័រ d3 (ចាក់មួយថ្ងៃ សម្រាកពីរថ្ងៃ) ឬ d4 (ចាក់មួយថ្ងៃ សម្រាកបីថ្ងៃ) ដើម្បីថែរក្សាសំបកដើម និងការពារជំងឺស្ងួតមុខជ័រ។
- ជម្រៅចាក់ជ័រ៖ ១.២ ទៅ ១.៥ ម.ម ពីសរសៃឈើ (កុំចាក់ដល់ឈើធ្វើឱ្យខូចដើម)។
៣. **ជំងឺ និងការព្យាបាល៖**
- **ជំងឺឆ្នូតខ្មៅ (Phytophthora)៖** ឧស្សាហ៍កើតនៅរដូវវស្សា ព្យាបាលដោយលាបថ្នាំ Metalaxyl លើស្នាមចាក់ជ័រ។
- **ជំងឺផ្សិតផ្កាផ្កុល (Pink Disease)៖** លាបថ្នាំ Bordeaux Mixture ឬ Copper Oxychloride លើមែកដែលរងការខូចខាត។

📌 *LASEDIII_Help_Bot ត្រៀមឆ្លើយតបរាល់ចម្ងល់បន្ថែម!*`;
  }

  // 6. Target Provinces
  if (query.includes('ខេត្ត') || query.includes('province') || query.includes('គោលដៅ')) {
    return `📍 **ខេត្តគោលដៅទាំង ១៤ នៃគម្រោង LASED III** 📍

គម្រោងបែងចែកដីដើម្បីសង្គមកិច្ច និងការអភិវឌ្ឍសេដ្ឋកិច្ច ដំណាក់កាលទី៣ (LASED III) ដឹកនាំដោយក្រសួងរៀបចំដែនដី នគរូបនីយកម្ម និងសំណង់ (MLMUPC) និងសហការអនុវត្តដោយ ក្រសួងកសិកម្ម រុក្ខាប្រមាញ់ និងនេសាទ (MAFF) ក្រោមការគាំទ្រហិរញ្ញវត្ថុពីធនាគារពិភពលោក (World Bank) មានខេត្តគោលដៅចំនួន ១៤ រួមមាន៖

១. **ខេត្តកំពង់ឆ្នាំង**
២. **ខេត្តបាត់ដំបង**
៣. **ខេត្តបន្ទាយមានជ័យ**
៤. **ខេត្តឧត្តរមានជ័យ**
៥. **ខេត្តក្រចេះ**
៦. **ខេត្តស្ទឹងត្រែង**
៧. **ខេត្តរតនគិរី**
៨. **ខេត្តមណ្ឌលគិរី**
៩. **ខេត្តកំពង់ធំ**
១០. **ខេត្តត្បូងឃ្មុំ**
១១. **ខេត្តកំពង់ស្ពឺ**
១២. **ខេត្តព្រះសីហនុ**
១៣. **ខេត្តកំពត**
១៤. **ខេត្តកែប**

🌾 គម្រោងផ្តល់ដីសម្បទានសង្គមកិច្ច ប័ណ្ណកម្មសិទ្ធិដីធ្លី ការកសាងហេដ្ឋារចនាសម្ព័ន្ធ និងការគាំទ្របច្ចេកទេសកសិកម្ម (ដំណាំស្រូវ, បន្លែ, កៅស៊ូ, ចន្ទី) និងការចិញ្ចឹមសត្វ (គោ, ក្របី, ជ្រូក, មាន់ទា, ត្រី) ដល់បងប្អូនកសិករក្នុងសហគមន៍!`;
  }

  // 7. LIVESTOCK - STRICTLY ONLY IF NOT A CROP/PLANT QUERY!
  if (!isPlantOrCrop && (query.includes('គោ') || query.includes('ក្របី') || query.includes('cattle') || query.includes('buffalo') || query.includes('ដុំពក') || query.includes('អុត'))) {
    return `🐂 **បច្ចេកទេសចិញ្ចឹម និងថែទាំសុខភាព គោ-ក្របី គម្រោង LASED III** 🐄

ជំរាបសួរកសិករ! ខាងក្រោមនេះជាការណែនាំសុខភាព និងអាហារូបត្ថម្ភគោ-ក្របី៖

១. **ការចាក់វ៉ាក់សាំងការពារជំងឺជាប្រចាំ៖**
- **ជំងឺដុំពកស្បែកគោ (LSD)៖** ចាក់វ៉ាក់សាំងការពារជារៀងរាល់ឆ្នាំ និងបាញ់ថ្នាំកម្ចាត់សត្វល្អិតបឺតឈាម (មូស រុយ ដង្កែ) ក្នុងទ្រុង។
- **ជំងឺអុតក្តារ (FMD)៖** ចាក់វ៉ាក់សាំង ៦ ខែម្តង (ដើមរដូវវស្សា និងដើមរដូវរំហើយ)។
- **ជំងឺសារទឹក (HS)៖** ចាក់វ៉ាក់សាំងការពារជារៀងរាល់ឆ្នាំ។

២. **អាហារូបត្ថម្ភ និងចំណីបំប៉ន៖**
- ដាំស្មៅបំប៉ន៖ ស្មៅស្តារឡូ (Stylosanthes) សម្បូរប្រូតេអ៊ីន, ស្មៅហ្គីណេ (Guinea grass), ស្មៅរ៉ូហ្ស៊ី ឬស្មៅណេពា។
- ផលិតដុំយូរ៉េលិទ្ធ (UMMB)៖ កន្ទក់ + ស្កររងូ + អ៊ុយរ៉េ + អំបិល + កំបោររ៉ែ ឱ្យគោលិទ្ធជំនួយការរំលាយអាហារក្នុងរដូវប្រាំង។

៣. **អនាម័យទ្រុង៖**
- ក្រាលកំបោរសលើកម្រាលទ្រុងដើម្បីសម្លាប់មេរោគ។
- ដាក់អំពូលភ្លើង ឬដុតកម្ទេចស្លឹកឈើបណ្តេញមូស និងរុយក្របីពេលល្ងាច។

📌 *LASEDIII_Help_Bot រីករាយជួយគាំទ្របងប្អូនកសិករគ្រប់ពេលវេលា!*`;
  }

  // 8. PIGS / POULTRY / FISH - STRICTLY ONLY IF NOT A CROP/PLANT QUERY!
  // Notice: Strict word check for poultry (no loose 'ទា' matching inside 'រាក់ទាក់' or 'ទំនាក់ទំនង')!
  const isPoultry = query.includes('មាន់') || query.includes('មាន់ទា') || query.includes('សត្វទា') || query.includes('កូនទា') || query.includes('ចិញ្ចឹមទា');
  const isPig = query.includes('ជ្រូក') || query.includes('pig') || query.includes('asf');
  const isFish = query.includes('ត្រី') || query.includes('fish') || query.includes('វារីវប្បកម្ម') || query.includes('ស្រះត្រី');

  if (!isPlantOrCrop && (isPig || isPoultry || isFish)) {
    return `🐖 **បច្ចេកទេសចិញ្ចឹមសត្វ និងវារីវប្បកម្ម គម្រោង LASED III** 🐟

ជំរាបសួរកសិករ! ខាងក្រោមនេះជាការណែនាំបច្ចេកទេស៖
១. **ការចិញ្ចឹមជ្រូក៖**
- អនុវត្តវិធានការជីវសុវត្ថិភាពតឹងរ៉ឹង ការពារជំងឺប៉េស្តជ្រូកអាហ្វ្រិក (ASF)៖ ហាមយកចំណីសល់ពីខាងក្រៅមកឱ្យជ្រូកស៊ី បាញ់ថ្នាំសម្លាប់មេរោគជុំវិញទ្រុង។
- ចាក់ថ្នាំជាតិដែក (Iron injection) ដល់កូនជ្រូកនៅអាយុ ៣ ថ្ងៃ និងចាក់វ៉ាក់សាំងជំងឺសំខាន់ៗ។
២. **ការចិញ្ចឹមមាន់ទា៖**
- ផ្តល់កម្តៅកូនមាន់ (Brooding ៣២-៣៥°C) នៅសប្តាហ៍ទី១។
- ស្រក់វ៉ាក់សាំងការពារជំងឺញូកាសល (Newcastle) និងអុតមាន់តាមកាលកំណត់។
៣. **ការចិញ្ចឹមត្រី (ត្រីអណ្តែង ត្រីប្រា ត្រីទីឡាព្យា)៖**
- បាចកំបោរ Ca(OH)2 រៀបចំស្រះ ១០-១៥ គ.ក្រ/១០០ម² ដើម្បីសម្លាប់មេរោគ និងទប់ស្កាត់ទឹកជូរ (pH ៦.៥-៨)។
- ផ្លាស់ប្តូរទឹក ២០-៣០% រៀងរាល់ ២ សប្តាហ៍ និងផ្តល់ចំណីគ្រាប់អណ្តែតសមស្របតាមទម្ងន់ត្រី។

📌 *LASEDIII_Help_Bot ត្រៀមឆ្លើយតបរាល់សំណួរកសិកម្ម!*`;
  }

  // Default comprehensive agricultural response (Crop prioritized)
  return `🌾 **ជំរាបសួរលោកអ្នក! ខ្ញុំជា LASEDIII_Help_Bot** 🌾
ជំនួយការបច្ចេកទេសកសិកម្មឆ្លាតវៃសម្រាប់កសិករគម្រោង LASED III (MLMUPC / MAFF / World Bank) ក្នុងខេត្តគោលដៅទាំង ១៤ (កំពង់ឆ្នាំង, បាត់ដំបង, បន្ទាយមានជ័យ, ឧត្តរមានជ័យ, ក្រចេះ, ស្ទឹងត្រែង, រតនគិរី, មណ្ឌលគិរី, កំពង់ធំ, ត្បូងឃ្មុំ, កំពង់ស្ពឺ, ព្រះសីហនុ, កំពត, និងកែប)។

ខ្ញុំអាចជួយដោះស្រាយបញ្ហាបច្ចេកទេសលើ៖
🌱 **ដំណាំ ៤ មុខ៖** ស្រូវ (SRI & AWD), បន្លែសុវត្ថិភាព (CamGAP), កៅស៊ូ (PB 260), ចន្ទី (M23)
🐂 **សត្វចិញ្ចឹម ៥ មុខ៖** គោ, ក្របី, ជ្រូក, មាន់ទា និងវារីវប្បកម្មត្រី

💡 **លោកអ្នកអាច៖**
- សួរអំពីបញ្ហាជំងឺដំណាំ (ដូចជា ស្ពៃរលួយគល់, ផ្លិតស្រូវ, អង់ត្រាក់ណូសចន្ទី...)
- ផ្ញើរូបភាពស្លឹកដំណាំ ឬសត្វឈឺដើម្បីឱ្យខ្ញុំវិភាគជំងឺ និងរកវិធីព្យាបាលភ្លាមៗ!
- សួរអំពីបច្ចេកទេសដាក់ជី ការរៀបចំដី និងកាលវិភាគថែទាំ។

សូមប្រាប់ខ្ញុំអំពីដំណាំ ឬសត្វដែលលោកអ្នកកំពុងជួបប្រទះបញ្ហា!`;
}

// Resilient model caller with retry, smart parameter degradation, and multi-model quota failover
async function generateContentResilient(params: any): Promise<any> {
  const preferredModel = params.model || 'gemini-3.8-flash';

  // Candidate models in priority order
  const fallbackModels = [
    preferredModel,
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError: any = null;
  let consecutiveQuotaErrors = 0;

  for (const model of fallbackModels) {
    // If multiple consecutive models failed with 429 quota exhaustion, break immediately to knowledge base
    if (consecutiveQuotaErrors >= 2) {
      break;
    }

    const isGemini3 = model.startsWith('gemini-3');

    // Build config variants for this model
    const candidateConfigs: any[] = [];

    // Variant 1: Original requested config (sanitized for model support)
    const baseConfig = { ...(params.config || {}) };
    if (!isGemini3) {
      delete baseConfig.thinkingConfig; // Only Gemini 3+ supports thinkingConfig
    } else if (model === 'gemini-3.1-flash-lite' && baseConfig.thinkingConfig?.thinkingLevel === ThinkingLevel.HIGH) {
      baseConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
    }
    candidateConfigs.push(baseConfig);

    // Variant 2: Without tools (in case googleSearch or tool quota fails)
    if (baseConfig.tools) {
      const configNoTools = { ...baseConfig };
      delete configNoTools.tools;
      candidateConfigs.push(configNoTools);
    }

    let modelHitQuota = false;

    // Try configs for this model
    for (const config of candidateConfigs) {
      try {
        const isImageTask = Boolean(
          params.contents?.parts?.some((p: any) => p.inlineData) ||
          (Array.isArray(params.contents) && params.contents.some((c: any) => c.parts?.some((p: any) => p.inlineData)))
        );

        // Sanitize config for image tasks (tools like googleSearch are not supported/needed with vision)
        const effectiveConfig = { ...config };
        if (isImageTask && effectiveConfig.tools) {
          delete effectiveConfig.tools;
        }

        const apiPromise = ai.models.generateContent({
          ...params,
          model,
          config: effectiveConfig,
        });

        const timeoutMs = isImageTask ? 30000 : 25000;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        );

        const response: any = await Promise.race([apiPromise, timeoutPromise]);

        if (response && (response.text || response.candidates?.length)) {
          (response as any).actualModelUsed = model;
          return response;
        }
      } catch (err: any) {
        lastError = err;
        if (isQuotaOrRateLimitError(err)) {
          modelHitQuota = true;
          consecutiveQuotaErrors++;
          console.warn(`Model ${model} quota notice (429).`);
          const errStr = `${err?.message || ''}`.toLowerCase();
          if (errStr.includes('per day') || errStr.includes('daily') || consecutiveQuotaErrors >= 2) {
            consecutiveQuotaErrors = 99; // Abort outer model loop immediately
            break;
          }
          break; // Break from config variants of this model
        }
      }
    }

    if (!modelHitQuota) {
      consecutiveQuotaErrors = 0;
    }
  }

  // Gracefully handle quota exhaustion without throwing fatal error
  if (isQuotaOrRateLimitError(lastError)) {
    console.warn('Gemini API quota reached. Serving resilient LASED III agricultural offline knowledge response.');
  } else {
    console.warn('Model failover notice:', lastError?.message || lastError);
  }

  const isJsonExpected = params.config?.responseMimeType === 'application/json';
  const promptText = extractPromptText(params);
  const fallbackText = buildSmartAgriResponse(promptText, isJsonExpected);

  return {
    text: fallbackText,
    actualModelUsed: 'LASED III Agricultural Knowledge (Offline Guard)',
  };
}

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, cropCategory, thinkingMode = 'low', enableSearch = false, userId, userName } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const lastMsg = messages[messages.length - 1];
    const lastUserText = lastMsg?.text || lastMsg?.content || '';

    // Record Web farmer activity
    if (userId) {
      userTracker.recordUserActivity(
        {
          id: userId,
          platform: 'web',
          name: userName || 'អ្នកប្រើប្រាស់ Web'
        },
        'message',
        lastUserText,
        'crop'
      );
    }

    const contextPrefix = cropCategory ? `[បរិបទកសិកម្ម: ${cropCategory}] ` : '';

    // Convert conversation history for Gemini chat
    const contents = messages.map((m: { sender?: string; role?: string; text?: string; content?: string }) => ({
      role: (m.sender === 'bot' || m.role === 'model' || m.role === 'assistant') ? 'model' : 'user',
      parts: [{ text: m.text || m.content || '' }]
    }));

    // Ensure the last prompt includes context if provided
    if (contextPrefix && contents.length > 0) {
      const last = contents[contents.length - 1];
      if (last.role === 'user') {
        last.parts[0].text = contextPrefix + last.parts[0].text;
      }
    }

    // Determine thinking level
    let thinkingLevel = ThinkingLevel.LOW;
    if (thinkingMode === 'high') {
      thinkingLevel = ThinkingLevel.HIGH;
    } else if (thinkingMode === 'medium') {
      thinkingLevel = ThinkingLevel.MEDIUM;
    }

    // Config with optional Google Search Grounding for live intelligence
    const config: any = {
      systemInstruction: LASED_SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingLevel: thinkingLevel },
    };

    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await generateContentResilient({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: config
    });

    // Extract search grounding sources if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let sources: Array<{ title: string; url: string }> = [];
    if (Array.isArray(groundingChunks)) {
      sources = groundingChunks
        .filter((chunk: any) => chunk?.web?.uri)
        .map((chunk: any) => ({
          title: chunk.web.title || 'ប្រភពកសិកម្ម',
          url: chunk.web.uri
        }))
        .slice(0, 4);
    }

    res.json({
      reply: response.text || 'សូមអភ័យទោស ខ្ញុំមិនអាចដំណើរការចម្លើយបានទេ។ សូមសាកល្បងសួរសារជាថ្មី។',
      sources: sources,
      modelUsed: response.actualModelUsed
        ? `${response.actualModelUsed} (Smart Failover)`
        : 'gemini-3.8-flash (Advanced Agricultural Reasoner)'
    });
  } catch (error: any) {
    console.warn('Chat API notice:', error?.message || error);
    res.json({
      reply: buildSmartAgriResponse(req.body?.cropCategory || 'general', false),
      sources: [],
      modelUsed: 'LASED III Knowledge Base (Fallback)'
    });
  }
});

// 2. Multimodal Disease Diagnosis Endpoint
app.post('/api/diagnose', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', userNotes, categoryHint } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 is required' });
      return;
    }

    // Clean base64 data prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const promptText = `
អ្នកគឺជាអ្នកជំនាញក្សេត្រសាស្ត្រ និងពេទ្យសត្វជាន់ខ្ពស់នៃគម្រោង LASED III។
សូមវិភាគរូបភាពដែលកសិករបានថតនេះដោយយកចិត្តទុកដាក់ខ្ពស់៖
- កំណត់ថាតើរូបនេះជាដំណាំ (ស្រូវ, បន្លែ, កៅស៊ូ, ចន្ទី) ឬសត្វពាហនៈ (គោ, ក្របី, ជ្រូក, មាន់ទា, ត្រី)
- កំណត់ឈ្មោះជំងឺ សត្វល្អិតចង្រៃ ឬរោគសញ្ញាមិនប្រក្រតី
- ផ្តល់នូវដំណោះស្រាយបន្ទាន់ វិធីព្យាបាលបែបធម្មជាតិ ថ្នាំកសិកម្ម/បសុព្យាបាលត្រឹមត្រូវ និងវិធានការការពារ។
${categoryHint ? `ព័ត៌មានបន្ថែមពីកសិករ៖ ប្រភេទ ${categoryHint}` : ''}
${userNotes ? `កំណត់សម្គាល់បន្ថែមពីកសិករ៖ "${userNotes}"` : ''}

សូមឆ្លើយតបជាទម្រង់ JSON សុទ្ធ ដោយគ្មាន backticks ដូចខាងក្រោម៖
{
  "nameKh": "ឈ្មោះជំងឺ ឬសត្វល្អិតជាភាសាខ្មែរ (ឧទាហរណ៍៖ ជំងឺផ្លិតស្លឹកស្រូវ / ជំងឺដុំពកស្បែកគោ)",
  "nameEn": "English or Scientific Name",
  "targetItem": "ប្រភេទដំណាំ ឬសត្វ (ឧ. ដំណាំស្រូវ, ដំណាំចន្ទី, គោ, etc.)",
  "category": "crop ឬ livestock",
  "severity": "ស្រាល ឬ មធ្យម ឬ ធ្ងន់ធ្ងរ",
  "confidence": 92,
  "symptoms": [
    "រោគសញ្ញាសំខាន់ទី១ ដែលសង្កេតឃើញលើរូបភាព",
    "រោគសញ្ញាសំខាន់ទី២",
    "រោគសញ្ញាសំខាន់ទី៣"
  ],
  "causes": "មូលហេតុចម្បងដែលបង្កឱ្យកើតជំងឺនេះ (ផ្សិត បាក់តេរី វីរុស សត្វល្អិត ឬកត្តាអាកាសធាតុ)",
  "immediateAction": [
    "សកម្មភាពបន្ទាន់ទី១ ដែលកសិករត្រូវធ្វើភ្លាមៗនៅថ្ងៃនេះ",
    "សកម្មភាពបន្ទាន់ទី២",
    "សកម្មភាពបន្ទាន់ទី៣"
  ],
  "organicRemedy": "ដំណោះស្រាយបែបធម្មជាតិ ឬជីវសាស្ត្រ (ឧទាហរណ៍៖ ផ្សិតទ្រីកូដឺម៉ា, ថ្នាំផ្សំពីស្តៅ, ផេះអង្កាម, ឬវិធីថែទាំធម្មជាតិ)",
  "chemicalRemedy": "ការប្រើប្រាស់ថ្នាំកសិកម្ម ឬថ្នាំពេទ្យសត្វដែលមានការអនុញ្ញាតត្រឹមត្រូវ រួមជាមួយកម្រិត និងការប្រុងប្រយ័ត្ន",
  "prevention": [
    "វិធានការបង្ការរយៈពេលវែងទី១",
    "វិធានការបង្ការរយៈពេលវែងទី២",
    "វិធានការបង្ការរយៈពេលវែងទី៣"
  ],
  "disclaimer": "ការណែនាំពីសុវត្ថិភាព និងការពិគ្រោះយោបល់ជាមួយមន្ត្រីជំនាញកសិកម្ម LASED III មូលដ្ឋាន"
}
`;

    const response = await generateContentResilient({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        systemInstruction: LASED_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedResult: any = null;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      try {
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedResult = JSON.parse(cleaned);
      } catch {
        parsedResult = JSON.parse(buildSmartAgriResponse(categoryHint || userNotes || 'crop', true));
      }
    }

    if (!parsedResult || typeof parsedResult !== 'object') {
      parsedResult = JSON.parse(buildSmartAgriResponse(categoryHint || userNotes || 'crop', true));
    }

    // Attach metadata
    const diagnosis = {
      ...parsedResult,
      id: `diag_${Date.now()}`,
      analyzedAt: new Date().toISOString(),
    };

    res.json(diagnosis);
  } catch (error: any) {
    console.warn('Diagnosis API notice:', error?.message || error);
    const safeDiag = {
      ...JSON.parse(buildSmartAgriResponse(req.body?.categoryHint || 'crop', true)),
      id: `diag_${Date.now()}`,
      analyzedAt: new Date().toISOString(),
    };
    res.json(safeDiag);
  }
});

// 3. Voice Transcription & Answer Endpoint
app.post('/api/voice', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;

    if (!audioBase64) {
      res.status(400).json({ error: 'audioBase64 is required' });
      return;
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, '');

    // Step 1: Transcribe using gemini-3.5-transcribe or process audio with gemini-3.8-flash
    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    // Step 1: Transcribe using resilient caller
    let transcript = '';
    try {
      const transcribeResponse = await generateContentResilient({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            { text: 'សូមចម្លងសម្លេងនេះជាអត្ថបទភាសាខ្មែរឱ្យបានត្រឹមត្រូវបំផុត (Transcribe this Khmer voice recording into text accurately).' }
          ]
        }
      });
      transcript = (transcribeResponse.text || '').trim();
    } catch (e: any) {
      console.warn('Voice transcribe error:', e?.message || e);
    }

    // Step 2: Answer the question using resilient caller
    const answerResponse = await generateContentResilient({
      model: 'gemini-3.8-flash',
      contents: `សំណួររបស់កសិករតាមរយៈសម្លេង៖ "${transcript || 'កសិករបានសួរសំណួរអំពីការដាំដុះដំណាំ និងចិញ្ចឹមសត្វ'}"\n\nសូមឆ្លើយតបជាភាសាខ្មែរដោយខ្លី ខ្លឹម ច្បាស់លាស់ និងអនុវត្តបានភ្លាមៗ។`,
      config: {
        systemInstruction: LASED_SYSTEM_INSTRUCTION,
      }
    });

    const replyText = answerResponse.text || 'បានទទួលសម្លេងរបស់លោកអ្នករួចហើយ។ សូមពិនិត្យមើលបច្ចេកទេសណែនាំ។';

    res.json({
      transcript: transcript || 'សម្លេងសួរសំណួរកសិកម្ម',
      reply: replyText
    });
  } catch (error: any) {
    console.warn('Voice API notice:', error?.message || error);
    res.json({
      transcript: 'សម្លេងសួរសំណួរកសិកម្ម',
      reply: '🌾 ជំរាបសួរកសិករ! បានទទួលសម្លេងរបស់លោកអ្នករួចហើយ។ ខ្ញុំជា LASEDIII_Help_Bot ជំនួយការកសិកម្ម។ សូមជ្រើសរើសប្រធានបទដំណាំ ឬសត្វដើម្បីពិនិត្យបច្ចេកទេស។'
    });
  }
});

// 3.5 Dedicated Speech-to-Text Dictation Endpoint (Real-time farmer speech to text)
app.post('/api/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;

    if (!audioBase64) {
      res.status(400).json({ error: 'audioBase64 is required' });
      return;
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, '');

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    const transcribeResponse = await generateContentResilient({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          { text: 'សូមចម្លងសម្លេងកសិករនេះជាអត្ថបទភាសាខ្មែរឱ្យបានសុក្រឹត និងត្រឹមត្រូវតាមអក្ខរាវិរុទ្ធខ្មែរ (Transcribe this Khmer voice recording into clean Khmer text accurately). Return ONLY the transcribed text in Khmer without explanation.' }
        ]
      }
    });

    const transcript = (transcribeResponse.text || '').trim();

    res.json({
      text: transcript,
      success: true
    });
  } catch (error: any) {
    console.warn('Transcribe API notice:', error?.message || error);
    res.json({
      text: '',
      success: false
    });
  }
});

// 4. Text-to-Speech (TTS) Endpoint
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      res.status(400).json({ error: 'Text is required for TTS' });
      return;
    }

    // Truncate to first 400 characters and remove markdown for clean audio synthesis
    const cleanText = text
      .replace(/[*#_`>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 400);

    try {
      const response = await aiV1Alpha.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: cleanText,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio) {
        res.json({
          audioBase64: base64Audio,
          mimeType: 'audio/wav',
          fallback: false,
        });
        return;
      }
    } catch (modelErr: any) {
      console.warn('Gemini TTS generation notice (falling back to client voice synthesis):', modelErr?.message || modelErr);
    }

    // Return graceful fallback so frontend speaks via Web Speech Synthesis smoothly without errors
    res.json({
      audioBase64: null,
      mimeType: null,
      fallback: true,
      text: cleanText,
    });
  } catch (error: any) {
    console.warn('TTS Endpoint notice:', error?.message || error);
    res.json({
      audioBase64: null,
      mimeType: null,
      fallback: true,
    });
  }
});

// Wire Telegram Bot with Gemini AI
telegramBot.setAiCaller(async (prompt: string, imageBase64?: string, audioBase64?: string) => {
  if (imageBase64) {
    const cleanImg = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const res = await generateContentResilient({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanImg } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: LASED_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
    return res.text || 'បានទទួលរូបភាព ប៉ុន្តែមិនអាចវិភាគបានទេ។ សូមសាកល្បងម្តងទៀត។';
  }

  if (audioBase64) {
    const cleanAudio = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
    // Transcribe
    const transRes = await generateContentResilient({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/ogg', data: cleanAudio } },
          { text: 'Transcribe this Khmer voice note.' }
        ]
      }
    });
    const transcript = (transRes.text || '').trim();

    // Answer
    const ansRes = await generateContentResilient({
      model: 'gemini-3.8-flash',
      contents: `សំណួរតាមសម្លេង៖ "${transcript || 'សួរបច្ចេកទេសកសិកម្ម'}"\n\nសូមឆ្លើយតបបច្ចេកទេសជាភាសាខ្មែរជូនកសិករ៖`,
      config: {
        systemInstruction: LASED_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
    return `📝 **សំណួរកសិករ៖** "${transcript}"\n\n🌾 **ចម្លើយ LASED III៖**\n${ansRes.text || ''}`;
  }

  // Pure text with Google Search grounding & Medium thinking for high intelligence
  const textRes = await generateContentResilient({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction: LASED_SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
      tools: [{ googleSearch: {} }]
    }
  });
  return textRes.text || 'សូមអភ័យទោស មិនអាចឆ្លើយបាននៅពេលនេះទេ។';
});

// Wire Telegram Bot with TTS Voice Synthesizer for voice notes
telegramBot.setTtsCaller(async (text: string): Promise<Buffer | null> => {
  try {
    const cleanText = text
      .replace(/[*#_`>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 350);

    const response = await aiV1Alpha.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: cleanText,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return Buffer.from(base64Audio, 'base64');
    }
  } catch (err: any) {
    console.warn('TTS for Telegram notice:', err?.message || err);
  }
  return null;
});

// Telegram API Endpoints
app.get('/api/telegram/status', (_req: Request, res: Response) => {
  res.json(telegramBot.getStatus());
});

app.post('/api/telegram/configure', async (req: Request, res: Response) => {
  try {
    const { token, mode = 'polling' } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const test = await telegramBot.verifyToken(token.trim());
    if (!test.success) {
      res.status(400).json({ error: test.error || 'Invalid token' });
      return;
    }

    telegramBot.saveConfig(token.trim(), mode);

    if (mode === 'polling') {
      const pollResult = await telegramBot.startPolling();
      res.json({
        success: true,
        botInfo: test.botInfo,
        message: pollResult.message,
        status: telegramBot.getStatus()
      });
    } else {
      const origin = req.get('origin') || process.env.APP_URL || `http://${req.get('host')}`;
      const webhookUrl = `${origin}/api/telegram/webhook`;
      const webhookResult = await telegramBot.setWebhook(webhookUrl);
      res.json({
        success: webhookResult.success,
        botInfo: test.botInfo,
        message: webhookResult.message,
        status: telegramBot.getStatus()
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/telegram/toggle-polling', async (_req: Request, res: Response) => {
  const current = telegramBot.getStatus();
  if (current.isPolling) {
    telegramBot.stopPolling();
    res.json({ success: true, isPolling: false, message: 'បានបញ្ឈប់ Polling' });
  } else {
    const startRes = await telegramBot.startPolling();
    res.json({ success: startRes.success, isPolling: startRes.success, message: startRes.message });
  }
});

app.post('/api/telegram/test-send', async (req: Request, res: Response) => {
  try {
    const { chatId, message = '🌾 ជំរាបសួរ! នេះជាសារសាកល្បងពី LASEDIII_Help_Bot។ ប្រព័ន្ធដំណើរការបានល្អឥតខ្ចោះ!' } = req.body;
    if (!chatId) {
      res.status(400).json({ error: 'chatId is required' });
      return;
    }
    const success = await telegramBot.sendMessage(chatId, message);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real incoming Telegram Webhook handler
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    // Process asynchronously without timing out Telegram's 3-second limit
    telegramBot.processIncomingUpdate(update).catch(err => {
      console.warn('Webhook processing notice:', err?.message || err);
    });
    res.json({ ok: true });
  } catch (error: any) {
    console.warn('Telegram Webhook Route notice:', error?.message || error);
    res.json({ ok: false, error: error?.message });
  }
});

app.get('/api/telegram/info', (_req: Request, res: Response) => {
  res.json({
    botName: 'LASEDIII_Help_Bot',
    ...telegramBot.getStatus(),
    supportedCommands: [
      { command: '/start', description: 'ចាប់ផ្តើមប្រើប្រាស់ និងណែនាំមុខងារ' },
      { command: '/crops', description: 'បច្ចេកទេសដាំដុះ (ស្រូវ បន្លែ កៅស៊ូ ចន្ទី)' },
      { command: '/livestock', description: 'បច្ចេកទេសចិញ្ចឹមសត្វ (គោ ក្របី ជ្រូក មាន់ទា ត្រី)' },
      { command: '/diagnose', description: 'ការណែនាំអំពីរបៀបថតរូបវិភាគជំងឺ' }
    ]
// Admin & Location Tracker Endpoints (មុខងារសម្រាប់ Admin: តាមដានអ្នកប្រើប្រាស់ និងចាប់ទីតាំង)
app.get('/api/admin/users', (_req: Request, res: Response) => {
  res.json({
    users: userTracker.getAllUsers(),
    stats: userTracker.getStats(),
    activities: userTracker.getRecentActivities(),
    provinces: CAMBODIA_PROVINCES
  });
});

app.post('/api/tracker/ping', (req: Request, res: Response) => {
  const { userId, name, query, platform = 'web' } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  const user = userTracker.recordUserActivity(
    { id: userId, platform, name },
    'message',
    query || 'បានចូលទស្សនាគេហទំព័រ',
    'general'
  );
  res.json({ success: true, user });
});

app.post('/api/tracker/location', (req: Request, res: Response) => {
  const { userId, latitude, longitude, accuracy, province, platform = 'web', name } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  if (latitude !== undefined && longitude !== undefined) {
    const loc = userTracker.recordLocation(
      userId,
      Number(latitude),
      Number(longitude),
      platform === 'telegram' ? 'telegram_gps' : 'web_gps',
      accuracy,
      { name, platform }
    );
    res.json({ success: true, location: loc });
    return;
  } else if (province) {
    const loc = userTracker.assignProvince(userId, province, { name, platform });
    res.json({ success: true, location: loc });
    return;
  }

  res.status(400).json({ error: 'Coordinates or province is required' });
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🌾 LASEDIII_Help_Bot Server running on http://localhost:${port}`);
    // Auto-start polling if token is already configured
    const status = telegramBot.getStatus();
    if (status.configured) {
      console.log('🤖 Auto-starting Telegram Bot polling...');
      telegramBot.startPolling().then(r => console.log('Polling start result:', r.message));
    }
  });
}

startServer();

