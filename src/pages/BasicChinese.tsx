import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import DeckList from '../components/DeckList';
import Footer from '../components/Footer';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BasicChinese() {
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
            <h1 className="text-3xl font-bold text-brand-text">Tiếng Trung cơ bản</h1>
            <p className="text-brand-text/60">Chinh phục HSK từ con số 0</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DeckList decks={decks} />
        </motion.div>

        <Footer />
      </main>
    </div>
  );
}
