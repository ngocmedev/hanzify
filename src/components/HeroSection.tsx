import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, BookOpen, Users, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <div className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-brand-secondary/20 p-8 sm:p-12">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-accent/5 rounded-full -ml-32 -mb-32 blur-3xl" />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent/10 text-brand-accent rounded-full text-sm font-bold"
          >
            <Sparkles className="w-4 h-4" />
            <span>Nền tảng học tiếng Trung thế hệ mới</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-brand-text leading-tight">
              Học tiếng Trung <br />
              <span className="text-brand-accent italic font-hand text-5xl sm:text-6xl">Vui vẻ & Hiệu quả</span>
            </h1>
            <p className="text-lg text-brand-text/70 leading-relaxed max-w-lg">
              Chinh phục HSK, luyện phát âm chuẩn và giao tiếp tự tin cùng lộ trình học cá nhân hóa. Flazi giúp việc học ngoại ngữ trở nên thú vị như một trò chơi.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4"
          >
            <button 
              onClick={() => window.dispatchEvent(new Event('open_auth_modal'))}
              className="px-8 py-4 bg-brand-accent text-white rounded-2xl font-bold shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all hover:scale-105"
            >
              Bắt đầu học ngay
            </button>
            <button className="px-8 py-4 bg-white border border-brand-secondary text-brand-text rounded-2xl font-bold hover:bg-brand-secondary/10 transition-all">
              Tìm hiểu thêm
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-8 pt-4"
          >
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-brand-text">12K+</span>
              <span className="text-xs text-brand-text/50 font-bold uppercase tracking-wider">Học viên</span>
            </div>
            <div className="w-px h-8 bg-brand-secondary/30" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-brand-text">500+</span>
              <span className="text-xs text-brand-text/50 font-bold uppercase tracking-wider">Bài học</span>
            </div>
            <div className="w-px h-8 bg-brand-secondary/30" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-brand-text">4.9/5</span>
              <span className="text-xs text-brand-text/50 font-bold uppercase tracking-wider">Đánh giá</span>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="relative hidden lg:block"
        >
          <div className="relative z-10 bg-brand-secondary/10 rounded-[3rem] p-4 border border-brand-secondary/20">
            <img 
              src="https://picsum.photos/seed/learning/800/600" 
              alt="Learning Chinese" 
              className="rounded-[2.5rem] shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Floating badges */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-brand-secondary/20 flex items-center gap-3 z-20"
          >
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-text/40 uppercase">Tài liệu</p>
              <p className="font-bold text-brand-text">Miễn phí 100%</p>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-brand-secondary/20 flex items-center gap-3 z-20"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-text/40 uppercase">Lộ trình</p>
              <p className="font-bold text-brand-text">Cá nhân hóa</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
