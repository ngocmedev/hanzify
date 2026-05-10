import React, { useState } from 'react';
import { BookOpen, Key, Zap, Puzzle, ChevronDown, LayoutList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function StudyGuide() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const scrollToSection = (id: string) => {
    if (!expandedSections.includes(id)) {
      setExpandedSections(prev => [...prev, id]);
    }
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80; // height of fixed navbar
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const sections = [
    {
      id: 'flashcard',
      title: 'Học bằng Flashcard',
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      iconBg: 'bg-yellow-500/10'
    },
    {
      id: 'shuffle',
      title: 'Học Sắp Xếp Câu',
      icon: <Puzzle className="w-5 h-5 text-blue-500" />,
      iconBg: 'bg-blue-500/10'
    },
    {
      id: 'quiz',
      title: 'Học qua Câu đố',
      icon: <Key className="w-5 h-5 text-orange-500" />,
      iconBg: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 bg-white rounded-3xl p-6 border border-brand-secondary/20 shadow-sm">
            <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
              <LayoutList className="w-5 h-5 text-brand-accent" />
              Danh mục
            </h3>
            <div className="space-y-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left font-medium ${expandedSections.includes(section.id)
                    ? 'bg-brand-secondary/10 text-brand-text'
                    : 'text-brand-text/60 hover:bg-brand-secondary/5 hover:text-brand-text'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${section.iconBg}`}>
                    {section.icon}
                  </div>
                  <span className="text-sm truncate">{section.title}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-3xl bg-brand-accent/10 flex items-center justify-center text-brand-accent shadow-sm shrink-0">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-brand-text mb-2">Hướng dẫn học thuật</h1>
              <p className="text-brand-text/60 text-lg">Cách tận dụng tối đa các chức năng để nhớ lâu hơn</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Flashcard Section */}
            <section id="flashcard" className="bg-white rounded-3xl border border-brand-secondary/20 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection('flashcard')}
                className="w-full p-6 sm:p-8 flex items-center justify-between hover:bg-brand-secondary/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-brand-text">Học bằng Flashcard</h2>
                </div>
                <ChevronDown className={`w-6 h-6 text-brand-text/40 transition-transform ${expandedSections.includes('flashcard') ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {expandedSections.includes('flashcard') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-8 sm:px-8 pt-2">
                      <div className="space-y-6">
                        <p className="text-brand-text/80 leading-relaxed text-[16px] sm:text-[18px]">
                          Flashcard giúp bạn ghi nhớ qua việc lặp lại ngắt quãng. Hãy trung thực với bản thân khi lật thẻ:
                        </p>

                        <div className="grid gap-4">
                          <div className="flex items-start gap-4 bg-green-50 p-4 rounded-2xl border border-green-100">
                            <span className="font-bold text-green-700 min-w-[100px] mt-0.5">Đã thuộc:</span>
                            <span className="text-green-800 leading-relaxed">
                              Nhấn nút <b>Đã thuộc</b> (hoặc phím Enter). Từ này sẽ được ẩn đi trong các lần học sau của bộ bài đó, giúp bạn tập trung vào các từ chưa nhớ.
                            </span>
                          </div>
                          <div className="flex items-start gap-4 bg-red-50 p-4 rounded-2xl border border-red-100">
                            <span className="font-bold text-red-700 min-w-[100px] mt-0.5">Chưa thuộc:</span>
                            <span className="text-red-800 leading-relaxed">
                              Nếu lật thẻ ra mà chưa nhớ nghĩa, hãy nhấn <b>Chưa thuộc</b> để từ này tiếp tục xuất hiện.
                            </span>
                          </div>
                          <div className="flex items-start gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                            <span className="font-bold text-orange-700 min-w-[100px] mt-0.5">Học gấp:</span>
                            <span className="text-orange-800 leading-relaxed">
                              Đánh dấu những từ cực kỳ khó nhớ hoặc quan trọng (hoặc phím U).
                            </span>
                          </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-brand-secondary/10">
                          <h4 className="text-sm font-bold text-brand-text/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Key className="w-4 h-4" /> Phím tắt nhanh
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            <span className="px-3 py-1.5 bg-brand-bg rounded-lg border border-brand-secondary/20 font-mono text-brand-text/70 text-sm shadow-sm">Space: Lật thẻ</span>
                            <span className="px-3 py-1.5 bg-brand-bg rounded-lg border border-brand-secondary/20 font-mono text-brand-text/70 text-sm shadow-sm">← / →: Tiến/Lùi</span>
                            <span className="px-3 py-1.5 bg-brand-bg rounded-lg border border-brand-secondary/20 font-mono text-brand-text/70 text-sm shadow-sm">Enter: Đã thuộc</span>
                            <span className="px-3 py-1.5 bg-brand-bg rounded-lg border border-brand-secondary/20 font-mono text-brand-text/70 text-sm shadow-sm">U: Học gấp</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Sắp xếp câu Section */}
            <section id="shuffle" className="bg-white rounded-3xl border border-brand-secondary/20 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection('shuffle')}
                className="w-full p-6 sm:p-8 flex items-center justify-between hover:bg-brand-secondary/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Puzzle className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-brand-text">Học Sắp Xếp Câu</h2>
                </div>
                <ChevronDown className={`w-6 h-6 text-brand-text/40 transition-transform ${expandedSections.includes('shuffle') ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {expandedSections.includes('shuffle') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-8 sm:px-8 pt-2">
                      <div className="space-y-6">
                        <p className="text-brand-text/80 leading-relaxed text-[16px] sm:text-[18px]">
                          Bài tập sắp xếp câu giúp bạn nắm vững cấu trúc ngữ pháp và trật tự từ trong tiếng Trung:
                        </p>

                        <ul className="space-y-4">
                          <li className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-brand-secondary/10 flex items-center justify-center text-brand-text font-bold shrink-0 mt-0.5">1</div>
                            <div className="text-brand-text/80 pt-1">
                              <strong className="text-brand-text">Chọn từ:</strong> Nhấn vào các từ ở phần <b>"Các từ có sẵn"</b> theo đúng thứ tự để tạo thành câu hoàn chỉnh mang nghĩa như mẫu câu tiếng Việt.
                            </div>
                          </li>
                          <li className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-brand-secondary/10 flex items-center justify-center text-brand-text font-bold shrink-0 mt-0.5">2</div>
                            <div className="text-brand-text/80 pt-1">
                              <strong className="text-brand-text">Bỏ chọn:</strong> Nếu chọn sai, nhấn vào từ ở ô phía trên để đưa từ đó trở lại danh sách có sẵn.
                            </div>
                          </li>
                          <li className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-brand-secondary/10 flex items-center justify-center text-brand-text font-bold shrink-0 mt-0.5">3</div>
                            <div className="text-brand-text/80 pt-1">
                              <strong className="text-brand-text">Kiểm tra:</strong> Sau khi đã sắp xếp xong, nhấn <b>"Kiểm tra đáp án"</b> để xem kết quả. Mỗi câu đúng bạn sẽ nhận được 10 điểm!
                            </div>
                          </li>
                          <li className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-brand-secondary/10 flex items-center justify-center text-brand-text font-bold shrink-0 mt-0.5">4</div>
                            <div className="text-brand-text/80 pt-1">
                              <strong className="text-brand-text">Gợi ý (Tip):</strong> Nếu gặp câu quá khó, bạn có thể nhấn nút <b>"Tip"</b> để xem đáp án gợi ý.
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
