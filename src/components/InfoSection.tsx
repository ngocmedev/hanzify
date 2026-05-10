import React from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface InfoItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
}

interface InfoSectionProps {
  title: string;
  type: 'grid' | 'list';
  items: InfoItem[];
}

const InfoSection: React.FC<InfoSectionProps> = ({ title, type, items }) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold px-2">{title}</h2>
      
      <div className={type === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
        {items.map((item, index) => {
          const IconComponent = (Icons as any)[item.icon] || Icons.HelpCircle;
          const isInternal = item.link.startsWith('/');
          
          const content = (
            <>
              <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent shrink-0">
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-brand-text truncate">{item.title}</h3>
                <p className="text-sm text-brand-text/60 truncate">{item.description}</p>
              </div>
              <Icons.ChevronRight className="w-5 h-5 text-brand-text/30" />
            </>
          );

          const className = `
            flex items-center gap-4 bg-white p-4 rounded-2xl border border-brand-secondary/20 shadow-sm hover:shadow-md transition-all
            ${type === 'list' ? 'w-full' : ''}
          `;

          if (isInternal) {
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Link to={item.link} className={className}>
                  {content}
                </Link>
              </motion.div>
            );
          }
          
          return (
            <motion.a
              key={item.id}
              href={item.link}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={className}
            >
              {content}
            </motion.a>
          );
        })}
      </div>
    </section>
  );
};

export default InfoSection;
