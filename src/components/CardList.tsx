import React from 'react';
import { motion } from 'motion/react';

interface Post {
  id: string;
  title: string;
  date: string;
  image: string;
}

interface CardListProps {
  posts: Post[];
}

export default function CardList({ posts }: CardListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold px-2">Bài viết mới nhất</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white rounded-2xl overflow-hidden border border-brand-secondary/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <div className="aspect-video overflow-hidden">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-brand-text line-clamp-2 group-hover:text-brand-accent transition-colors">
                {post.title}
              </h3>
              <p className="text-xs text-brand-text/50 mt-2">{post.date}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
