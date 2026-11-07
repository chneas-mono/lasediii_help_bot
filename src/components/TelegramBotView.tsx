import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Mic, MicOff, Paperclip, Camera, Image as ImageIcon, 
  Volume2, StopCircle, RefreshCw, Sparkles, Check, ChevronRight,
  MoreVertical, PhoneCall, HelpCircle, AlertCircle, FileText, X,
  AudioWaveform, Waves, RotateCcw
} from 'lucide-react';
import { ChatMessage, DiagnosisResult } from '../types/agri';
import { QUICK_QUESTIONS, SAMPLE_DIAGNOSIS_CASES } from '../data/agriKnowledge';

interface Props {
  onOpenScannerTab: () => void;
  onOpenConnectModal: () => void;
  initialQuery?: string;
  initialDiagnosis?: DiagnosisResult;
}

const BOT_AVATAR_URL = '/assets/aistudio/Logo_LASED_III_2024_Final_46f51ed0.png';

export const TelegramBotView: React.FC<Props> = ({ 
  onOpenScannerTab, 
  onOpenConnectModal,
  initialQuery,
  initialDiagnosis
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'bot',
      text: `ជំរាបសួរលោកពូ អ្នកមីង បងប្អូនកសិករទាំងអស់គ្នា! 🙏🌾\n\nខ្ញុំជា **LASEDIII_Help_Bot** ជំនួយការកសិកម្មឆ្លាតវៃនៃគម្រោងបែងចែកដីដើម្បីសង្គមកិច្ច និងការអភិវឌ្ឍសេដ្ឋកិច្ច ជំហាន៣ (LASED III)។\n\nខ្ញុំត្រៀមខ្លួនជួយដោះស្រាយបញ្ហាបច្ចេកទេសជូនបងប្អូនលើ៖\n🌱 **ដំណាំ ៤ ប្រភេទ៖** ស្រូវ, បន្លែ, កៅស៊ូ, ចន្ទី\n🐂 **សត្វចិញ្ចឹម ៥ ប្រភេទ៖** គោ, ក្របី, ជ្រូក, មាន់ទា, ត្រី\n\nលោកអ្នកអាច៖\n១. 💬 វាយសួរសំណួរជាអក្សរ\n២. 🎙️ ចុចប៊ូតុងមីក្រូហ្វូន និយាយសម្លេងសួរសំណួរ\n៣. 📸 ថតរូបស្លឹកដំណាំ ឬសត្វឈឺដើម្បីឱ្យខ្ញុំវិភាគជំងឺ និងរកវិធីព្យាបាលភ្លាមៗ!`,
      timestamp: 'ឥឡូវនេះ',
      quickReplies: [
        { text: '🌾 បច្ចេកទេសស្រូវ', payload: 'សូមជួយណែនាំបច្ចេកទេសដាំដុះស្រូវ និងវិធីការពារជំងឺផ្លិតស្រូវ។', icon: '🌾' },
        { text: '🥬 ដាំបន្លែសុវត្ថិភាព', payload: 'តើមានវិធីដោះស្រាយបញ្ហាដង្កូវស៊ីស្លឹក និងផ្សិតរលួយឫសលើបន្លែបែបណា?', icon: '🥬' },
        { text: '🥜 ថែទាំផ្កាចន្ទី', payload: 'ចន្ទីចាប់ផ្តើមចេញផ្កា ត្រូវការពារជំងឺអង់ត្រាក់ណូស និងមមាចជញ្ជក់បែបណា?', icon: '🥜' },
        { text: '🐂 ជំងឺដុំពកស្បែកគោ', payload: 'គោរបស់ខ្ញុំមានដុំពកលើស្បែក និងក្តៅខ្លួន ត្រូវព្យាបាលរបៀបណា?', icon: '🐂' },
        { text: '📸 ថតរូបស្កេនជំងឺ', payload: 'TRIGGER_SCAN', icon: '📸' }
      ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
  const [thinkingMode, setThinkingMode] = useState<'high' | 'low'>('high');
  const [enableSearch, setEnableSearch] = useState<boolean>(true);
  const [botStatus, setBotStatus] = useState<{ configured: boolean; connected: boolean; username?: string; isPolling?: boolean } | null>(null);

  // Real-time Voice-to-Text Dictation State
  const [isDictating, setIsDictating] = useState(false);
  const [dictatedFinal, setDictatedFinal] = useState('');
  const [dictatedInterim, setDictatedInterim] = useState('');
  const [dictateDuration, setDictateDuration] = useState(0);
  const [isTranscribingAI, setIsTranscribingAI] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 25, 35, 20, 45, 60, 40, 30, 50, 35, 20, 15]);

  const recognitionRef = useRef<any>(null);
  const dictateAudioContextRef = useRef<AudioContext | null>(null);
  const dictateAnalyserRef = useRef<AnalyserNode | null>(null);
  const dictateStreamRef = useRef<MediaStream | null>(null);
  const dictateAnimFrameRef = useRef<number | null>(null);
  const dictateTimerRef = useRef<any>(null);
  const dictateMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const dictateChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const checkStatus = () => {
      fetch('/api/telegram/status')
        .then(res => res.json())
        .then(data => setBotStatus({
          configured: data.configured,
          connected: data.connected,
          username: data.botInfo?.username,
          isPolling: data.isPolling
        }))
        .catch(() => {});
    };
    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle external query injection (e.g. from KnowledgeBase or Scanner)
  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery, undefined, initialDiagnosis);
    }
  }, [initialQuery, initialDiagnosis]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (dictateTimerRef.current) {
        clearInterval(dictateTimerRef.current);
      }
      if (dictateAnimFrameRef.current) {
        cancelAnimationFrame(dictateAnimFrameRef.current);
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (dictateAudioContextRef.current) {
        try { dictateAudioContextRef.current.close(); } catch (e) {}
      }
      if (dictateStreamRef.current) {
        dictateStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleSendMessage = async (
    textToSend = inputText, 
    imageToSend?: string, 
    diagnosisToSend?: DiagnosisResult
  ) => {
    const text = textToSend.trim();
    if (!text && !imageToSend && !diagnosisToSend) return;

    if (text === 'TRIGGER_SCAN') {
      onOpenScannerTab();
      return;
    }

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text || 'បានផ្ញើរូបភាពសម្រាប់វិភាគជំងឺ',
      timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' }),
      image: imageToSend,
      diagnosis: diagnosisToSend
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setShowAttachMenu(false);
    setLoading(true);

    try {
      // If user provided a diagnosis already, give specialized next step
      if (diagnosisToSend) {
        const botMessage: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: `ខ្ញុំបានពិនិត្យឃើញករណីជំងឺ **${diagnosisToSend.nameKh}** (${diagnosisToSend.nameEn}) លើ **${diagnosisToSend.targetItem}**។\n\n📌 **សេចក្តីសង្ខេបបច្ចេកទេស LASED III៖**\n- កម្រិត៖ **${diagnosisToSend.severity}** (ភាពជឿជាក់ ${diagnosisToSend.confidence}%)\n\n🌿 **ដំណោះស្រាយបន្ទាន់៖**\n${diagnosisToSend.immediateAction.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n💡 **វិធីសាស្ត្រធម្មជាតិ៖** ${diagnosisToSend.organicRemedy}\n\n💊 **ថ្នាំកសិកម្ម/ពេទ្យសត្វ៖** ${diagnosisToSend.chemicalRemedy}\n\nបងប្អូនកសិករអាចអនុវត្តភ្លាមៗបាន ហើយប្រសិនបើមានចម្ងល់បន្ថែមអាចសួរខ្ញុំបានគ្រប់ពេល!`,
          timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' }),
          diagnosis: diagnosisToSend,
          quickReplies: [
            { text: '🌿 វិធីធ្វើថ្នាំកសិកម្មធម្មជាតិ', payload: 'សូមប្រាប់រូបមន្តផ្សំថ្នាំពុលរុក្ខជាតិធម្មជាតិពីរុក្ខជាតិក្នុងស្រុក។', icon: '🌿' },
            { text: '👨‍🌾 ទាក់ទងមន្ត្រីកសិកម្ម', payload: 'តើខ្ញុំអាចទាក់ទងមន្ត្រីកសិកម្មគម្រោង LASED III ប្រចាំឃុំបានតាមវិធីណា?', icon: '📞' }
          ]
        };
        setMessages(prev => [...prev, botMessage]);
        setLoading(false);
        return;
      }

      // If user sent an image directly, analyze via /api/diagnose
      if (imageToSend) {
        const diagRes = await fetch('/api/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: imageToSend,
            userNotes: text
          })
        });

        if (!diagRes.ok) throw new Error('Diagnosis failed');
        const diagData: DiagnosisResult = await diagRes.json();

        const botMessage: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: `ខ្ញុំបានវិភាគរូបភាពរួចរាល់ហើយ! រូបនេះបង្ហាញពី **${diagData.nameKh}** លើ **${diagData.targetItem}**។\n\n⚠️ **រោគសញ្ញា៖** ${diagData.symptoms.slice(0, 2).join(', ')}\n\n🛡️ **វិធានការបន្ទាន់៖**\n${diagData.immediateAction.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
          timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' }),
          diagnosis: diagData,
          quickReplies: [
            { text: '📋 មើលរបាយការណ៍លម្អិត', payload: 'សូមពន្យល់លម្អិតបន្ថែមលើជំងឺនេះ', icon: '📋' },
            { text: '📸 ស្កេនរូបភាពផ្សេងទៀត', payload: 'TRIGGER_SCAN', icon: '📸' }
          ]
        };
        setMessages(prev => [...prev, botMessage]);
        setLoading(false);
        return;
      }

      // Standard text conversation with Gemini backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text
          })),
          thinkingMode,
          enableSearch
        })
      });

      if (!response.ok) throw new Error('Chat API returned error');

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: data.reply || 'សូមអភ័យទោស ខ្ញុំមិនទាន់អាចឆ្លើយតបបាននៅពេលនេះទេ។',
        timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources,
        modelUsed: data.modelUsed
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'bot',
        text: 'សូមអភ័យទោស មានបញ្ហាក្នុងការតភ្ជាប់ប្រព័ន្ធ។ សូមពិនិត្យមើលអ៊ីនធឺណិត ហើយសាកល្បងសួរម្តងទៀត។',
        timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // REAL-TIME VOICE-TO-TEXT DICTATION ENGINE
  // ==========================================
  const stopDictationCleanup = () => {
    if (dictateTimerRef.current) {
      clearInterval(dictateTimerRef.current);
      dictateTimerRef.current = null;
    }
    if (dictateAnimFrameRef.current) {
      cancelAnimationFrame(dictateAnimFrameRef.current);
      dictateAnimFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (dictateAudioContextRef.current) {
      try {
        dictateAudioContextRef.current.close();
      } catch (e) {}
      dictateAudioContextRef.current = null;
    }
    if (dictateStreamRef.current) {
      dictateStreamRef.current.getTracks().forEach(t => t.stop());
      dictateStreamRef.current = null;
    }
  };

  const startDictation = async () => {
    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      dictateStreamRef.current = stream;
      dictateChunksRef.current = [];

      const initialBaseText = inputText.trim() ? inputText.trim() + ' ' : '';
      setDictatedFinal(initialBaseText);
      setDictatedInterim('');
      setDictateDuration(0);
      setIsDictating(true);
      setIsTranscribingAI(false);

      // 2. Setup Web Audio API Analyser for live frequency waveform
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          dictateAudioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.75;
          dictateAnalyserRef.current = analyser;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateWaveform = () => {
            if (!dictateAnalyserRef.current) return;
            dictateAnalyserRef.current.getByteFrequencyData(dataArray);
            
            const sampleCount = 12;
            const step = Math.max(1, Math.floor(dataArray.length / sampleCount));
            const newLevels: number[] = [];
            for (let i = 0; i < sampleCount; i++) {
              const val = dataArray[i * step] || 0;
              // Map 0-255 to percentage 12% - 100%
              const pct = Math.max(12, Math.min(100, Math.round((val / 255) * 100)));
              newLevels.push(pct);
            }
            setAudioLevels(newLevels);
            dictateAnimFrameRef.current = requestAnimationFrame(updateWaveform);
          };
          updateWaveform();
        }
      } catch (audioErr) {
        console.warn('AudioContext visualization setup note:', audioErr);
      }

      // 3. Start MediaRecorder as backup for Gemini AI Transcription
      try {
        const recorder = new MediaRecorder(stream);
        dictateMediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            dictateChunksRef.current.push(e.data);
          }
        };
        recorder.start(250);
      } catch (recErr) {
        console.warn('MediaRecorder setup note:', recErr);
      }

      // 4. Start Web Speech Recognition for instantaneous real-time transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'km-KH'; // Khmer (Cambodia)

          recognition.onresult = (event: any) => {
            let interim = '';
            let finalAccum = initialBaseText;
            for (let i = 0; i < event.results.length; ++i) {
              const res = event.results[i];
              if (res.isFinal) {
                finalAccum += res[0].transcript + ' ';
              } else {
                interim += res[0].transcript;
              }
            }
            setDictatedFinal(finalAccum);
            setDictatedInterim(interim);
            const liveDisplay = (finalAccum + interim).trim();
            if (liveDisplay) {
              setInputText(liveDisplay);
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition event:', e?.error);
          };

          recognition.start();
        } catch (recogErr) {
          console.warn('SpeechRecognition initialization error:', recogErr);
        }
      }

      // 5. Timer
      dictateTimerRef.current = setInterval(() => {
        setDictateDuration(s => s + 1);
      }, 1000);

    } catch (err) {
      console.warn('Microphone access notice:', err);
      setMessages(prev => [...prev, {
        id: `sys_mic_${Date.now()}`,
        sender: 'bot',
        text: '⚠️ សូមអនុញ្ញាតសិទ្ធិប្រើប្រាស់មីក្រូហ្វូនក្នុង Browser របស់អ្នក ដើម្បីអាចនិយាយសួរសំណួរផ្ទាល់បាន។',
        timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const finishDictation = async (sendImmediately: boolean = false) => {
    // Collect what has already been transcribed via Web Speech API
    const capturedText = (dictatedFinal + ' ' + dictatedInterim).trim() || inputText.trim();

    // Stop streams & timers
    stopDictationCleanup();

    const recorder = dictateMediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }

    // If Web Speech API already transcribed meaningful text, use it directly!
    if (capturedText.length >= 2) {
      setIsDictating(false);
      setDictatedInterim('');
      setInputText(capturedText);
      if (sendImmediately) {
        handleSendMessage(capturedText);
      }
      return;
    }

    // If Web Speech API was empty (browser lacks native Khmer speech model),
    // trigger AI Transcription using Gemini via /api/transcribe
    setIsTranscribingAI(true);

    try {
      // Allow recorder dataavailable event to flush
      await new Promise(r => setTimeout(r, 300));
      const blob = new Blob(dictateChunksRef.current, { type: 'audio/webm' });

      if (blob.size < 1000) {
        setIsTranscribingAI(false);
        setIsDictating(false);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result as string;
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType: 'audio/webm'
            })
          });

          if (res.ok) {
            const data = await res.json();
            const transcribed = (data.text || '').trim();
            if (transcribed) {
              setInputText(transcribed);
              if (sendImmediately) {
                handleSendMessage(transcribed);
              }
            }
          }
        } catch (apiErr) {
          console.error('AI transcribe endpoint error:', apiErr);
        } finally {
          setIsTranscribingAI(false);
          setIsDictating(false);
        }
      };
    } catch (e) {
      console.error('Blob conversion error:', e);
      setIsTranscribingAI(false);
      setIsDictating(false);
    }
  };

  const cancelDictation = () => {
    stopDictationCleanup();
    if (dictateMediaRecorderRef.current && dictateMediaRecorderRef.current.state !== 'inactive') {
      dictateMediaRecorderRef.current.stop();
    }
    setIsDictating(false);
    setIsTranscribingAI(false);
    setDictatedInterim('');
  };

  const restartDictation = () => {
    stopDictationCleanup();
    setInputText('');
    setDictatedFinal('');
    setDictatedInterim('');
    setTimeout(() => {
      startDictation();
    }, 200);
  };

  // Voice recording logic (Telegram-style Voice Note)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processRecordedAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access notice:', err);
      setMessages(prev => [...prev, {
        id: `sys_mic_${Date.now()}`,
        sender: 'bot',
        text: '⚠️ សូមអនុញ្ញាតសិទ្ធិប្រើប្រាស់មីក្រូហ្វូនក្នុង Browser របស់អ្នក ដើម្បីអាចផ្ញើសារជាសម្លេងបាន។',
        timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const processRecordedAudio = async (blob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      const audioUrl = URL.createObjectURL(blob);

      // Add user audio message to UI
      const userVoiceMsg: ChatMessage = {
        id: `usr_voice_${Date.now()}`,
        sender: 'user',
        text: '🎙️ សារជាសម្លេង (Voice Note)',
        timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' }),
        audio: {
          url: audioUrl,
          duration: recordingSeconds,
          base64: base64Audio
        }
      };

      setMessages(prev => [...prev, userVoiceMsg]);
      setLoading(true);

      try {
        const res = await fetch('/api/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: 'audio/webm'
          })
        });

        if (!res.ok) throw new Error('Voice API failed');

        const data = await res.json();

        const botReplyMsg: ChatMessage = {
          id: `bot_voice_reply_${Date.now()}`,
          sender: 'bot',
          text: `📝 **សំណួរដែលបានស្តាប់ឮ៖** "${data.transcript}"\n\n🌾 **ចម្លើយបច្ចេកទេស LASED III៖**\n${data.reply}`,
          timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, botReplyMsg]);
      } catch (err: any) {
        console.error('Voice processing error:', err);
        const errMsg: ChatMessage = {
          id: `bot_err_${Date.now()}`,
          sender: 'bot',
          text: 'មិនអាចបម្លែងសម្លេងបានទេនៅពេលនេះ។ សូមសាកល្បងនិយាយម្តងទៀត ឬវាយជាអក្សរ។',
          timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    };
  };

  // Play voice response using Gemini TTS with resilient Web Speech Synthesis fallback
  const playMessageTTS = async (messageId: string, text: string) => {
    // If clicking on active playing audio, toggle pause/stop
    if (playingAudioId === messageId) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingAudioId(null);
      return;
    }

    // Helper to speak text using browser native speech synthesis
    const speakViaBrowserSynthesis = (rawText: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setPlayingAudioId(null);
        return;
      }

      window.speechSynthesis.cancel();
      const clean = rawText
        .replace(/[*#_`>~-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300);

      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();
      const khmerVoice = voices.find(v => v.lang.startsWith('km') || v.lang.includes('Khmer'));
      if (khmerVoice) {
        utterance.voice = khmerVoice;
      }
      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);

      setPlayingAudioId(messageId);
      window.speechSynthesis.speak(utterance);
    };

    try {
      setTtsLoadingId(messageId);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = res.ok ? await res.json() : null;

      if (data?.audioBase64) {
        const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }
        const audio = new Audio(audioSrc);
        currentAudioRef.current = audio;
        audio.onended = () => setPlayingAudioId(null);
        audio.onerror = () => {
          // If audio playback errors, fall back to browser speech synthesis
          speakViaBrowserSynthesis(text);
        };
        await audio.play();
        setPlayingAudioId(messageId);
      } else {
        // Fall back to client browser speech synthesis
        speakViaBrowserSynthesis(data?.text || text);
      }
    } catch (e) {
      console.warn('TTS server request notice, using local voice fallback:', e);
      speakViaBrowserSynthesis(text);
    } finally {
      setTtsLoadingId(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleSendMessage('', base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[580px] bg-slate-100 dark:bg-slate-950 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
      {/* Telegram Chat Header */}
      <div className="bg-[#2AABEE] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={BOT_AVATAR_URL}
              alt="LASEDIII_Help_Bot Logo"
              className="w-10 h-10 rounded-full object-contain p-0.5 bg-white border border-white/80 shadow-xs"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#2AABEE] rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold tracking-tight">LASEDIII_Help_Bot</h2>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-medium">BOT</span>
            </div>
            <p className="text-[11px] text-sky-100 flex items-center gap-1">
              <span>ជំនួយការកសិកម្ម និងបសុសត្វឆ្លាតវៃ</span>
              <span>·</span>
              <span className="text-emerald-200 font-medium">អនឡាញ</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenConnectModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-semibold backdrop-blur-sm transition-colors text-white"
            title="ភ្ជាប់ទៅកាន់ Telegram App ពិតប្រាកដ"
          >
            <span>ភ្ជាប់ទៅ Telegram App</span>
          </button>
          <button
            onClick={onOpenScannerTab}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-semibold text-white shadow-sm transition-colors flex items-center gap-1"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ម៉ាស៊ីនស្កេនជំងឺ</span>
          </button>
        </div>
      </div>

      {/* Telegram Real-App Connection Status Banner */}
      <div className={`px-4 py-2 text-xs flex items-center justify-between gap-2 border-b shrink-0 ${
        botStatus?.connected && botStatus?.isPolling
          ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          : botStatus?.connected
          ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          : 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
      }`}>
        <div className="flex items-center gap-2 truncate">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            botStatus?.connected && botStatus?.isPolling 
              ? 'bg-emerald-500 animate-pulse' 
              : 'bg-amber-500'
          }`} />
          <span className="truncate">
            {botStatus?.connected && botStatus?.isPolling
              ? `🟢 Bot កំពុងដំណើរការលើ Telegram App ពិតប្រាកដ (@${botStatus.username})`
              : botStatus?.connected
              ? `🟡 Bot @${botStatus.username} បានតភ្ជាប់ ប៉ុន្តែផ្អាក Polling`
              : '⚠️ Telegram Bot មិនទាន់ដំណើរការលើ Telegram App នៅឡើយទេ (ត្រូវការ Bot Token ពី @BotFather)'}
          </span>
        </div>
        <button
          onClick={onOpenConnectModal}
          className="font-bold underline text-[#2AABEE] hover:text-[#229ED9] shrink-0 text-[11px]"
        >
          {botStatus?.connected ? 'គ្រប់គ្រង & តេស្ត' : 'ចុចភ្ជាប់ Token ឥឡូវនេះ'}
        </button>
      </div>

      {/* Telegram Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#EFE7DD] dark:bg-[#0E1621] bg-opacity-70">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full animate-fade-in`}
            >
              <div
                className={`relative group max-w-[88%] sm:max-w-[75%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-[#E1FFC7] dark:bg-[#2B5278] text-slate-900 dark:text-white rounded-br-xs'
                    : 'bg-white dark:bg-[#182533] text-slate-900 dark:text-slate-100 rounded-bl-xs border border-black/5 dark:border-white/5'
                }`}
              >
                {/* Image preview inside message */}
                {msg.image && (
                  <div className="mb-2.5 rounded-xl overflow-hidden max-h-60 border border-black/10">
                    <img
                      src={msg.image}
                      alt="Uploaded"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Voice note audio player inside message */}
                {msg.audio && (
                  <div className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/10 rounded-xl mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#2AABEE] text-white flex items-center justify-center">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        <span>សារសម្លេងរបស់កសិករ</span>
                        <span>{msg.audio.duration ? `${msg.audio.duration} វិនាទី` : ''}</span>
                      </div>
                      {msg.audio.url && (
                        <audio src={msg.audio.url} controls className="w-full h-7 mt-1" />
                      )}
                    </div>
                  </div>
                )}

                {/* Text Content */}
                <div className="whitespace-pre-wrap select-text">
                  {msg.text}
                </div>

                {/* Diagnosis badge if attached */}
                {msg.diagnosis && (
                  <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold">{msg.diagnosis.nameKh}</span>
                    </div>
                    <button
                      onClick={onOpenScannerTab}
                      className="text-[11px] text-emerald-700 dark:text-emerald-300 underline font-medium"
                    >
                      មើលលម្អិត &gt;
                    </button>
                  </div>
                )}

                {/* Grounding sources if available */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10 text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      🌐 ប្រភពព័ត៌មានបន្តផ្ទាល់ (Google Search Grounding)៖
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[10px] text-sky-700 dark:text-sky-300 truncate max-w-[200px] border border-black/5 dark:border-white/5 transition-colors"
                        >
                          {s.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message footer: Time and TTS speaker */}
                <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[10px] text-slate-400 dark:text-slate-400">
                  {!isUser && (
                    <button
                      onClick={() => playMessageTTS(msg.id, msg.text)}
                      className="flex items-center gap-1 text-[#2AABEE] hover:text-[#1d8fc9] font-medium transition-colors"
                      title="ស្តាប់ការអានចម្លើយជាសម្លេង"
                    >
                      {ttsLoadingId === msg.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : playingAudioId === msg.id ? (
                        <StopCircle className="w-3 h-3 text-rose-500" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                      <span>{playingAudioId === msg.id ? 'ផ្អាក' : 'ស្តាប់សម្លេង'}</span>
                    </button>
                  )}
                  <span>{msg.timestamp}</span>
                  {isUser && <Check className="w-3.5 h-3.5 text-sky-600 inline" />}
                </div>
              </div>

              {/* Inline Quick Reply Buttons */}
              {msg.quickReplies && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                  {msg.quickReplies.map((qr, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(qr.payload)}
                      className="px-3 py-1.5 bg-white dark:bg-[#182533] hover:bg-[#2AABEE] hover:text-white dark:hover:bg-[#2AABEE] dark:hover:text-white rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 shadow-xs border border-slate-200 dark:border-slate-700/60 transition-colors flex items-center gap-1.5"
                    >
                      {qr.icon && <span>{qr.icon}</span>}
                      <span>{qr.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-[#182533] rounded-2xl w-fit shadow-xs border border-black/5">
            <RefreshCw className="w-3.5 h-3.5 text-[#2AABEE] animate-spin" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              LASEDIII_Help_Bot កំពុងរៀបចំចម្លើយបច្ចេកទេស...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* AI Model Intelligence & Live Search Grounding Strip */}
      <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 font-medium">ម៉ូឌែល AI៖</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
            Gemini 3.8 Flash (Vast Agricultural Reasoning)
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Thinking Level Toggle */}
          <button
            onClick={() => setThinkingMode(thinkingMode === 'high' ? 'low' : 'high')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              thinkingMode === 'high'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
            title="ប្តូរកម្រិតវិភាគស៊ីជម្រៅ"
          >
            <span>🧠 {thinkingMode === 'high' ? 'វិភាគស៊ីជម្រៅ (High Reasoning)' : 'ឆ្លើយរហ័ស (Fast)'}</span>
          </button>

          {/* Live Google Search Grounding Toggle */}
          <button
            onClick={() => setEnableSearch(!enableSearch)}
            className={`px-2 py-0.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              enableSearch
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
            title="ភ្ជាប់ទិន្នន័យ Google Search ផ្ទាល់សម្រាប់តម្លៃទីផ្សារ និងអាកាសធាតុ"
          >
            <span>🌐 {enableSearch ? 'Google Search ផ្ទាល់ (បើក)' : 'Google Search (បិទ)'}</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Category Pills Bar */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">សួររហ័ស៖</span>
        {QUICK_QUESTIONS.slice(0, 5).map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q.text)}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 text-[11px] font-medium text-slate-700 dark:text-slate-300 rounded-lg whitespace-nowrap transition-colors shrink-0"
          >
            {q.text}
          </button>
        ))}
      </div>

      {/* Telegram Input Bar */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 shrink-0 relative">
        {/* Attachment Flyout Menu */}
        {showAttachMenu && (
          <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 min-w-[220px] flex flex-col gap-1 z-30 animate-fade-in">
            <button
              onClick={() => {
                setShowAttachMenu(false);
                onOpenScannerTab();
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl flex items-center gap-2.5 transition-colors"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="block font-semibold">បើកកាមេរ៉ាស្កេនជំងឺ</span>
                <span className="text-[10px] text-slate-400">ថតរូបវិភាគជំងឺភ្លាមៗ</span>
              </div>
            </button>

            <button
              onClick={() => {
                setShowAttachMenu(false);
                fileInputRef.current?.click();
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl flex items-center gap-2.5 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-sky-600" />
              <div>
                <span className="block font-semibold">បញ្ចូលរូបភាពពីម៉ាស៊ីន</span>
                <span className="text-[10px] text-slate-400">រូបស្លឹក ឬសត្វឈឺ</span>
              </div>
            </button>

            <button
              onClick={() => {
                setShowAttachMenu(false);
                startRecording();
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2.5 transition-colors"
            >
              <Mic className="w-4 h-4 text-rose-600" />
              <div>
                <span className="block font-semibold">ផ្ញើសារសម្លេង Voice Note</span>
                <span className="text-[10px] text-slate-400">ផ្ញើជាសារសម្លេង Telegram</span>
              </div>
            </button>

            <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
              <span className="px-3 py-1 text-[10px] font-semibold text-slate-400 block">
                ករណីតេស្តគំរូ៖
              </span>
              {SAMPLE_DIAGNOSIS_CASES.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setShowAttachMenu(false);
                    handleSendMessage(
                      `ខ្ញុំមានរូបភាពនៃជំងឺ ${s.titleKh}។ សូមពិនិត្យ និងផ្តល់ដំណោះស្រាយ។`,
                      s.imageUrl,
                      s.mockResult
                    );
                  }}
                  className="w-full px-3 py-1.5 text-left text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2"
                >
                  <span>{s.category === 'crop' ? '🌾' : '🐂'}</span>
                  <span className="truncate">{s.titleKh}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Real-Time Voice-To-Text Dictation Console (When Active) */}
        {isDictating ? (
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 dark:border-emerald-500 rounded-3xl p-3.5 shadow-lg flex flex-col gap-3 animate-in fade-in duration-200">
            {/* Top Bar: Live Status Indicator, Waveform Equalizer, Duration */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    កំពុងស្តាប់ការនិយាយរបស់អ្នក...
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full font-semibold">
                    ខ្មែរ 🇰🇭
                  </span>
                </div>
              </div>

              {/* Dynamic 12-Bar Audio Visualizer dancing in real-time */}
              <div className="flex items-center gap-1 h-6 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {audioLevels.map((lvl, idx) => (
                  <span
                    key={idx}
                    className="w-1 bg-emerald-500 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(4, Math.min(22, Math.round(lvl * 0.22)))}px` }}
                  />
                ))}
              </div>

              {/* Dictation Duration */}
              <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                {Math.floor(dictateDuration / 60).toString().padStart(2, '0')}:
                {(dictateDuration % 60).toString().padStart(2, '0')}
              </div>
            </div>

            {/* Live Dictated Transcript Display */}
            <div className="min-h-[58px] max-h-36 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
              {isTranscribingAI ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium py-1.5">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>កំពុងបម្លែងសម្លេងខ្មែរទៅជាអក្សរដោយ AI យ៉ាងសុក្រឹត...</span>
                </div>
              ) : (inputText || dictatedFinal || dictatedInterim) ? (
                <div>
                  <span className="font-medium">{dictatedFinal || inputText}</span>
                  {dictatedInterim && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium italic">
                      {' '}{dictatedInterim}
                    </span>
                  )}
                  <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-1 animate-pulse align-middle" />
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic">
                  🎙️ សូមចាប់ផ្តើមនិយាយសំណួរកសិកម្មរបស់អ្នក (ឧ. "ស្រូវរបស់ខ្ញុំកើតជំងឺក្រហមចុងស្លឹក ហើយមានដង្កូវស៊ីដើម ព្យាបាលបែបណា?")...
                </span>
              )}
            </div>

            {/* Bottom Actions: Cancel, Restart, Insert in Input, Send Immediately */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={cancelDictation}
                  disabled={isTranscribingAI}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1"
                  title="បោះបង់ការនិយាយ"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>បោះបង់</span>
                </button>

                <button
                  onClick={restartDictation}
                  disabled={isTranscribingAI}
                  className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1"
                  title="និយាយសារជាថ្មីឡើងវិញ"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">និយាយឡើងវិញ</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => finishDictation(false)}
                  disabled={isTranscribingAI}
                  className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="បញ្ចប់ការនិយាយ និងរក្សាទុកក្នុងប្រអប់ដើម្បីកែសម្រួល"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>បញ្ចូលក្នុងប្រអប់</span>
                </button>

                <button
                  onClick={() => finishDictation(true)}
                  disabled={isTranscribingAI}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  title="ផ្ញើសំណួរដែលបាននិយាយទៅកាន់ LASEDIII_Help_Bot ភ្លាមៗ"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ផ្ញើសំណួរភ្លាម</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Input Bar (When Not Dictating) */
          <div className="flex items-center gap-2">
            {/* Attachment Paperclip Button */}
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={`p-2.5 rounded-full transition-colors ${
                showAttachMenu
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="ភ្ជាប់រូបភាព ឬកាមេរ៉ា"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Quick Dictate Trigger Button */}
            <button
              onClick={startDictation}
              disabled={loading || isRecording}
              className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-full transition-colors flex items-center justify-center relative group"
              title="និយាយបម្លែងជាអក្សរផ្ទាល់ (Real-time Voice-to-Text Dictation)"
            >
              <AudioWaveform className="w-5 h-5" />
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-2 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-sm">
                និយាយផ្ទាល់ 🎙️
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Voice Note Recording Overlay (if user triggered Telegram voice note) */}
            {isRecording ? (
              <div className="flex-1 flex items-center justify-between bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl px-4 py-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-300">
                  <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping inline-block" />
                  <span>កំពុងថតសារសម្លេង Voice Note៖ {recordingSeconds} វិនាទី</span>
                </div>
                <button
                  onClick={stopRecording}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700"
                >
                  ផ្ញើសម្លេង
                </button>
              </div>
            ) : (
              <input
                type="text"
                placeholder="វាយសំណួរ ឬចុច 🎙️ ដើម្បីនិយាយសួរផ្ទាល់ (ស្រូវ បន្លែ កៅស៊ូ ចន្ទី គោ ក្របី ជ្រូក មាន់ ត្រី)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
              />
            )}

            {/* Primary Action Button: Send or Dictate */}
            {inputText.trim() ? (
              <button
                onClick={() => handleSendMessage()}
                disabled={loading}
                className="p-3 bg-[#2AABEE] hover:bg-[#229ED9] text-white rounded-full transition-transform active:scale-95 shadow-md disabled:opacity-50"
                title="ផ្ញើសារ"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={startDictation}
                disabled={loading}
                className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all shadow-md active:scale-95 flex items-center justify-center group"
                title="ចុចដើម្បីនិយាយសួរផ្ទាល់ (Real-time Voice-to-Text Dictation)"
              >
                <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
