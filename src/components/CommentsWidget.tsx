import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, MoreHorizontal } from 'lucide-react';
import { FloatingCommentsOverlay } from './FloatingCommentsOverlay';

interface CommentsWidgetProps {
  unreadCount?: number;
  h5Url?: string; // Optional URL for the existing H5 comments page
  showFloatingComments?: boolean;
  setShowFloatingComments?: (show: boolean) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const CommentsWidget: React.FC<CommentsWidgetProps> = ({ 
  unreadCount = 15, 
  h5Url,
  showFloatingComments = true,
  setShowFloatingComments,
  isOpen,
  setIsOpen
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mock data for the comments
  const mockComments = [
    {
      id: 1,
      user: 'Randseed',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Randseed',
      date: '2025/07/19',
      content: 'Chat about anything and everything, but... Do not impersonate others in a deceptive or misleading manner. Do not intentionally share false or misleading information.',
      replies: 1,
      verified: false
    },
    {
      id: 2,
      user: 'Dcandra989',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dcandra989',
      date: '2025/12/01',
      content: 'P',
      replies: 1,
      verified: true
    },
    {
      id: 3,
      user: 'Dcandra989',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dcandra9892',
      date: '2025/12/01',
      content: 'P',
      replies: 0,
      verified: true
    },
    {
      id: 4,
      user: 'Pragya',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pragya',
      date: '2025/11/12',
      content: 'Y',
      replies: 1,
      verified: true
    },
    {
      id: 5,
      user: 'John',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      date: '2025/10/29',
      content: 'To the management of Randseed, please add to the daily bonus,is too small 🙏',
      replies: 1,
      verified: true
    }
  ];

  return (
    <>
      <FloatingCommentsOverlay show={!!showFloatingComments} onClick={() => setIsOpen(true)} />
      {/* Floating Buttons Container */}
      <div className="fixed right-0 top-[calc(50%+0.5rem)] -translate-y-1/2 z-40 flex flex-col gap-2">
        {/* Comments Button */}
        <div 
          className="bg-zinc-950 border-y-2 border-l-2 border-fuchsia-500 rounded-l-2xl p-2 md:p-3 pr-2.5 md:pr-4 shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-transform hover:-translate-x-1 cursor-pointer flex flex-col items-center relative group"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-zinc-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1 md:static md:mt-0 bg-red-500 md:bg-transparent text-white md:text-orange-400 font-mono font-bold text-[10px] md:text-sm px-1.5 md:px-0 rounded-full md:rounded-none min-w-[18px] text-center border-2 border-zinc-950 md:border-none leading-tight md:leading-normal">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Comments Panel / Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - Only on mobile */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              />
            )}

            {/* Panel */}
            <motion.div
              initial={isMobile ? { y: '100%' } : { x: '100%' }}
              animate={isMobile ? { y: 0 } : { x: 0 }}
              exit={isMobile ? { y: '100%' } : { x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed z-50 bg-[#eaeaef] flex flex-col overflow-hidden shadow-2xl
                ${isMobile 
                  ? 'bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl' 
                  : 'top-0 right-0 bottom-0 w-[400px]'
                }`}
            >
                  {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-300/50 bg-[#eaeaef] shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-zinc-200 rounded-full transition-colors">
                    <X className="w-6 h-6 text-zinc-800" />
                  </button>
                  <h2 className="text-lg font-semibold text-zinc-900">Comments</h2>
                </div>
                <div className="flex items-center gap-4">
                  {setShowFloatingComments && (
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-700 transition-colors">Float</span>
                      <div className={`w-8 h-4 rounded-full transition-colors relative ${showFloatingComments ? 'bg-fuchsia-500' : 'bg-zinc-300'}`}>
                        <div className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-transform ${showFloatingComments ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={showFloatingComments}
                        onChange={(e) => setShowFloatingComments(e.target.checked)}
                      />
                    </label>
                  )}
                  <div className="relative">
                    <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-yellow-400">
                      <span className="text-[10px] font-bold text-yellow-400">Quick</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-zinc-200 rounded-full p-0.5 border border-zinc-400">
                      <MessageCircle className="w-3 h-3 text-zinc-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              {h5Url ? (
                <iframe 
                  src={h5Url} 
                  className="w-full h-full border-none flex-1"
                  title="Comments"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              ) : (
                <>
                  {/* Comments List (Mocking the H5 Page) */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {mockComments.map((comment) => (
                  <div key={comment.id} className="flex flex-col gap-2 border-b border-zinc-300/50 pb-4 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={comment.avatar} alt={comment.user} className="w-10 h-10 rounded-full bg-zinc-200" />
                          {comment.verified && (
                            <div className="absolute bottom-0 right-0 bg-yellow-400 rounded-full p-0.5 border-2 border-[#eaeaef]">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-zinc-900">{comment.user}</span>
                          <span className="text-xs text-zinc-500">{comment.date}</span>
                        </div>
                      </div>
                      <button className="text-zinc-400 hover:text-zinc-600">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm text-zinc-800 leading-relaxed pl-13">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-4 pl-13 mt-1">
                      {comment.replies > 0 && (
                        <button className="text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
                          {comment.replies} Reply <span className="text-[10px]">›</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-[#eaeaef] border-t border-zinc-300/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser" alt="You" className="w-10 h-10 rounded-full bg-zinc-200 border-2 border-red-500" />
                    <div className="absolute bottom-0 right-0 bg-yellow-400 rounded-full p-0.5 border-2 border-[#eaeaef]">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 bg-zinc-200/80 rounded-full px-4 py-2.5">
                    <input 
                      type="text" 
                      placeholder="Add a comment for Quick Quid" 
                      className="w-full bg-transparent border-none outline-none text-sm text-zinc-800 placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </>
    )}
  </AnimatePresence>
    </>
  );
};
