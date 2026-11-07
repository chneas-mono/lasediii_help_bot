export type AgriCategory = 
  | 'rice'        // ដំណាំស្រូវ
  | 'vegetables'  // ដំណាំបន្លែ
  | 'rubber'      // ដំណាំកៅស៊ូ
  | 'cashew'      // ដំណាំចន្ទី
  | 'cattle'      // គោ
  | 'buffalo'     // ក្របី
  | 'pig'         // ជ្រូក
  | 'poultry'     // មាន់ទា
  | 'fish';       // ត្រី

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  image?: string;
  audio?: {
    url?: string;
    duration?: number;
    base64?: string;
  };
  diagnosis?: DiagnosisResult;
  quickReplies?: Array<{
    text: string;
    payload: string;
    icon?: string;
  }>;
  audioResponseBase64?: string;
  isAudioLoading?: boolean;
  sources?: Array<{ title: string; url: string }>;
  modelUsed?: string;
}

export interface DiagnosisResult {
  id: string;
  nameKh: string;
  nameEn: string;
  targetItem: string;
  category: 'crop' | 'livestock';
  severity: 'ស្រាល' | 'មធ្យម' | 'ធ្ងន់ធ្ងរ';
  confidence: number;
  symptoms: string[];
  causes: string;
  immediateAction: string[];
  organicRemedy: string;
  chemicalRemedy: string;
  prevention: string[];
  disclaimer: string;
  analyzedAt: string;
  imageUrl?: string;
}

export interface CommonDisease {
  nameKh: string;
  nameEn: string;
  symptoms: string;
  treatment: string;
  prevention: string;
}

export interface AgriTopic {
  id: string;
  titleKh: string;
  titleEn: string;
  category: AgriCategory;
  type: 'crop' | 'livestock';
  icon: string;
  description: string;
  keyPractices: string[];
  commonDiseases: CommonDisease[];
  lasedGuidance: string;
}
