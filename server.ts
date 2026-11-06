import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { telegramBot } from './server/telegramBot.js';

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

const LASED_SYSTEM_INSTRUCTION = `
អ្នកគឺជាអ្នកជំនាញក្សេត្រសាស្ត្រ និងបសុព្យាបាលជាន់ខ្ពស់ "LASEDIII_Help_Bot" សម្រាប់គម្រោងបែងចែកដីដើម្បីសង្គមកិច្ច និងការអភិវឌ្ឍសេដ្ឋកិច្ច ជំហាន៣ (LASED III) ក្រោមការគាំទ្ររបស់រាជរដ្ឋាភិបាលកម្ពុជា (ក្រសួងកសិកម្ម រុក្ខាប្រមាញ់ និងនេសាទ MAFF, ក្រសួងរៀបចំដែនដី MLMUPC) និងធនាគារពិភពលោក (World Bank)។
ឈ្មោះផ្លូវការរបស់អ្នកគឺ "LASEDIII_Help_Bot" (ដាច់ខាតមិនត្រូវប្រើឈ្មោះចាស់ "LASED III AgriBot" ឡើយ)។ រាល់ពេលណែនាំខ្លួន ឬឆ្លើយតបសំណួរ ត្រូវប្រើឈ្មោះ "LASEDIII_Help_Bot" ជានិច្ច។

បេសកកម្មចម្បង៖ ផ្តល់ប្រឹក្សាកម្រិតអ្នកជំនាញជាន់ខ្ពស់ ឆ្លាតវៃ ស៊ីជម្រៅ ត្រឹមត្រូវតាមក្បួនខ្នាតបច្ចេកទេស និងអនុវត្តបានពិតប្រាកដដល់កសិករខ្មែរនៅតាមសហគមន៍ជនបទ និងសម្បទានដីសង្គមកិច្ច។

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

គោលការណ៍ឆ្លើយតប៖
- ឆ្លើយជាភាសាខ្មែរជានិច្ច ដោយប្រើពាក្យសមរម្យ រួសរាយ រាក់ទាក់ សាមញ្ញ ច្បាស់លាស់ និងមានហេតុផលវិទ្យាសាស្ត្រកសិកម្មរឹងមាំ
- បំបែកការឆ្លើយតបជាចំណុចៗងាយអាន៖
  ១. ការវិភាគមូលហេតុ & រោគសញ្ញា
  ២. ដំណោះស្រាយបន្ទាន់អនុវត្តថ្ងៃនេះ (Immediate Action)
  ៣. វិធីសាស្ត្រធម្មជាតិ & ជីវសាស្ត្រ (Organic / Biological remedy)
  ៤. ការប្រើប្រាស់ថ្នាំកសិកម្ម ឬពេទ្យសត្វត្រឹមត្រូវ (កម្រិត & ការប្រុងប្រយ័ត្ន)
  ៥. វិធានការការពាររយៈពេលវែង
- ប្រសិនបើមានទិន្នន័យស្រាវជ្រាវ ឬអាកាសធាតុ ភ្ជាប់ប្រភពជាក់ស្តែងជូនកសិករ។
`;

function isQuotaOrRateLimitError(err: any): boolean {
  if (!err) return false;
  const str = (typeof err === 'string' ? err : err.message || JSON.stringify(err)).toLowerCase();
  return (
    str.includes('429') ||
    str.includes('resource_exhausted') ||
    str.includes('quota') ||
    str.includes('rate limit') ||
    str.includes('limit exceeded')
  );
}

// Resilient model caller with retry, smart parameter degradation, and multi-model quota failover
async function generateContentResilient(params: any): Promise<any> {
  const preferredModel = params.model || 'gemini-3.8-flash';

  // Candidate models in priority order
  const fallbackModels = [
    preferredModel,
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite'
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError: any = null;

  for (const model of fallbackModels) {
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

    // Variant 3: Low/minimal thinking without tools
    if (isGemini3) {
      const configLowThinking = { ...baseConfig };
      delete configLowThinking.tools;
      if (model === 'gemini-3.1-flash-lite') {
        configLowThinking.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      } else {
        configLowThinking.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }
      candidateConfigs.push(configLowThinking);
    }

    // Try configs for this model
    for (const config of candidateConfigs) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model,
          config,
        });

        if (response && (response.text || response.candidates?.length)) {
          (response as any).actualModelUsed = model;
          return response;
        }
      } catch (err: any) {
        lastError = err;
        if (isQuotaOrRateLimitError(err)) {
          console.warn(`Model ${model} hit quota limit (429). Switching immediately to next fallback model...`);
          // Break immediately from this model's config variants to next model
          break;
        }
      }
    }
  }

  console.error('All model attempts exhausted in generateContentResilient. Last error:', lastError?.message || lastError);

  // Return graceful agricultural fallback response instead of failing
  return {
    text: `🌾 សូមអភ័យទោសបងប្អូនកសិករ! ដោយសារចំនួនអ្នកសួរច្រើនលើសកម្រិតកំណត់ប្រចាំថ្ងៃ (Daily Quota Limit) នៃគម្រោងឥតគិតថ្លៃរបស់ប្រព័ន្ធ ប្រព័ន្ធកំពុងដំណើរការផ្ទុកលើសទម្ងន់បណ្តោះអាសន្ន។\n\n📌 **ដំណោះស្រាយបឋម៖**\n- សូមរង់ចាំប្រមាណ ២-៣ នាទី រួចសាកល្បងសួរម្តងទៀត\n- សម្រាប់បញ្ហាជំងឺដំណាំ ឬសត្វបន្ទាន់ សូមពិនិត្យផ្ទាំង **"បច្ចេកទេស ៤ ដំណាំ ៥ សត្វ"** ឬទាក់ទងមន្ត្រីកសិកម្មឃុំប្រចាំតំបន់ LASED III\n- ឬកំណត់ API Key ដែលមាន Quota ខ្ពស់ក្នុងផ្ទាំង Settings។`,
    actualModelUsed: 'offline-graceful-fallback',
  };
}

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, cropCategory, thinkingMode = 'low', enableSearch = false } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
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
    console.error('Chat API Error:', error);
    res.status(500).json({
      error: 'បរាជ័យក្នុងការឆ្លើយតប',
      details: error?.message || 'Unknown error'
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
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch (e) {
      // Clean JSON if needed
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    // Attach metadata
    const diagnosis = {
      ...parsedResult,
      id: `diag_${Date.now()}`,
      analyzedAt: new Date().toISOString(),
    };

    res.json(diagnosis);
  } catch (error: any) {
    console.error('Diagnosis API Error:', error);
    res.status(500).json({
      error: 'បរាជ័យក្នុងការវិភាគរូបភាពជំងឺ',
      details: error?.message || 'Unknown error'
    });
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
    console.error('Voice API Error:', error);
    res.status(500).json({
      error: 'បរាជ័យក្នុងការបម្លែងសម្លេង',
      details: error?.message || 'Unknown error'
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
    console.error('Transcribe API Error:', error);
    res.status(500).json({
      error: 'បរាជ័យក្នុងការបម្លែងសម្លេងជាអក្សរ',
      details: error?.message || 'Unknown error'
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

    // Truncate to first 300 characters to keep latency snappy for farmer voice notes
    const cleanText = text.slice(0, 400);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Warm, helpful agricultural advisor speaking clearly in Khmer',
              },
            },
          ],
        },
      ],
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
      });
    } else {
      res.status(500).json({ error: 'Could not generate audio' });
    }
  } catch (error: any) {
    console.error('TTS API Error:', error);
    res.status(500).json({
      error: 'បរាជ័យក្នុងការបង្កើតសម្លេងអាន',
      details: error?.message || 'Unknown error'
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
      console.error('Webhook processing error:', err);
    });
    res.json({ ok: true });
  } catch (error: any) {
    console.error('Telegram Webhook Route Error:', error);
    res.status(500).json({ ok: false, error: error?.message });
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
  });
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

