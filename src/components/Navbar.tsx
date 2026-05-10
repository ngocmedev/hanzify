import React, { useState, useEffect } from 'react';
import { Bell, Menu, X, User, LogOut, LayoutDashboard, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import { api } from '../services/api';
import { getLoggedInUsername, logoutUser, getLoggedInUserRole } from '../services/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const user = getLoggedInUsername();
    setUsername(user);
    setRole(getLoggedInUserRole());

    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }

    const handleOpenAuth = () => setIsAuthModalOpen(true);
    window.addEventListener('open_auth_modal', handleOpenAuth);
    return () => window.removeEventListener('open_auth_modal', handleOpenAuth);
  }, [username]); // Re-run when username changes via handleLoginSuccess/handleLogout

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      const notifs = res.data || [];
      setNotifications(notifs);

      const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      const unread = notifs.filter((n: any) => !readIds.includes(n.id)).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReact = async (notificationId: string, reactionType: string) => {
    setNotifications(current => current.map(n => {
      if (n.id === notificationId) {
        const isRemoving = n.userReaction === reactionType;
        const newReaction = isRemoving ? null : reactionType;
        const counts = { ...(n.reactionCounts || {}) };

        if (n.userReaction && counts[n.userReaction]) {
          counts[n.userReaction]--;
        }
        if (!isRemoving) {
          counts[reactionType] = (counts[reactionType] || 0) + 1;
        }

        return {
          ...n,
          userReaction: newReaction,
          totalReactions: n.totalReactions + (isRemoving ? -1 : (n.userReaction ? 0 : 1)),
          reactionCounts: counts
        };
      }
      return n;
    }));

    try {
      const currentNotif = notifications.find(n => n.id === notificationId);
      const isRemoving = currentNotif?.userReaction === reactionType;
      await api.reactToNotification(notificationId, isRemoving ? null : reactionType);
    } catch (err) {
      console.error(err);
      loadNotifications();
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
    setUnreadCount(0);
  };

  const handleLoginSuccess = (loginUsername: string) => {
    setUsername(loginUsername);
    setRole(getLoggedInUserRole());
  };

  const handleLogout = () => {
    logoutUser();
    setUsername(null);
    setRole(null);
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-md border-b border-brand-secondary/30">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-accent rounded-lg flex items-center justify-center text-white font-itim text-lg font-bold">
              F
            </div>
            <span className="font-itim text-lg font-bold tracking-tight hidden sm:block">Hanzify</span>
          </Link>

          <div className="flex-1 mx-4 hidden md:flex items-center justify-end">
            <Link
              to="/guide"
              className="flex items-center gap-2 text-xs font-medium text-brand-text/70 hover:text-brand-accent transition-colors bg-brand-secondary/10 hover:bg-brand-secondary/20 px-3 py-1.5 rounded-full"
            >
              <BookOpen className="w-4 h-4" />
              Hướng dẫn học
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {username && (
              <div className="relative">
                <motion.button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowDropdown(false);
                    if (!showNotifications && unreadCount > 0) {
                      markAllAsRead();
                    }
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-brand-text/70 hover:text-brand-accent transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brand-bg"></span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="fixed sm:absolute top-[60px] right-4 sm:top-auto sm:right-0 mt-0 sm:mt-2 w-[calc(100vw-32px)] sm:w-80 max-h-[80vh] sm:max-h-96 overflow-y-auto bg-brand-bg border border-brand-secondary/30 rounded-xl shadow-lg flex flex-col z-50"
                    >
                      <div className="p-4 border-b border-brand-secondary/20 font-bold text-brand-text">Thông báo mới</div>
                      <div className="divide-y divide-brand-secondary/10">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-brand-text/50">Không có thông báo nào</div>
                        ) : (
                          notifications.map((n: any) => (
                            <div key={n.id} className="p-4 hover:bg-brand-secondary/5 transition-colors">
                              <p className="text-sm text-brand-text mb-2">{n.message}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-brand-text/40">{new Date(n.createdAt).toLocaleString()}</span>
                                <div className="flex items-center gap-1.5">
                                  {[
                                    { type: 'like', icon: '👍' },
                                    { type: 'heart', icon: '❤️' },
                                    { type: 'haha', icon: '😆' },
                                    { type: 'sad', icon: '😢' },
                                  ].map(r => (
                                    <button
                                      key={r.type}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReact(n.id, r.type);
                                      }}
                                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${n.userReaction === r.type
                                        ? 'bg-brand-accent/20 text-brand-accent scale-105'
                                        : 'text-brand-text/50 bg-brand-secondary/5 hover:bg-brand-secondary/20 hover:scale-105'
                                        }`}
                                    >
                                      <span className="text-sm">{r.icon}</span>
                                      {((n.reactionCounts && n.reactionCounts[r.type]) > 0) && (
                                        <span className="font-bold">{n.reactionCounts[r.type]}</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {username ? (
              <>
                <div className="relative hidden md:block">
                  <button
                    onClick={() => {
                      setShowDropdown(!showDropdown);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 bg-brand-secondary/20 hover:bg-brand-secondary/40 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-brand-accent flex items-center justify-center text-white text-xs font-bold">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium hidden sm:block">Xin chào, {username}</span>
                  </button>

                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div
                        key="dropdown"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-brand-bg border border-brand-secondary/30 rounded-xl shadow-lg overflow-hidden flex flex-col z-50"
                      >
                        {role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setShowDropdown(false)}
                            className="w-full flex items-center gap-2 px-4 py-3 text-brand-text hover:bg-brand-secondary/10 transition-colors text-sm font-medium border-b border-brand-secondary/30"
                          >
                            <LayoutDashboard className="w-4 h-4 text-brand-accent" />
                            Quản lý (Admin)
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  className="p-2 md:hidden text-brand-text/80 hover:text-brand-accent transition-colors"
                  onClick={() => {
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                    setShowNotifications(false);
                    setShowDropdown(false);
                  }}
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-brand-accent hover:bg-brand-accent/90 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Overlay for click-away */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-40 bg-black/5 md:hidden"
              />
              
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed md:hidden top-[60px] right-4 w-[calc(100vw-32px)] max-h-[80vh] overflow-y-auto bg-brand-bg border border-brand-secondary/30 rounded-xl shadow-2xl flex flex-col z-50"
              >
              <div className="flex flex-col gap-2 p-4">
                <Link
                  to="/guide"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-brand-text/80 hover:text-brand-accent hover:bg-brand-secondary/10 p-3 rounded-xl transition-colors font-medium"
                >
                  <BookOpen className="w-5 h-5" />
                  Hướng dẫn học
                </Link>

                {username ? (
                  <>
                    <div className="flex items-center gap-3 text-brand-text p-3 border-t border-brand-secondary/10 mt-2">
                      <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-white text-sm font-bold">
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold">{username}</span>
                    </div>

                    {role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 text-brand-text/80 hover:text-brand-accent hover:bg-brand-secondary/10 p-3 rounded-xl transition-colors font-medium"
                      >
                        <LayoutDashboard className="w-5 h-5 text-brand-accent" />
                        Quản lý (Admin)
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 text-red-500 hover:text-red-600 hover:bg-red-500/10 p-3 rounded-xl transition-colors font-medium text-left w-full mt-2"
                    >
                      <LogOut className="w-5 h-5" />
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="mt-2 w-full flex items-center justify-center bg-brand-accent hover:bg-brand-accent/90 text-white p-3 rounded-xl font-medium transition-colors"
                  >
                    Đăng nhập
                  </button>
                )}
              </div>
            </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
