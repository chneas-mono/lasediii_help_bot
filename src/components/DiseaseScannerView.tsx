import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, AlertCircle, CheckCircle2, Volume2, 
  RefreshCw, Sparkles, AlertTriangle, ArrowRight, ShieldCheck, 
  ChevronRight, Leaf, HelpCircle, StopCircle
} from 'lucide-react';
import { DiagnosisResult } from '../types/agri';
import { SAMPLE_DIAGNOSIS_CASES } from '../data/agriKnowledge';

interface Props {
  onSendToChat?: (text: string, diagnosis?: DiagnosisResult) => void;
}

export const DiseaseScannerView: React.FC<Props> = ({ onSendToChat }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [categoryHint, setCategoryHint] = useState<string>('auto');
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop camera stream when leaving
  useEffect(() => {
    return () => {
      stopCamera();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setIsCameraActive(false);
      setError('មិនអាចបើកកាមេរ៉ាបានទេ៖ សូមពិនិត្យសិទ្ធិកាមេរ៉ាក្នុងកម្មវិធីរុករករបស់អ្នក ឬប្រើការបញ្ចូលរូបភាពជំនួសវិញ។');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('សូមជ្រើសរើសឯកសារជារូបភាព (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async (imgData = selectedImage) => {
    if (!imgData) {
      setError('សូមថតរូប ឬជ្រើសរើសរូបភាពដំណាំ ឬសត្វជាមុនសិន!');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setDiagnosis(null);

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imgData,
          mimeType: 'image/jpeg',
          userNotes: userNotes.trim(),
          categoryHint: categoryHint !== 'auto' ? categoryHint : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('ការវិភាគបរាជ័យពីម៉ាស៊ីនបម្រើ');
      }

      const data: DiagnosisResult = await response.json();
      data.imageUrl = imgData;
      setDiagnosis(data);
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      setError('មានបញ្ហាក្នុងការវិភាគរូបភាព៖ ' + (err.message || 'សូមពិនិត្យមើលការភ្ជាប់អ៊ីនធឺណិត ហើយសាកល្បងម្តងទៀត។'));
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSampleCase = (sampleCase: typeof SAMPLE_DIAGNOSIS_CASES[0]) => {
    setSelectedImage(sampleCase.imageUrl);
    setDiagnosis(sampleCase.mockResult);
    setError(null);
    stopCamera();
  };

  const playDiagnosisAudio = async () => {
    if (!diagnosis) return;

    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setAudioLoading(true);
      const textToRead = `${diagnosis.nameKh}។ រោគសញ្ញា៖ ${diagnosis.symptoms.slice(0, 2).join(', ')}។ ដំណោះស្រាយបន្ទាន់៖ ${diagnosis.immediateAction.slice(0, 2).join(', ')}។`;

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToRead }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const data = await response.json();
      if (data.audioBase64) {
        const audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        await audio.play();
        setIsPlayingAudio(true);
      }
    } catch (err) {
      console.error('Error playing audio:', err);
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title & Instructions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>ប្រព័ន្ធបញ្ញាសិប្បនិម្មិតក្សេត្រសាស្ត្រ & បសុព្យាបាល LASED III</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              ម៉ាស៊ីនស្កេន និងវិភាគជំងឺដំណាំ-សត្វរហ័ស
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              ថតរូបស្លឹក ផ្លែ ឬដើមដំណាំ (ស្រូវ បន្លែ កៅស៊ូ ចន្ទី) ឬសត្វឈឺ (គោ ក្របី ជ្រូក មាន់ទា ត្រី) ដើម្បីដឹងពីជំងឺ និងវិធីដោះស្រាយភ្លាមៗ។
            </p>
          </div>
        </div>

        {/* Quick Sample Test Buttons */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            សាកល្បងតេស្តរហ័សជាមួយគំរូជាក់ស្តែង (ចុច ១ ដង)៖
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_DIAGNOSIS_CASES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => loadSampleCase(sample)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
              >
                <span>{sample.category === 'crop' ? '🌿' : '🐂'}</span>
                <span>{sample.titleKh}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Camera / Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>១. ថតរូប ឬបញ្ចូលរូបភាពពីទូរស័ព្ទ</span>
            </h3>

            {/* Video Live Feed */}
            {isCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 mb-3">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    onClick={capturePhoto}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-full shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>ផ្តិតយករូបភាព</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-white text-xs rounded-full shadow transition-colors"
                  >
                    បោះបង់
                  </button>
                </div>
              </div>
            ) : selectedImage ? (
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-4/3 mb-3 border border-slate-200 dark:border-slate-700">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setDiagnosis(null);
                    }}
                    className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full text-xs backdrop-blur-sm transition-colors"
                    title="លុបរូបភាព"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center flex flex-col items-center justify-center gap-3 mb-3 bg-slate-50 dark:bg-slate-800/50">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    ថតរូប ឬទម្លាក់រូបភាពនៅទីនេះ
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    គាំទ្រទម្រង់ JPG, PNG, WEBP
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {!isCameraActive && (
                <button
                  onClick={startCamera}
                  className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>បើកកាមេរ៉ាថត</span>
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Upload className="w-4 h-4" />
                <span>រើសរូបភាពពីម៉ាស៊ីន</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Additional context options */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              ២. បញ្ចូលព័ត៌មានបន្ថែម (ជម្រើស)
            </h3>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                ប្រភេទដំណាំ ឬសត្វ៖
              </label>
              <select
                value={categoryHint}
                onChange={(e) => setCategoryHint(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="auto">ស្វ័យប្រវត្ត (AI ស្គាល់ដោយខ្លួនឯង)</option>
                <option value="rice">ដំណាំស្រូវ</option>
                <option value="vegetables">ដំណាំបន្លែ (ត្រសក់ ម្ទេស ប៉េងប៉ោះ ស្ពៃ)</option>
                <option value="rubber">ដំណាំកៅស៊ូ</option>
                <option value="cashew">ដំណាំចន្ទី</option>
                <option value="cattle">គោ</option>
                <option value="buffalo">ក្របី</option>
                <option value="pig">ជ្រូក</option>
                <option value="poultry">មាន់ទា</option>
                <option value="fish">ត្រី</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                រោគសញ្ញា ឬកំណត់សម្គាល់បន្ថែមពីកសិករ៖
              </label>
              <textarea
                rows={2}
                placeholder="ឧ. ស្រូវទើបព្រោះបាន ២០ ថ្ងៃ, គោមិនសូវស៊ីស្មៅ ៣ ថ្ងៃហើយ..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={() => runAnalysis()}
              disabled={analyzing || !selectedImage}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>កំពុងវិភាគជំងឺដោយបញ្ញាសិប្បនិម្មិត...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>ចាប់ផ្តើមវិភាគជំងឺ និងស្វែងរកដំណោះស្រាយ</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Diagnosis Results Card */}
        <div className="md:col-span-6">
          {diagnosis ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-5 animate-fade-in">
              {/* Header result */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      diagnosis.severity === 'ធ្ងន់ធ្ងរ' 
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                        : diagnosis.severity === 'មធ្យម'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      កម្រិត {diagnosis.severity}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      ភាពជឿជាក់ {diagnosis.confidence}%
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {diagnosis.nameKh}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic font-serif">
                    {diagnosis.nameEn} · {diagnosis.targetItem}
                  </p>
                </div>

                {/* Voice listen button */}
                <button
                  onClick={playDiagnosisAudio}
                  disabled={audioLoading}
                  className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border border-emerald-200 dark:border-emerald-800"
                >
                  {audioLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : isPlayingAudio ? (
                    <StopCircle className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isPlayingAudio ? 'ផ្អាកស្តាប់' : 'ស្តាប់សម្លេង'}</span>
                </button>
              </div>

              {/* Symptoms */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>រោគសញ្ញាសំខាន់ៗដែលបានរកឃើញ៖</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                  {diagnosis.symptoms.map((s, i) => (
                    <li key={i} className="leading-relaxed">{s}</li>
                  ))}
                </ul>
              </div>

              {/* Immediate Actions */}
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ដំណោះស្រាយបន្ទាន់សម្រាប់កសិករ៖</span>
                </h4>
                <div className="space-y-2">
                  {diagnosis.immediateAction.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-emerald-950 dark:text-emerald-100">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                        {idx + 1}
                      </span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Organic & Chemical remedies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">
                    🌿 វិធីសាស្ត្រធម្មជាតិ / ជីវសាស្ត្រ៖
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    {diagnosis.organicRemedy}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">
                    💊 ថ្នាំកសិកម្ម ឬពេទ្យសត្វ៖
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    {diagnosis.chemicalRemedy}
                  </p>
                </div>
              </div>

              {/* Long-term Prevention */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                  🛡️ វិធានការបង្ការរយៈពេលវែង (តាមស្ដង់ដារ LASED III)៖
                </h4>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 list-disc list-inside">
                  {diagnosis.prevention.map((prev, i) => (
                    <li key={i}>{prev}</li>
                  ))}
                </ul>
              </div>

              {/* Action buttons */}
              {onSendToChat && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onSendToChat(
                      `ខ្ញុំបានវិភាគឃើញជំងឺ "${diagnosis.nameKh}" លើ ${diagnosis.targetItem}។ តើមានបច្ចេកទេសលម្អិតបន្ថែមអ្វីខ្លះសម្រាប់កសិករ?`,
                      diagnosis
                    )}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>ផ្ញើលទ្ធផលនេះទៅកាន់ Telegram Chat ដើម្បីសួរបន្ថែម</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[360px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                មិនទាន់មានលទ្ធផលវិភាគនៅឡើយទេ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
                សូមថតរូប ឬជ្រើសរើសរូបភាពស្លឹកដំណាំ ឬសត្វឈឺនៅផ្នែកខាងឆ្វេង រួចចុចប៊ូតុង "ចាប់ផ្តើមវិភាគជំងឺ" ដើម្បីទទួលដំណោះស្រាយរហ័ស។
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
