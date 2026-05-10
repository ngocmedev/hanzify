import React from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';

interface Social {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

interface ButtonGroupProps {
  socials: Social[];
}

export default function ButtonGroup({ socials }: ButtonGroupProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {socials.map((social) => {
        const IconComponent = (Icons as any)[social.icon] || Icons.Share2;
        
        return (
          <motion.a
            key={social.id}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-brand-secondary/30 shadow-sm hover:border-brand-accent/50 hover:text-brand-accent transition-all font-medium text-sm"
          >
            <IconComponent className="w-4 h-4" />
            <span>{social.platform}</span>
          </motion.a>
        );
      })}
    </div>
  );
}
