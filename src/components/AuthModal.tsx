import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { registerUser, loginUser } from '../services/auth';
import loginIllustration from '../assets/login_illustration.png';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (username: string) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await loginUser(username, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userId', data.id);
        onLoginSuccess(data.username);
        onClose();
      } else {
        await registerUser(username, email, password);
        const data = await loginUser(username, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userId', data.id);
        onLoginSuccess(data.username);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-text/20 backdrop-blur-md p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="bg-white/95 md:bg-white/80 md:backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/50 flex flex-col md:flex-row will-change-transform"
        >
          {/* Left Side: Illustration */}
          <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-brand-accent/20 to-brand-accent/5 p-12 flex-col justify-between items-center text-center">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold font-itim text-brand-text">Chào mừng bạn đến với Flazi</h3>
              <p className="text-brand-text/60 text-sm leading-relaxed">
                Hành trình chinh phục Hán ngữ của bạn bắt đầu tại đây. Hãy đăng nhập để lưu trữ kết quả học tập nhé!
              </p>
            </div>

            <motion.img
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              src={loginIllustration}
              alt="Login Illustration"
              className="w-full max-w-[280px] object-contain drop-shadow-2xl"
            />

            <div className="flex items-center gap-2 text-xs font-bold text-brand-accent/60 uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              Bảo mật & Miễn phí
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="flex-1 p-8 sm:p-12 relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-brand-text/30 hover:text-brand-accent hover:bg-brand-accent/10 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="max-w-sm mx-auto h-full flex flex-col justify-center">
              <div className="mb-8 space-y-2">
                <h2 className="text-3xl font-bold text-brand-text">
                  {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
                </h2>
                <p className="text-brand-text/50 text-sm">
                  {isLogin ? 'Chào mừng bạn quay trở lại!' : 'Bắt đầu hành trình học tập hôm nay.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-500/10 text-red-600 p-4 rounded-2xl text-sm font-medium flex items-center gap-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    {error}
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/30" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-brand-secondary/10 border border-brand-secondary/20 rounded-2xl px-12 py-4 focus:ring-2 focus:ring-brand-accent/50 focus:bg-white focus:outline-none transition-all placeholder:text-brand-text/20"
                      placeholder="Tên đăng nhập"
                    />
                  </div>

                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="relative"
                    >
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/30" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-brand-secondary/10 border border-brand-secondary/20 rounded-2xl px-12 py-4 focus:ring-2 focus:ring-brand-accent/50 focus:bg-white focus:outline-none transition-all placeholder:text-brand-text/20"
                        placeholder="Địa chỉ Email"
                      />
                    </motion.div>
                  )}

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/30" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-brand-secondary/10 border border-brand-secondary/20 rounded-2xl px-12 py-4 focus:ring-2 focus:ring-brand-accent/50 focus:bg-white focus:outline-none transition-all placeholder:text-brand-text/20"
                      placeholder="Mật khẩu"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs px-2">
                  <label className="flex items-center gap-2 text-brand-text/40 cursor-pointer">
                    <input type="checkbox" className="rounded-md border-brand-secondary/50 text-brand-accent focus:ring-brand-accent" />
                    Ghi nhớ đăng nhập
                  </label>
                  {isLogin && <button type="button" className="text-brand-accent font-bold hover:underline">Quên mật khẩu?</button>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
                  {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>

                <p className="text-center text-sm text-brand-text/40 mt-6">
                  {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                    }}
                    className="cursor-pointer text-brand-accent hover:underline font-bold"
                  >
                    {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
                  </button>
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
