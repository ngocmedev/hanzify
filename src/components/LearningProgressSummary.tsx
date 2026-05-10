import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Star, 
  BookOpen, 
  Play, 
  Calendar,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { getProgressSummary } from '../services/progress';
import { useNavigate } from 'react-router-dom';

export default function LearningProgressSummary() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNoStarModal, setShowNoStarModal] = useState(false);
  const [showNoUnlearnedModal, setShowNoUnlearnedModal] = useState(false);
  const navigate = useNavigate();

  const handleStarredClick = () => {
    if (data && data.starredCount === 0) {
      setShowNoStarModal(true);
    } else {
      navigate('/flashcards/starred');
    }
  };

  const handleUnlearnedClick = () => {
    if (data && (data.urgentCount + data.notLearnedCount) === 0) {
      setShowNoUnlearnedModal(true);
    } else {
      navigate('/flashcards/unlearned');
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const summary = await getProgressSummary();
      setData(summary);
    } catch (err) {
      console.error('Failed to fetch summary', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center bg-white rounded-[2.5rem] border border-brand-secondary/20">
      <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data || data.totalWords === 0) return null;

  const progressPercent = Math.round((data.learnedCount / data.totalWords) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Left Card: Urgent Words */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-6 bg-gradient-to-br from-[#E69D7D] to-[#D58A6A] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-brand-accent/10"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <AlertCircle className="w-48 h-48 rotate-12" />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-lg uppercase tracking-wider">
              <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                <AlertCircle className="w-5 h-5" />
              </div>
              TỪ CẦN HỌC & CHƯA THUỘC
            </div>
            <p className="text-white/80 font-medium">Bạn có {data.urgentCount + data.notLearnedCount} từ vựng cần học.</p>
          </div>

          <div className="mt-12 space-y-4">
            <button 
              onClick={handleUnlearnedClick}
              className="w-full bg-white text-[#E69D7D] font-bold py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5 fill-current" />
              Học Từ Chưa Thuộc
            </button>
          </div>
        </div>
      </motion.div>

      {/* Right Column: Starred and Progress */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        
        {/* Starred Words Card */}
        <motion.div 
          onClick={handleStarredClick}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#FFD700] rounded-[2.5rem] p-8 flex items-center justify-between group cursor-pointer relative overflow-hidden shadow-lg shadow-yellow-500/10"
        >
           <Star className="absolute -bottom-4 -right-4 w-24 h-24 text-white/40 group-hover:scale-110 transition-transform" />
           
           <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-white/30 rounded-[1.5rem] flex items-center justify-center text-white backdrop-blur-sm shadow-inner">
               <Star className="w-8 h-8 fill-current" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-brand-text">Từ vựng đã gắn sao</h3>
               <p className="text-brand-text/60 font-medium">Bạn có {data.starredCount} từ vựng quan trọng</p>
               <div className="mt-2 flex items-center gap-1 text-brand-text/40 text-xs font-bold uppercase tracking-widest">
                  <Play className="w-3 h-3 fill-current" /> Nhấn để học ngay
               </div>
             </div>
           </div>
           
           <ChevronRight className="w-6 h-6 text-brand-text/20 group-hover:translate-x-1 transition-transform" />
        </motion.div>

        {/* Overall Progress Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2.5rem] p-8 border border-brand-secondary/20 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <BookOpen className="w-5 h-5 text-brand-text/40" />
               <h3 className="font-bold text-brand-text">Tiến độ Tổng Thể</h3>
             </div>
             <span className="text-2xl font-bold text-brand-text">{progressPercent}%</span>
          </div>

          <div className="space-y-3">
            <div className="w-full h-3 bg-brand-secondary/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-[#E69D7D] rounded-full"
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-brand-text/40 uppercase tracking-widest">
              <span>Bắt đầu</span>
              <span>Đã thuộc {data.learnedCount}/{data.totalWords} từ</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* No Starred Words Modal */}
      <AnimatePresence>
        {showNoStarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowNoStarModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl overflow-hidden border border-brand-secondary/20 text-center"
            >
              <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-yellow-500 fill-current" />
              </div>
              <h3 className="text-2xl font-bold text-brand-text mb-4">Chưa có từ vựng nào</h3>
              <p className="text-brand-text/60 leading-relaxed mb-8">
                Bạn chưa gán sao từ vựng nào. Hãy gắn sao cho những từ vựng khó nhớ hoặc quan trọng trong quá trình học và quay lại đây nhé!
              </p>
              <button 
                onClick={() => setShowNoStarModal(false)}
                className="w-full py-4 bg-brand-accent text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
              >
                Đã hiểu
              </button>
            </motion.div>
          </div>
        )}

        {/* No Unlearned Words Modal */}
        {showNoUnlearnedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowNoUnlearnedModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl overflow-hidden border border-brand-secondary/20 text-center"
            >
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-brand-text mb-4">Không có từ chưa thuộc</h3>
              <p className="text-brand-text/60 leading-relaxed mb-8">
                Bạn chưa đánh dấu từ vựng nào là "Chưa thuộc" hoặc "Học gấp". Khi đang học thẻ vựng, hãy đánh dấu vào các nút trạng thái tương ứng để hệ thống lưu lại nhé!
              </p>
              <button 
                onClick={() => setShowNoUnlearnedModal(false)}
                className="w-full py-4 bg-brand-accent text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
              >
                Đã hiểu
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
