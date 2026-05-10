import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Lightbulb,
  RotateCcw,
  ChevronRight,
  Trophy
} from 'lucide-react';

interface WordObj {
  id: string;
  word: string;
  pinyin: string;
}

const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const playChime = (freq: number, startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    };
    playChime(659.25, ctx.currentTime);       // E5
    playChime(880.00, ctx.currentTime + 0.1); // A5
  } catch (e) {
    console.error("Audio error", e);
  }
};

const playVictorySound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const playChime = (freq: number, startTime: number, duration: number = 0.3) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    playChime(523.25, ctx.currentTime, 0.2);       // C5
    playChime(659.25, ctx.currentTime + 0.15, 0.2); // E5
    playChime(783.99, ctx.currentTime + 0.3, 0.2);  // G5
    playChime(1046.50, ctx.currentTime + 0.45, 0.6); // C6
  } catch (e) {
    console.error("Audio error", e);
  }
};

export default function ShuffleGame() {
  const { id } = useParams<{ id: string }>();
  const [topic, setTopic] = useState<any>(null);
  const [sentences, setSentences] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedWords, setSelectedWords] = useState<WordObj[]>([]);
  const [availableWords, setAvailableWords] = useState<WordObj[]>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [score, setScore] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) return;
        const [topicsRes, sentencesRes]: any = await Promise.all([
          api.getShuffleTopics(),
          api.getUncompletedSentencesByTopicId(id)
        ]);
        const currentTopic = topicsRes.data.find((t: any) => t.id === id);
        setTopic(currentTopic);
        setSentences(sentencesRes.data);

        if (sentencesRes.data.length > 0) {
          initLevel(sentencesRes.data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const initLevel = (sentence: any) => {
    const combined = sentence.chinese.map((w: string, i: number) => ({
      id: `${w}-${i}`,
      word: w,
      pinyin: sentence.pinyin && sentence.pinyin[i] ? sentence.pinyin[i] : ''
    }));
    const shuffled = [...combined].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setSelectedWords([]);
    setStatus('idle');
    setShowTip(false);
  };

  const handleWordClick = (wordObj: WordObj, fromSelected: boolean) => {
    if (status !== 'idle') return;

    if (fromSelected) {
      setSelectedWords(prev => prev.filter(w => w.id !== wordObj.id));
      setAvailableWords(prev => prev.some(w => w.id === wordObj.id) ? prev : [...prev, wordObj]);
    } else {
      setAvailableWords(prev => prev.filter(w => w.id !== wordObj.id));
      setSelectedWords(prev => prev.some(w => w.id === wordObj.id) ? prev : [...prev, wordObj]);
    }
  };

  const checkAnswer = async () => {
    const currentSentence = sentences[currentIndex];
    const selectedText = selectedWords.map(w => w.word);
    const isCorrect = JSON.stringify(selectedText) === JSON.stringify(currentSentence.correctOrder);

    if (isCorrect) {
      setStatus('correct');
      setScore(prev => prev + 10);
      playSuccessSound();

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentSentence.correctOrder.join(''));
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
      }

      try {
        await api.markShuffleSentenceCompleted(topic.id, currentSentence.id);
      } catch (err) {
        console.error('Failed to save progress', err);
      }

      // Automatically transition to the next level or completion screen after a delay
      setTimeout(() => {
        if (currentIndex === sentences.length - 1) {
          setIsCompleted(true);
          playVictorySound();
        }
      }, 2500);

    } else {
      setStatus('wrong');
    }
  };

  const nextLevel = () => {
    if (currentIndex < sentences.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      initLevel(sentences[nextIdx]);
    } else {
      setIsCompleted(true);
      playVictorySound();
    }
  };

  const resetLevel = () => {
    initLevel(sentences[currentIndex]);
  };

  const handlePlayAgain = async () => {
    setLoading(true);
    try {
      await api.resetShuffleProgress(topic.id);
      const res: any = await api.getUncompletedSentencesByTopicId(topic.id);
      setSentences(res.data);
      setCurrentIndex(0);
      setIsCompleted(false);
      if (res.data.length > 0) {
        initLevel(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (!topic) return <div>Không tìm thấy dữ liệu</div>;

  if (sentences.length === 0 || isCompleted) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center space-y-6 max-w-md w-full border border-brand-secondary/20">
          <Trophy className="w-20 h-20 text-brand-accent mx-auto" />
          <h2 className="text-2xl font-bold text-brand-text">Tuyệt vời!</h2>
          <p className="text-brand-text/60">Bạn đã hoàn thành tất cả các câu trong chủ đề <strong className="text-brand-accent">{topic.title}</strong>.</p>
          <div className="space-y-3">
            <button
              onClick={handlePlayAgain}
              className="w-full flex items-center justify-center gap-2 py-4 bg-orange-400 text-white rounded-2xl font-bold shadow-lg shadow-orange-400/20 hover:bg-orange-500 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              Chơi lại
            </button>
            <Link
              to="/shuffle"
              className="block w-full py-4 bg-brand-accent text-white rounded-2xl font-bold shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all"
            >
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const currentSentence = sentences[currentIndex];

  return (
    <div className="min-h-screen bg-brand-bg">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/shuffle"
            className="flex items-center gap-2 text-brand-text/60 hover:text-brand-text transition-colors font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <div className="text-brand-accent font-bold text-xl">
            Câu: <span className="text-brand-text">{currentIndex + 1}/{sentences.length}</span>
          </div>
          <div className="text-brand-text font-bold text-xl">
            Điểm: <span className="text-brand-accent">{score}</span>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-white rounded-[2rem] border border-brand-secondary/20 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 space-y-8">
            {/* Vietnamese Prompt */}
            <div className="text-center space-y-3">
              <p className="text-[10px] font-bold text-brand-text/30 uppercase tracking-[0.2em]">Mẫu câu</p>
              <h2 className="text-xl sm:text-2xl font-bold text-brand-text leading-tight">
                {currentSentence.vietnamese}
              </h2>
            </div>

            <div className="space-y-6">
              <p className="text-center text-xs sm:text-sm text-brand-text/50">Sắp xếp các từ dưới đây thành câu tiếng Trung đúng:</p>

              {/* Selected Words Area */}
              <div className="min-h-[120px] p-4 bg-brand-secondary/5 rounded-2xl border-2 border-dashed border-brand-secondary/20 flex flex-wrap content-start justify-center gap-2 items-center">
                <AnimatePresence>
                  {selectedWords.map((wordObj) => (
                    <motion.button
                      key={wordObj.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      whileHover={{ y: -2 }}
                      onClick={() => handleWordClick(wordObj, true)}
                      className={`
                        px-4 py-2.5 rounded-xl shadow-sm transition-all flex flex-col items-center justify-center
                        ${status === 'correct' ? 'bg-green-500 text-white' :
                          status === 'wrong' ? 'bg-red-500 text-white' :
                            'bg-white text-brand-text border border-brand-secondary/30'}
                      `}
                    >
                      {wordObj.pinyin && <span className="text-[13px] font-medium opacity-70 block -mb-0.5">{wordObj.pinyin}</span>}
                      <span className="font-bold text-xl">{wordObj.word}</span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              {/* Available Words Area */}
              <div className="space-y-3">
                <p className="text-center text-[10px] font-bold text-brand-text/30 uppercase tracking-widest">Các từ có sẵn</p>
                <div className="min-h-[120px] flex flex-wrap content-start justify-center gap-2 p-4 bg-brand-secondary/5 rounded-2xl border border-brand-secondary/10">
                  {availableWords.map((wordObj) => (
                    <motion.button
                      key={wordObj.id}
                      whileHover={{ y: -2, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleWordClick(wordObj, false)}
                      className="px-4 py-2.5 bg-white text-brand-text rounded-xl border border-brand-secondary/30 shadow-sm hover:border-brand-accent transition-all flex flex-col items-center justify-center"
                    >
                      {wordObj.pinyin && <span className="text-[13px] font-medium text-brand-text/50 block -mb-0.5">{wordObj.pinyin}</span>}
                      <span className="font-bold text-xl">{wordObj.word}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hint Area */}
            <div className="min-h-[50px] flex items-center justify-center">
              <AnimatePresence>
                {showTip && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-orange-700 text-[13px] sm:text-sm italic text-center w-full"
                  >
                    Gợi ý: {currentSentence.correctOrder.join(' ')}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {status === 'idle' ? (
                <>
                  <button
                    onClick={checkAnswer}
                    disabled={selectedWords.length === 0}
                    className={`flex-1 py-3 rounded-xl font-bold shadow-md transition-all ${selectedWords.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-[#FF8A75] text-white cursor-pointer hover:brightness-110 shadow-[#FF8A75]/40'
                      }`}
                  >
                    Kiểm tra đáp án
                  </button>
                  <button
                    onClick={() => setShowTip(!showTip)}
                    className="cursor-pointer flex-1 py-3 bg-orange-400 text-white rounded-xl font-bold shadow-md shadow-orange-400/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
                    Tip
                  </button>
                  <button
                    onClick={nextLevel}
                    className="cursor-pointer flex-1 py-3 bg-brand-secondary/30 text-brand-text rounded-xl font-bold hover:bg-brand-secondary/50 transition-all"
                  >
                    Bỏ qua
                  </button>
                </>
              ) : status === 'correct' ? (
                <button
                  onClick={nextLevel}
                  className="w-full py-3 bg-green-500 text-white rounded-xl font-bold shadow-md shadow-green-500/20 hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                >
                  {currentIndex < sentences.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              ) : (
                <button
                  onClick={resetLevel}
                  className="w-full py-3 bg-red-500 text-white rounded-xl font-bold shadow-md shadow-red-500/20 hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  Thử lại
                </button>
              )}
            </div>
          </div>
        </div>



        <Footer />
      </main>
    </div>
  );
}
