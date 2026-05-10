import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Trophy,
  HelpCircle
} from 'lucide-react';

export default function QuizGame() {
  const { id } = useParams<{ id: string }>();
  const [topic, setTopic] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [score, setScore] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) return;
        const [topicsRes, quizzesRes]: any = await Promise.all([
          api.getQuizTopics(),
          api.getQuizzesByTopicId(id)
        ]);
        const currentTopic = topicsRes.data.find((t: any) => t.id === id);
        setTopic(currentTopic);
        setQuizzes(quizzesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleOptionClick = (option: string) => {
    if (status !== 'idle') return;
    setSelectedOption(option);
  };

  const checkAnswer = () => {
    if (!selectedOption) return;
    const currentQuiz = quizzes[currentIndex];
    const isCorrect = selectedOption === currentQuiz.correctAnswer;
    
    if (isCorrect) {
      setStatus('correct');
      setScore(prev => prev + 10);
    } else {
      setStatus('wrong');
    }
  };

  const nextQuestion = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setStatus('idle');
    }
  };

  const skipQuestion = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setStatus('idle');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (!topic || quizzes.length === 0) return <div>Không tìm thấy dữ liệu</div>;

  const currentQuiz = quizzes[currentIndex];

  return (
    <div className="min-h-screen bg-brand-bg">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link 
            to="/quiz" 
            className="flex items-center gap-2 text-brand-text/60 hover:text-brand-text transition-colors font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <div className="text-brand-accent font-bold text-xl">
            Câu: <span className="text-brand-text">{currentIndex + 1}/{quizzes.length}</span>
          </div>
          <div className="text-brand-text font-bold text-xl">
            Điểm: <span className="text-brand-accent">{score}</span>
          </div>
        </div>

        {/* Quiz Area */}
        <div className="bg-white rounded-[2.5rem] border border-brand-secondary/20 shadow-xl overflow-hidden">
          <div className="p-8 sm:p-12 space-y-10">
            {/* Context Box */}
            <div className="bg-brand-secondary/5 p-8 rounded-3xl border border-brand-secondary/10 text-center">
              <h2 className="text-4xl font-bold text-brand-text leading-tight">
                {currentQuiz.context}
              </h2>
            </div>

            {/* Question */}
            <div className="space-y-6">
              <p className="text-2xl font-bold text-brand-text/80 text-center">{currentQuiz.question}</p>
              
              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuiz.options.map((option: string) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = status !== 'idle' && option === currentQuiz.correctAnswer;
                  const isWrong = status === 'wrong' && isSelected && option !== currentQuiz.correctAnswer;

                  return (
                    <motion.button
                      key={option}
                      whileHover={{ scale: status === 'idle' ? 1.02 : 1 }}
                      whileTap={{ scale: status === 'idle' ? 0.98 : 1 }}
                      onClick={() => handleOptionClick(option)}
                      className={`
                        p-6 rounded-2xl border-2 text-left transition-all font-medium text-lg
                        ${isSelected && status === 'idle' ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-secondary/20'}
                        ${isCorrect ? 'border-green-500 bg-green-50 text-green-700' : ''}
                        ${isWrong ? 'border-red-500 bg-red-50 text-red-700' : ''}
                        ${status !== 'idle' && !isCorrect && !isWrong ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        {isWrong && <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {status === 'idle' ? (
                <>
                  <button 
                    onClick={checkAnswer}
                    disabled={!selectedOption}
                    className="flex-[2] py-4 bg-[#A8E082] text-white rounded-2xl font-bold shadow-lg shadow-[#A8E082]/20 hover:bg-[#96D16E] transition-all disabled:opacity-50"
                  >
                    Kiểm tra đáp án
                  </button>
                  <button 
                    onClick={skipQuestion}
                    className="flex-1 py-4 bg-white border border-brand-secondary/30 text-brand-text/60 rounded-2xl font-bold hover:bg-brand-secondary/5 transition-all"
                  >
                    Bỏ qua
                  </button>
                </>
              ) : (
                <button 
                  onClick={currentIndex === quizzes.length - 1 ? undefined : nextQuestion}
                  className={`
                    w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2
                    ${status === 'correct' ? 'bg-green-500 shadow-green-500/20' : 'bg-red-500 shadow-red-500/20'} text-white
                  `}
                >
                  {currentIndex === quizzes.length - 1 ? 'Hoàn thành Quiz' : 'Câu tiếp theo'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {currentIndex === quizzes.length - 1 && status !== 'idle' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-brand-accent text-white p-8 rounded-[2rem] text-center space-y-4 shadow-xl shadow-brand-accent/20"
          >
            <Trophy className="w-16 h-16 mx-auto" />
            <h2 className="text-2xl font-bold">Chúc mừng! Bạn đã hoàn thành Quiz!</h2>
            <p className="opacity-90">Tổng điểm của bạn: {score}</p>
            <Link 
              to="/quiz"
              className="inline-block px-8 py-3 bg-white text-brand-accent rounded-full font-bold hover:bg-opacity-90 transition-all"
            >
              Chọn chủ đề khác
            </Link>
          </motion.div>
        )}

        <Footer />
      </main>
    </div>
  );
}
