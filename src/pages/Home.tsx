import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import InfoSection from '../components/InfoSection';
import ButtonGroup from '../components/ButtonGroup';
import CardList from '../components/CardList';
import Footer from '../components/Footer';
import { motion } from 'motion/react';
import { Loader2, Gamepad2, TrendingUp, Award } from 'lucide-react';
import LearningProgressSummary from '../components/LearningProgressSummary';
import GreetingCard from '../components/GreetingCard';
import { getLoggedInUsername } from '../services/auth';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(getLoggedInUsername());

  useEffect(() => {
    const handleAuthChange = () => {
      setUsername(getLoggedInUsername());
    };
    window.addEventListener('auth_change', handleAuthChange);
    return () => window.removeEventListener('auth_change', handleAuthChange);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [userRes, profileRes, postsRes]: any = await Promise.all([
          api.getUser(),
          api.getProfile(),
          api.getPosts()
        ]);
        setUser(userRes.data);
        setProfile(profileRes.data);
        setPosts(postsRes.data);
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-brand-accent" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
        <div className="text-center space-y-4">
          <p className="text-red-500 font-bold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-brand-accent text-white rounded-full"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {!username && (
          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <HeroSection />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="bg-white p-8 rounded-[2.5rem] border border-brand-secondary/20 text-center space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-20 h-20 mx-auto bg-blue-50 text-blue-500 rounded-[1.5rem] flex items-center justify-center">
                  <Gamepad2 className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-xl text-brand-text">Học Mà Chơi</h3>
                <p className="text-brand-text/60 leading-relaxed">Biến việc học từ vựng khô khan thành trải nghiệm thú vị như một trò chơi. Học tiếng Trung chưa bao giờ vui đến thế!</p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-brand-secondary/20 text-center space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-20 h-20 mx-auto bg-green-50 text-green-500 rounded-[1.5rem] flex items-center justify-center">
                  <TrendingUp className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-xl text-brand-text">Theo Dõi Tiến Độ</h3>
                <p className="text-brand-text/60 leading-relaxed">Nắm bắt chi tiết số lượng từ đã thuộc, gợi ý những từ cần học gấp để tối ưu hóa quá trình ôn tập.</p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-brand-secondary/20 text-center space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-20 h-20 mx-auto bg-yellow-50 text-yellow-500 rounded-[1.5rem] flex items-center justify-center">
                  <Award className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-xl text-brand-text">Chinh Phục HSK</h3>
                <p className="text-brand-text/60 leading-relaxed">Lộ trình được thiết kế chuẩn theo bộ từ vựng HSK, giúp bạn dễ dàng vượt qua các kỳ thi chứng chỉ.</p>
              </div>
            </motion.div>
          </div>
        )}

        {username && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GreetingCard username={username || 'Bạn'} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <LearningProgressSummary />
            </motion.div>
          </div>
        )}

        {username && (
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold px-2">Kết nối với Hanzify</h2>
              <ButtonGroup socials={profile.socials} />
            </motion.div>

            {profile.sections.map((section: any) => (
              <InfoSection
                key={section.id}
                title={section.title}
                type={section.type as 'grid' | 'list'}
                items={section.items}
              />
            ))}

            <CardList posts={posts} />
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}
