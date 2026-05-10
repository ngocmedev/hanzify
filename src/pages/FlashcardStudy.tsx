import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Loader2,
  ArrowLeft,
  Volume2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  Check,
  Trophy,
  PartyPopper,
  BookA,
  Quote,
  Sparkles
} from 'lucide-react';
import { updateProgress, toggleStar } from '../services/progress';
import { getLoggedInUsername } from '../services/auth';

let audioCtx: AudioContext | null = null;

const playFlipSound = () => {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    const ctx = audioCtx;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create white noise buffer for paper sound
    const bufferSize = ctx.sampleRate * 0.12; // 120ms duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to make it sound like thick paper sliding
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);

    // Volume envelope (quick attack, slightly slower decay)
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch (e) {
    console.error("Audio API not supported", e);
  }
};

const playCongratsSound = () => {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    const ctx = audioCtx;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // A bright, uplifting major arpeggio (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const startTime = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine'; // Pure, chime-like tone
      osc.frequency.setValueAtTime(freq, startTime + index * 0.1);

      // Volume envelope: quick attack, smooth decay
      gain.gain.setValueAtTime(0, startTime + index * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, startTime + index * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.1 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + index * 0.1);
      osc.stop(startTime + index * 0.1 + 0.6);
    });
  } catch (e) {
    console.error("Audio API not supported", e);
  }
};

export default function FlashcardStudy() {
  const { id } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<any>(null);
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);

  const playText = useCallback((text: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleNext = useCallback(() => {
    setDirection(1);
    setIsFlipped(false);
    setCurrentIndex((prev) => {
      if (prev === words.length - 1) {
        if (!showCongrats) playCongratsSound();
        setShowCongrats(true);
        return prev;
      }
      const nextIdx = prev + 1;
      playText(words[nextIdx]?.word);
      return nextIdx;
    });
  }, [words, playText, showCongrats]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setIsFlipped(false);
    setCurrentIndex((prev) => {
      const prevIdx = (prev - 1 + words.length) % words.length;
      playText(words[prevIdx]?.word);
      return prevIdx;
    });
  }, [words, playText]);

  const handleStatusUpdate = async (status: 'learned' | 'not_learned' | 'urgent') => {
    try {
      setSaveStatus(status);
      await updateProgress(words[currentIndex].id, status);

      const newWords = [...words];
      newWords[currentIndex].status = status;
      setWords(newWords);

      setTimeout(() => setSaveStatus(null), 1500);
      handleNext();
    } catch (err) {
      console.error('Failed to update progress', err);
      setSaveStatus(null);
    }
  };

  const handleToggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!getLoggedInUsername()) {
      alert("Vui lòng đăng nhập để lưu từ vựng!");
      return;
    }
    try {
      const res = await toggleStar(words[currentIndex].id);
      const newWords = [...words];
      newWords[currentIndex].isStarred = res.isStarred ? 1 : 0;
      setWords(newWords);
    } catch (err: any) {
      console.error('Failed to toggle star', err);
      alert("Lỗi: " + (err.message || 'Không thể gắn sao'));
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) return;

        if (id === 'starred') {
          setDeck({ level: 'Từ vựng đã gắn sao', description: 'Ôn tập các từ quan trọng' });
          if (!getLoggedInUsername()) {
            setWords([]);
            return;
          }
          const res = await fetch(`http://localhost:3002/api/user/words/starred`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              localStorage.removeItem('token');
              localStorage.removeItem('username');
              localStorage.removeItem('role');
              window.location.reload();
              return;
            }
            throw new Error('Failed to fetch starred words');
          }
          const wordsData = await res.json();
          setWords(wordsData);
          return;
        }

        if (id === 'unlearned') {
          setDeck({ level: 'Từ cần học', description: 'Ôn tập các từ chưa thuộc' });
          if (!getLoggedInUsername()) {
            setWords([]);
            return;
          }
          const res = await fetch(`http://localhost:3002/api/user/words/unlearned`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              localStorage.removeItem('token');
              localStorage.removeItem('username');
              localStorage.removeItem('role');
              window.location.reload();
              return;
            }
            throw new Error('Failed to fetch unlearned words');
          }
          const wordsData = await res.json();
          setWords(wordsData);
          return;
        }

        const deckRes: any = await api.getDeckById(id);
        setDeck(deckRes.data);

        let wordsData: any[];
        if (getLoggedInUsername()) {
          const res = await fetch(`http://localhost:3002/api/user/decks/${id}/words`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              localStorage.removeItem('token');
              localStorage.removeItem('username');
              localStorage.removeItem('role');
              window.location.reload();
              return;
            }
            const errData = await res.json();
            throw new Error(errData.error || errData.details || 'Failed to fetch words');
          }
          const rawWords = await res.json();
          // Lọc ra các từ chưa thuộc (bỏ qua những từ có status === 'learned')
          const unlearnedWords = rawWords.filter((w: any) => w.status !== 'learned');

          // Nếu tất cả đã học thì hiển thị tất cả để họ có thể ôn lại,
          // còn nếu có từ chưa học thì chỉ hiển thị từ chưa học
          wordsData = unlearnedWords.length > 0 ? unlearnedWords : rawWords;
        } else {
          const res: any = await api.getWordsByDeckId(id);
          wordsData = res.data;
        }

        setWords(wordsData);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Lỗi không xác định');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
    playFlipSound();
  }, []);

  const playAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    playText(text);
  };

  useEffect(() => {
    if (showCongrats) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'Enter') {
        handleStatusUpdate('learned');
      } else if (e.key === 'u' || e.key === 'U') {
        handleStatusUpdate('urgent');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleFlip, words, currentIndex, showCongrats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500 text-center font-bold">Lỗi: {errorMsg}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-brand-accent text-white rounded-full">Thử lại</button>
      </div>
    );
  }

  if (!words || !words.length) return <div className="min-h-screen flex items-center justify-center">Không có dữ liệu từ vựng.</div>;

  const currentWord = words[currentIndex];

  if (showCongrats) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4 container mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-brand-accent/20 flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-brand-accent/20 to-brand-secondary/20" />

            <motion.div
              initial={{ rotate: -15, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative z-10 w-24 h-24 bg-brand-accent text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-brand-accent/30"
            >
              <Trophy className="w-12 h-12" />
            </motion.div>

            <h2 className="relative z-10 text-3xl font-bold text-brand-text mb-3">Chúc mừng!</h2>
            <p className="relative z-10 text-brand-text/60 mb-8 font-medium">Bạn đã hoàn thành xuất sắc <span className="text-brand-accent font-bold">{words.length}</span> thẻ vựng trong bộ này.</p>

            <div className="relative z-10 w-full flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowCongrats(false);
                  setCurrentIndex(0);
                  setDirection(-1);
                  playText(words[0]?.word);
                }}
                className="w-full py-4 rounded-2xl bg-brand-accent text-white font-bold hover:bg-brand-accent/90 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <PartyPopper className="w-5 h-5" />
                Ôn tập lại từ đầu
              </button>

              <Link
                to={id === 'starred' || id === 'unlearned' ? "/" : `/deck/${id}`}
                className="w-full py-4 rounded-2xl bg-brand-secondary/10 text-brand-text font-bold hover:bg-brand-secondary/20 transition-all active:scale-95 flex items-center justify-center"
              >
                Trở về
              </Link>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center py-2 sm:py-6 px-4 container mx-auto">
        {/* Header */}
        <div className="w-full max-w-md flex items-center justify-between mb-4">
          <Link to={id === 'starred' || id === 'unlearned' ? "/" : `/deck/${id}`} className="p-2 hover:bg-brand-secondary/20 rounded-full transition-colors text-brand-text/60">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="text-center">
            <h2 className="text-xl font-bold text-brand-text">{deck?.level}</h2>
            <p className="text-xs font-bold text-brand-text/30 uppercase tracking-widest">
              Thẻ {currentIndex + 1} / {words.length}
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md h-1.5 bg-brand-secondary/20 rounded-full mb-6 overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-brand-accent"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>

        {/* Flashcard */}
        <div className="w-full max-w-md perspective-1000 mb-6 h-[260px] sm:h-[300px] relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentIndex}
              initial={{ x: direction * 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -direction * 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 25 }}
                onClick={handleFlip}
                className="relative w-full h-full cursor-pointer preserve-3d"
              >
                {/* Front Side */}
                <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-xl border border-brand-secondary/20 flex flex-col items-center justify-center p-8 backface-hidden">
                  <button
                    onClick={handleToggleStar}
                    className={`absolute z-10 top-6 right-6 p-3 rounded-2xl transition-all cursor-pointer hover:scale-110 ${currentWord?.isStarred ? 'bg-yellow-50 text-yellow-500 shadow-sm' : 'text-brand-text/10 hover:bg-brand-secondary/10'
                      }`}
                  >
                    <Star className={`w-6 h-6 ${currentWord?.isStarred ? 'fill-current' : ''}`} />
                  </button>
                  <h1 className={`font-bold text-brand-text mb-2 font-itim text-center px-4 leading-tight ${
                    !currentWord?.word || currentWord.word.length <= 2 ? 'text-6xl sm:text-7xl' :
                    currentWord.word.length <= 4 ? 'text-4xl sm:text-5xl' :
                    currentWord.word.length <= 6 ? 'text-3xl sm:text-4xl' :
                    'text-2xl sm:text-3xl'
                  }`}>
                    {currentWord?.word}
                  </h1>
                  <p className="text-lg sm:text-xl text-brand-text/40 font-medium mb-4 pinyin-display text-center px-4">{currentWord?.pinyin}</p>

                  <button
                    onClick={(e) => playAudio(e, currentWord?.word)}
                    className="relative z-10 p-4 bg-brand-accent/10 hover:bg-brand-accent/20 rounded-full text-brand-accent transition-all hover:scale-110 cursor-pointer"
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>

                  <div className="absolute bottom-8 left-0 right-0 text-center">
                    <p className="text-[14px] font-bold text-brand-text/60 uppercase tracking-[0.2em] animate-pulse">Nhấn thẻ để lật</p>
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 bg-[#FFFDF9] rounded-[2.5rem] shadow-xl border border-brand-secondary/20 flex flex-col p-4 sm:p-5 backface-hidden rotate-y-180 overflow-hidden">

                  {/* Top Header Row */}
                  <div className="flex items-start justify-between w-full mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-[#FDF5E6] text-[#D4A373] text-[10px] sm:text-xs font-bold rounded-xl border border-[#F2E5D5]">
                        {deck?.level || 'Bộ từ vựng'}
                      </span>
                    </div>
                    <button
                      onClick={handleToggleStar}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${currentWord?.isStarred ? 'text-yellow-500 hover:scale-110' : 'text-[#D4A373]/40 hover:bg-[#FDF5E6]'
                        }`}
                    >
                      <Star className={`w-6 h-6 ${currentWord?.isStarred ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col w-full text-left overflow-hidden">

                    {/* Nghĩa Việt Section */}
                    <div className="relative mb-5 shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#D4A373] uppercase tracking-widest">
                          Nghĩa Việt:
                        </span>
                        <button
                          onClick={(e) => playAudio(e, currentWord?.word)}
                          className="p-2 bg-[#FDF5E6] hover:bg-[#F2E5D5] text-[#D4A373] rounded-full transition-all cursor-pointer hover:scale-110 active:scale-95"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#5C4A3D] leading-tight pr-12">
                        {currentWord?.meaning}
                      </h2>
                    </div>

                    {/* Pinyin and Hán Việt Row */}
                    <div className="grid grid-cols-2 gap-3 mb-3 shrink-0">
                      <div className="bg-white rounded-xl p-2 border border-[#F2E5D5] shadow-sm flex flex-col justify-center">
                        <p className="text-[8px] font-bold text-[#D4A373] uppercase tracking-widest mb-0.5">Pinyin & Loại từ</p>
                        <p className="text-sm font-bold text-[#5C4A3D]">
                          {currentWord?.pinyin}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-2 border border-[#F2E5D5] shadow-sm flex flex-col justify-center">
                        <p className="text-[8px] font-bold text-[#D4A373] uppercase tracking-widest mb-0.5">Hán Việt</p>
                        <p className="text-sm font-bold text-[#5C4A3D]">
                          {currentWord?.hanViet || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Ví dụ Section */}
                    {currentWord?.example && (
                      <div className="relative pb-2 flex-1 min-h-[100px] max-h-[140px] sm:max-h-[160px] flex flex-col">
                        <div className="bg-[#FFF9F2] rounded-xl p-4 border-l-[4px] border-[#E69D7D] shadow-sm overflow-y-auto scrollbar-hide h-full">
                          <p className="text-[9px] font-bold text-[#D4A373] uppercase tracking-widest mb-2">
                            Ví dụ áp dụng:
                          </p>
                          {(() => {
                            const parsed = currentWord.example.match(/^(.*?)\s*\((.*?)\)\s*-\s*(.*)$/);
                            if (parsed) {
                              return (
                                <div className="space-y-0.5">
                                  <p className="text-sm sm:text-base font-bold text-[#5C4A3D]">{parsed[1].trim()}</p>
                                  <p className="text-[14px] italic text-[#D4A373] font-medium">{parsed[2].trim()}</p>
                                  <p className="text-[14px] text-[#5C4A3D]/80 font-medium">{parsed[3].trim()}</p>
                                </div>
                              );
                            }
                            return (
                              <p className="text-[12px] sm:text-[13px] font-medium text-[#5C4A3D] leading-relaxed">
                                {currentWord.example}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        <div className="w-full max-w-md flex items-center justify-center gap-4 sm:gap-6 mb-6 px-4">
          <button
            onClick={handlePrev}
            className="group flex items-center justify-center p-3 sm:p-3.5 bg-white hover:bg-brand-secondary/10 rounded-2xl text-brand-text/30 hover:text-brand-accent transition-all shadow-sm active:scale-90"
            title="Nhấn phím mũi tên trái"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleFlip}
            className="px-6 py-2.5 bg-brand-secondary/20 hover:bg-brand-secondary/30 rounded-2xl text-brand-text font-bold text-xs sm:text-sm transition-all active:scale-95"
            title="Nhấn phím Space"
          >
            Lật thẻ [Space]
          </button>

          <button
            onClick={handleNext}
            className="group flex items-center justify-center p-3 sm:p-3.5 bg-white hover:bg-brand-secondary/10 rounded-2xl text-brand-text/30 hover:text-brand-accent transition-all shadow-sm active:scale-90"
            title="Nhấn phím mũi tên phải"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Learning Controls */}
        <div className="max-w-md mx-auto flex flex-col items-center gap-4 relative">
          <AnimatePresence>
            {saveStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute -top-12 bg-brand-accent text-white px-6 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Đã cập nhật tiến độ!
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start justify-center gap-4 sm:gap-8">
            <div
              onClick={() => handleStatusUpdate('urgent')}
              className="flex flex-col items-center gap-2 group cursor-pointer w-20 sm:w-24"
            >
              <button className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${currentWord?.status === 'urgent'
                ? 'border-orange-500 text-orange-500 bg-orange-50 ring-4 ring-orange-100'
                : 'border-brand-secondary/20 text-brand-text/30 group-hover:border-orange-400 group-hover:text-orange-400 group-hover:bg-orange-50'
                }`}>
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </button>
              <span className="text-[9px] font-bold text-brand-text/40 group-hover:text-orange-500 uppercase tracking-widest transition-colors text-center">Học gấp [U]</span>
            </div>

            <div
              onClick={() => handleStatusUpdate('not_learned')}
              className="flex flex-col items-center gap-2 group cursor-pointer w-20 sm:w-24"
            >
              <button className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${currentWord?.status === 'not_learned'
                ? 'border-red-500 text-red-500 bg-red-50 ring-4 ring-red-100'
                : 'border-brand-secondary/20 text-brand-text/30 group-hover:border-red-500 group-hover:text-red-500 group-hover:bg-red-50'
                }`}>
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </button>
              <span className="text-[9px] font-bold text-brand-text/40 group-hover:text-red-500 uppercase tracking-widest transition-colors text-center">Chưa thuộc</span>
            </div>

            <div
              onClick={() => handleStatusUpdate('learned')}
              className="flex flex-col items-center gap-2 group cursor-pointer w-20 sm:w-24"
            >
              <button className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${currentWord?.status === 'learned'
                ? 'border-green-500 text-green-500 bg-green-50 ring-4 ring-green-100'
                : 'border-brand-secondary/20 text-brand-text/30 group-hover:border-green-500 group-hover:text-green-500 group-hover:bg-green-50'
                }`}>
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </button>
              <span className="text-[9px] font-bold text-brand-text/40 group-hover:text-green-600 uppercase tracking-widest transition-colors text-center">Đã thuộc [Enter]</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
