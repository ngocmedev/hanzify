import React from 'react';
import { motion } from 'motion/react';
import owlMascot from '../assets/owl_mascot.png';

interface GreetingCardProps {
  username: string;
}

export default function GreetingCard({ username }: GreetingCardProps) {
  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        title: `Chào buổi sáng, ${username}! ☀️`,
        message: "Hôm nay là một ngày tuyệt vời để học từ mới nhó! Cố gắng hoàn thành mục tiêu hôm nay nhé. 💪"
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        title: `Chào ${username} nhó! 👋`,
        message: "Chúc bạn một buổi chiều học tập hiệu quả. Nghỉ ngơi một chút rồi lại tiếp tục nhé! ☕"
      };
    } else if (hour >= 18 && hour < 22) {
      return {
        title: `Chào buổi tối, ${username}! 🌙`,
        message: "Vẫn đang nỗ lực học tập sao? Tuyệt vời quá! Cố gắng học nốt vài từ rồi đi nghỉ nhé. 🌟"
      };
    } else {
      return {
        title: `Chào ${username} nhó! 👋`,
        message: "Cú đêm ơi, muộn rồi đó! Học nốt vài từ rồi đi ngủ sớm cho xinh đẹp nhó. Sức khỏe là vàng mà. 🦉"
      };
    }
  };

  const { title, message } = getGreetingData();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-brand-bg rounded-[2.5rem] p-6 sm:p-8 flex items-center gap-6 border-2 border-[#FEF9E7] shadow-sm relative overflow-hidden"
    >
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full -mr-16 -mt-16 blur-3xl" />
      
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#FFF9E5] rounded-3xl flex items-center justify-center flex-shrink-0 shadow-inner">
        <motion.img 
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          src={owlMascot} 
          alt="Owl Mascot" 
          className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
        />
      </div>

      <div className="space-y-1 relative z-10">
        <h3 className="text-xl sm:text-2xl font-bold text-brand-text font-itim flex items-center gap-2">
          {title}
        </h3>
        <p className="text-brand-text/50 text-sm sm:text-base italic leading-relaxed">
          {message}
        </p>
      </div>
    </motion.div>
  );
}
