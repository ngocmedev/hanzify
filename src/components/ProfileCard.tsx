import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Link as LinkIcon, Calendar, Share2, MoreHorizontal } from 'lucide-react';

interface ProfileCardProps {
  user: {
    name: string;
    username: string;
    bio: string;
    avatar: string;
    coverImage: string;
    stats: {
      followers: string;
      following: string;
      likes: string;
    };
  };
}

export default function ProfileCard({ user }: ProfileCardProps) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-brand-secondary/20">
      <div className="relative h-40 sm:h-56">
        <img
          src={user.coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="relative flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white overflow-hidden shadow-lg bg-white"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-brand-accent text-white rounded-full font-semibold shadow-md shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all"
            >
              Theo dõi
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 border border-brand-secondary rounded-full text-brand-text hover:bg-brand-secondary/10 transition-all"
            >
              Nhắn tin
            </motion.button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {user.name}
              <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
              </span>
            </h1>
            <p className="text-brand-text/60 font-medium">@{user.username}</p>
          </div>

          <p className="text-brand-text/80 leading-relaxed max-w-xl">
            {user.bio}
          </p>

          <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-brand-text/60">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>Hà Nội, Việt Nam</span>
            </div>
            <div className="flex items-center gap-1">
              <LinkIcon className="w-4 h-4" />
              <a href="#" className="text-brand-accent hover:underline">Hanzify.net</a>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Tham gia tháng 10, 2023</span>
            </div>
          </div>

          <div className="flex gap-6 pt-2">
            <div className="flex items-center gap-1">
              <span className="font-bold text-brand-text">{user.stats.following}</span>
              <span className="text-brand-text/60 text-sm">Đang theo dõi</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-brand-text">{user.stats.followers}</span>
              <span className="text-brand-text/60 text-sm">Người theo dõi</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-brand-text">{user.stats.likes}</span>
              <span className="text-brand-text/60 text-sm">Lượt thích</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
