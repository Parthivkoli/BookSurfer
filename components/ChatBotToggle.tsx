"use client"; // Mark this as a Client Component

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Minus } from "lucide-react"; // Added Minus for minimize
import ChatBot from "@/components/ChatBot";

export default function ChatBotToggle() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Function to open the chatbot
  const handleOpen = () => {
    setIsChatOpen(true);
  };

  // Function to minimize the chatbot
  const handleMinimize = () => {
    setIsChatOpen(false);
  };

  // Function to close the chatbot (optional, could be same as minimize)
  const handleClose = () => {
    setIsChatOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Circular Chatbot Icon - Only shows when chatbot is closed */}
      {!isChatOpen && (
        <Button
          variant="default"
          size="icon"
          className="rounded-full w-12 h-12 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          onClick={handleOpen}
          aria-label="Open chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* ChatBot UI - Shows when toggled */}
      {isChatOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-background border rounded-lg shadow-lg p-4">
          <ChatBot />
          {/* Minimize and Close Buttons */}
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              aria-label="Minimize chatbot"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              aria-label="Close chatbot"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}