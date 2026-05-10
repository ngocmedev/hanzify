import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-12 py-8 border-t border-brand-secondary/20 text-center space-y-4">
      <div className="flex items-center justify-center gap-2 text-brand-text/60 font-medium">
        <span>Made with</span>
        <Heart className="w-4 h-4 text-red-400 fill-current" />
        <span>by Hanzify Team</span>
      </div>
      <div className="flex justify-center gap-6 text-sm text-brand-text/40">
        <a href="#" className="hover:text-brand-accent transition-colors">Điều khoản</a>
        <a href="#" className="hover:text-brand-accent transition-colors">Bảo mật</a>
        <a href="#" className="hover:text-brand-accent transition-colors">Liên hệ</a>
      </div>
      <p className="text-xs text-brand-text/30">© 2026 Hanzify - Học tiếng Trung vui vẻ</p>
    </footer>
  );
}
