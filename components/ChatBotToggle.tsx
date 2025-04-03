"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Minus } from "lucide-react";
import ChatBot from "@/components/ChatBot";
import { motion, AnimatePresence } from "framer-motion"; // For animations

export default function ChatBotToggle() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // For dragging
  const chatRef = useRef<HTMLDivElement>(null);
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  // Open the chatbot
  const handleOpen = () => {
    setIsChatOpen(true);
  };

  // Minimize the chatbot
  const handleMinimize = () => {
    setIsChatOpen(false);
  };

  // Close the chatbot
  const handleClose = () => {
    setIsChatOpen(false);
    setPosition({ x: 0, y: 0 }); // Reset position on close
  };

  // Handle window resize to keep chatbot within bounds
  useEffect(() => {
    const handleResize = () => {
      if (chatRef.current && dragConstraintsRef.current) {
        const bounds = dragConstraintsRef.current.getBoundingClientRect();
        const chatBounds = chatRef.current.getBoundingClientRect();
        setPosition((prev) => ({
          x: Math.min(prev.x, bounds.width - chatBounds.width),
          y: Math.min(prev.y, bounds.height - chatBounds.height),
        }));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div ref={dragConstraintsRef} className="fixed inset-0 pointer-events-none z-50">
      {/* Chatbot Icon */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-6 right-6 pointer-events-auto"
          >
            <Button
              variant="default"
              size="icon"
              className="rounded-full w-14 h-14 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg hover:scale-105 transition-transform"
              onClick={handleOpen}
              aria-label="Open chatbot"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ChatBot UI */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            ref={chatRef}
            drag
            dragConstraints={dragConstraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ x: position.x, y: position.y }}
            onDragEnd={(_, info) => setPosition({ x: info.offset.x, y: info.offset.y })}
            className="absolute bottom-20 right-6 w-full max-w-[22rem] sm:max-w-[24rem] bg-background border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl pointer-events-auto overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-transparent border-b border-gray-200 dark:border-gray-700 cursor-move">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                BookBot
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  aria-label="Minimize chatbot"
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  aria-label="Close chatbot"
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* ChatBot Content */}
            <div className="p-4 h-[28rem] sm:h-[32rem] flex flex-col">
              <ChatBot />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}