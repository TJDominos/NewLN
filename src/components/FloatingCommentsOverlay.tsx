import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const mockComments = [
  {
    id: 1,
    user: 'Randseed',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Randseed',
    content: 'Chat about anything and everything...',
  },
  {
    id: 2,
    user: 'Dcandra989',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dcandra989',
    content: 'P',
  },
  {
    id: 3,
    user: 'Pragya',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pragya',
    content: 'Y',
  },
  {
    id: 4,
    user: 'John',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    content: 'To the management of Randseed, please add to the daily bonus,is too small 🙏',
  },
  {
    id: 5,
    user: 'Alice',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    content: 'Just hit a massive win!',
  },
  {
    id: 6,
    user: 'Bob',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    content: 'Good luck everyone 🍀',
  }
];

export const FloatingCommentsOverlay = ({ show, onClick }: { show: boolean, onClick?: () => void }) => {
  const [activeComments, setActiveComments] = useState<any[]>([]);

  useEffect(() => {
    if (!show) {
      setActiveComments([]);
      return;
    }

    const interval = setInterval(() => {
      if (Math.random() > 0.4) { // 60% chance to spawn a comment every 2.5s
        const randomComment = mockComments[Math.floor(Math.random() * mockComments.length)];
        const newComment = {
          ...randomComment,
          uniqueId: Date.now() + Math.random(),
        };
        
        setActiveComments(prev => {
          const next = [newComment, ...prev];
          if (next.length > 4) return next.slice(0, 4); // Keep max 4 comments on screen
          return next;
        });
        
        // Remove after 5 seconds
        setTimeout(() => {
          setActiveComments(prev => prev.filter(c => c.uniqueId !== newComment.uniqueId));
        }, 5000);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div className="absolute top-14 left-2 right-2 pointer-events-none z-30 flex flex-col gap-2 justify-start items-start overflow-hidden h-1/2">
      <AnimatePresence mode="popLayout">
        {activeComments.map(comment => (
          <motion.div
            key={comment.uniqueId}
            layout
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={onClick}
            className="bg-black/60 backdrop-blur-md rounded-full pr-4 pl-1 py-1 flex items-center gap-2 border border-white/10 shadow-lg max-w-[95%] pointer-events-auto cursor-pointer hover:bg-black/80 transition-colors"
          >
            <img src={comment.avatar} className="w-6 h-6 rounded-full shrink-0 bg-zinc-800" alt={comment.user} />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[9px] font-bold text-yellow-400 leading-none">{comment.user}</span>
              <span className="text-xs text-white truncate leading-tight">{comment.content}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
