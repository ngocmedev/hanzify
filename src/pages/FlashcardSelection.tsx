import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, ArrowLeft, Layers, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FlashcardSelection() {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDecks = async () => {
      try {
        const res: any = await api.getDecks();
        setDecks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDecks();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="p-2 hover:bg-brand-secondary/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-brand-text" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-brand-text">Flashcard Từ Vựng</h1>
            <p className="text-brand-text/60">Chọn bộ deck HSK để bắt đầu ôn tập</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck, index) => (
            <motion.div
              key={deck.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-6 border border-brand-secondary/20 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent">
                  <Layers className="w-8 h-8" />
                </div>
                <span className="bg-brand-secondary/20 text-brand-text/60 text-xs font-bold px-3 py-1 rounded-full">
                  {deck.count} thẻ
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-brand-text mb-2">{deck.level}</h3>
              <p className="text-brand-text/60 text-sm mb-6 line-clamp-2">
                {deck.description}
              </p>

              {deck.totalWords !== undefined && deck.learnedWords !== undefined && (
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-brand-text/60">
                    <span>Tiến độ</span>
                    <span>{deck.learnedWords} / {deck.totalWords} từ</span>
                  </div>
                  <div className="w-full h-2 bg-brand-secondary/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((deck.learnedWords / Math.max(deck.totalWords, 1)) * 100)}%` }}
                      className="h-full bg-brand-accent rounded-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-600 rounded-md">Đã thuộc: {deck.learnedWords}</span>
                    <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-md">Chưa: {deck.notLearnedWords || 0}</span>
                    <span className="text-[10px] font-bold px-2 py-1 bg-[#E69D7D]/20 text-[#E69D7D] rounded-md">Gấp: {deck.urgentWords || 0}</span>
                  </div>
                </div>
              )}
              
              <Link 
                to={`/flashcards/${deck.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-accent text-white rounded-2xl font-bold shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all group-hover:scale-[1.02]"
              >
                Học Flashcard
                <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>
          ))}
        </div>

        <Footer />
      </main>
    </div>
  );
}
