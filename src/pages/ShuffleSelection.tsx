import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, ArrowLeft, Gamepad2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';

export default function ShuffleSelection() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const res: any = await api.getUserShuffleTopics();
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
            <h1 className="text-3xl font-bold text-brand-text">Sắp xếp câu</h1>
            <p className="text-brand-text/60">Chọn chủ đề để bắt đầu luyện tập</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, index) => {
            const IconComponent = (Icons as any)[topic.icon] || Gamepad2;
            
            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-6 border border-brand-secondary/20 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <span className="bg-brand-secondary/20 text-brand-text/60 text-xs font-bold px-3 py-1 rounded-full">
                    {topic.totalSentences ?? topic.count} câu
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold text-brand-text mb-2">{topic.title}</h3>
                <p className="text-brand-text/60 text-sm mb-4 line-clamp-2">
                  {topic.description}
                </p>
                
                {/* Progress Bar */}
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-brand-text/60">Tiến độ</span>
                    <span className="text-brand-accent">
                      {topic.completedSentences || 0} / {topic.totalSentences ?? topic.count}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-brand-secondary/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-accent rounded-full transition-all duration-500"
                      style={{ 
                        width: `${topic.totalSentences > 0 ? ((topic.completedSentences || 0) / topic.totalSentences) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
                
                <Link 
                  to={`/shuffle/${topic.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-brand-accent text-white rounded-2xl font-bold shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all group-hover:scale-[1.02]"
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
