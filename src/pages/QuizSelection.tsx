import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, ArrowLeft, Brain, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';

export default function QuizSelection() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const res: any = await api.getQuizTopics();
        setTopics(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTopics();
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
            <h1 className="text-3xl font-bold text-brand-text">Minigame: Quiz</h1>
            <p className="text-brand-text/60">Chọn chủ đề để bắt đầu thử thách</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, index) => {
            const IconComponent = (Icons as any)[topic.icon] || Brain;
            
            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-[2rem] p-8 border border-brand-secondary/20 shadow-sm hover:shadow-md transition-all group relative"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent">
                    <IconComponent className="w-10 h-10" />
                  </div>
                  <span className="bg-brand-secondary/20 text-brand-text/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {topic.count} câu
                  </span>
                </div>
                
                <div className="space-y-2 mb-8">
                  <h3 className="text-2xl font-bold text-brand-text">{topic.title}</h3>
                  <p className="text-brand-text/40 text-sm line-clamp-2 font-medium">
                    {topic.description}
                  </p>
                </div>
                
                <Link 
                  to={`/quiz/${topic.id}`}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-brand-accent text-white rounded-2xl font-bold shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all group-hover:scale-[1.02]"
                >
                  Chơi ngay
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        <Footer />
      </main>
    </div>
  );
}
