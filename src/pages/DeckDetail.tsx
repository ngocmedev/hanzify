import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, ArrowLeft, CheckCircle2, Circle, Volume2, Trophy, XCircle, AlertCircle } from 'lucide-react';
import { getLoggedInUsername } from '../services/auth';
import { updateProgress } from '../services/progress';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export default function DeckDetail() {
  const { id } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<any>(null);
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) return;
        const [deckRes] = await Promise.all([
          api.getDeckById(id)
        ]);
        setDeck((deckRes as any).data);
        
        // Load words with progress if logged in
        if (getLoggedInUsername()) {
          const res = await fetch(`${API_URL}/user/decks/${id}/words`, {
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
            throw new Error('Failed to fetch words');
          }
          const wordsData = await res.json();
          setWords(wordsData);
        } else {
          // Public fetch
          const res: any = await api.getWordsByDeckId(id);
          // Load local progress if guest
          const saved = localStorage.getItem(`learned_deck_${id}`);
          let localLearned: string[] = [];
          if (saved) localLearned = JSON.parse(saved);
          
          const mappedWords = res.data.map((w: any) => ({
            ...w,
            status: localLearned.includes(w.id) ? 'learned' : null
          }));
          setWords(mappedWords);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200) {
        setVisibleCount(prev => prev + 20);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUpdateStatus = async (wordId: string, status: 'learned' | 'not_learned' | 'urgent') => {
    // Update local state first for instant feedback
    setWords(words.map(w => w.id === wordId ? { ...w, status: w.status === status ? null : status } : w));
    
    if (getLoggedInUsername()) {
      try {
        await updateProgress(wordId, status);
      } catch (e) {
        console.error("Failed to update status", e);
      }
    } else {
      // Guest mode: update local storage (only learned is supported for now, or map it)
      if (status === 'learned') {
        const saved = localStorage.getItem(`learned_deck_${id}`);
        let localLearned: string[] = saved ? JSON.parse(saved) : [];
        if (!localLearned.includes(wordId)) {
          localLearned.push(wordId);
          localStorage.setItem(`learned_deck_${id}`, JSON.stringify(localLearned));
        }
      }
    }
  };

  const learnedCount = words.filter(w => w.status === 'learned').length;
  const progress = words.length > 0 ? Math.round((learnedCount / words.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (!deck) return <div>Deck not found</div>;

  return (
    <div className="min-h-screen bg-brand-bg">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/basic-chinese" 
              className="p-2 hover:bg-brand-secondary/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-brand-text" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-brand-text">{deck.level}</h1>
              <p className="text-brand-text/60">{deck.description}</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-3xl border border-brand-secondary/20 shadow-sm flex items-center gap-4 min-w-[200px]">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24" cy="24" r="20"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-brand-secondary/20"
                />
                <circle
                  cx="24" cy="24" r="20"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 - (125.6 * progress) / 100}
                  className="text-brand-accent transition-all duration-500"
                />
              </svg>
              <span className="absolute text-[10px] font-bold">{progress}%</span>
            </div>
            <div>
              <p className="text-xs text-brand-text/50 font-bold uppercase tracking-wider">Tiến độ</p>
              <p className="text-sm font-bold">{learnedCount}/{words.length} từ đã thuộc</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {words.slice(0, visibleCount).map((word, index) => (
              <motion.div
                key={word.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (index % 20) * 0.025 }}
                className={`
                  flex items-center justify-between p-6 rounded-3xl border transition-all
                  ${word.status === 'learned' 
                    ? 'bg-green-50 border-green-100' 
                    : word.status === 'urgent'
                    ? 'bg-[#E69D7D]/5 border-[#E69D7D]/20'
                    : word.status === 'not_learned'
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white border-brand-secondary/20 shadow-sm'}
                `}
              >
                <div className="flex items-center gap-6">
                  <div className="text-4xl font-itim text-brand-text">{word.word}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-brand-accent">{word.pinyin}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                            const utterance = new SpeechSynthesisUtterance(word.word);
                            utterance.lang = 'zh-CN';
                            utterance.rate = 0.8;
                            window.speechSynthesis.speak(utterance);
                          }
                        }}
                        className="p-1 text-brand-text/30 hover:text-brand-accent transition-colors"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-brand-text/70">{word.meaning}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleUpdateStatus(word.id, 'learned')}
                    className={`p-2 rounded-xl transition-all ${word.status === 'learned' ? 'text-green-500 bg-green-100' : 'text-gray-300 hover:text-green-500 hover:bg-green-50'}`}
                    title="Đã thuộc"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(word.id, 'not_learned')}
                    className={`p-2 rounded-xl transition-all ${word.status === 'not_learned' ? 'text-gray-500 bg-gray-200' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                    title="Chưa thuộc"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(word.id, 'urgent')}
                    className={`p-2 rounded-xl transition-all ${word.status === 'urgent' ? 'text-[#E69D7D] bg-[#E69D7D]/20' : 'text-gray-300 hover:text-[#E69D7D] hover:bg-[#E69D7D]/10'}`}
                    title="Học gấp"
                  >
                    <AlertCircle className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {visibleCount < words.length && (
            <div className="py-4 flex justify-center">
              <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
            </div>
          )}
        </div>

        {progress === 100 && words.length > 0 && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-brand-accent text-white p-8 rounded-[2rem] text-center space-y-4 shadow-xl shadow-brand-accent/20"
          >
            <Trophy className="w-16 h-16 mx-auto" />
            <h2 className="text-2xl font-bold">Tuyệt vời! Bạn đã hoàn thành deck này!</h2>
            <p className="opacity-90">Hãy tiếp tục chinh phục các cấp độ tiếp theo nhé.</p>
            <Link 
              to="/basic-chinese"
              className="inline-block px-8 py-3 bg-white text-brand-accent rounded-full font-bold hover:bg-opacity-90 transition-all"
            >
              Tiếp tục học
            </Link>
          </motion.div>
        )}

        <Footer />
      </main>
    </div>
  );
}
