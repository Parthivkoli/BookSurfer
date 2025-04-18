"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface Book {
  id: string;
  title: string;
  authors: string[];
  coverImage?: string;
}

interface ChatMessage {
  sender: string;
  content: string | JSX.Element;
}

interface ChatRule {
  pattern: RegExp;
  response: string | ((match: RegExpMatchArray) => Promise<string | JSX.Element>);
}

const BookList = ({ books }: { books: Book[] }) => (
  <div className="space-y-2">
    {books.map((book) => (
      <div key={book.id} className="flex items-start gap-2">
        {book.coverImage && (
          <img src={book.coverImage} alt={book.title} className="w-12 h-16 object-cover rounded" />
        )}
        <div>
          <a href={`/reader/${book.id}`} className="text-blue-500 underline">{book.title}</a>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {book.authors.length > 0 ? book.authors.join(", ") : "Unknown Author"}
          </p>
        </div>
      </div>
    ))}
  </div>
);

const ChatBot = () => {
  const chatLogRef = useRef<HTMLDivElement>(null);
  const userInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  async function searchBooks(query: string): Promise<Book[]> {
    try {
      const [openLibraryBooks, gutenbergBooks] = await Promise.all([
        fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`)
          .then(res => res.json())
          .then(data => data.docs.map((doc: any) => ({
            id: doc.key,
            title: doc.title,
            authors: doc.author_name || [],
            coverImage: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
          }))),
        fetch(`https://gutendex.com/books?search=${encodeURIComponent(query)}&limit=5`)
          .then(res => res.json())
          .then(data => data.results.map((book: any) => ({
            id: book.id.toString(),
            title: book.title,
            authors: book.authors.map((a: any) => a.name),
            coverImage: book.formats["image/jpeg"] || undefined,
          }))),
      ]);
      return [...openLibraryBooks, ...gutenbergBooks].slice(0, 5); // Limit to 5 results
    } catch (error) {
      console.error("Error fetching books:", error);
      return [];
    }
  }

  async function getWebInfo(query: string): Promise<string> {
    try {
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
      const data = await response.json();
      return data.Abstract || data.RelatedTopics?.[0]?.Text || "I couldn't find specific information about that.";
    } catch (error) {
      console.error("Error fetching web info:", error);
      return "Sorry, I couldn't fetch that information right now.";
    }
  }

  const rules: ChatRule[] = [
    { 
      pattern: /^hello|hi|hey$/i, 
      response: "Hello there! I'm BookBot, your smart assistant. How can I assist you today?" 
    },
    {
      pattern: /^(?:find|search|look for) (?:a |some )?books? (?:about|on) (.+)$/i,
      response: async (match: RegExpMatchArray) => {
        const query = match[1];
        const books = await searchBooks(query);
        return books.length > 0 ? (
          <BookList books={books} />
        ) : (
          `Sorry, I couldn't find any books about "${query}". Want me to search the web for more info instead?`
        );
      },
    },
    {
      pattern: /^what (?:is|are) (.+)\??$/i,
      response: async (match: RegExpMatchArray) => {
        const query = match[1];
        const info = await getWebInfo(query);
        return info;
      },
    },
    { 
      pattern: /^who (?:is|was) (.+)\??$/i,
      response: async (match: RegExpMatchArray) => {
        const query = match[1];
        const info = await getWebInfo(query);
        return info;
      },
    },
    { 
      pattern: /^tell me about (.+)$/i,
      response: async (match: RegExpMatchArray) => {
        const query = match[1];
        const info = await getWebInfo(query);
        return info;
      },
    },
    { 
      pattern: /^what is your name|who are you$/i, 
      response: "I'm BookBot, your friendly assistant! I can help you find books or answer general questions." 
    },
    { 
      pattern: /^thanks|thank you$/i,
      response: "You're welcome! Anything else I can help with?" 
    },
    { 
      pattern: /^how are you$/i,
      response: "I'm doing great, thanks for asking! How about you?" 
    },
    { 
      pattern: /.*/i, 
      response: "I'm not sure how to respond to that. Try asking about books (e.g., 'find books about space') or general questions (e.g., 'what is quantum physics?')!" 
    },
  ];

  useEffect(() => {
    setMessages([{ 
      sender: "BookBot", 
      content: "Hello! I'm BookBot. I can help you find books or answer questions. What’s on your mind?" 
    }]);
  }, []);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const message = userInputRef.current?.value.trim();
      if (message && userInputRef.current) {
        setMessages((prev) => [...prev, { sender: "You", content: message }]);
        userInputRef.current.value = "";

        let response: string | JSX.Element = "";
        for (const rule of rules) {
          const match = message.match(rule.pattern);
          if (match) {
            if (typeof rule.response === "string") {
              response = rule.response;
            } else {
              setMessages((prev) => [...prev, { sender: "BookBot", content: "Let me look that up..." }]);
              response = await rule.response(match);
              setMessages((prev) => prev.slice(0, -1).concat({ sender: "BookBot", content: response }));
            }
            break;
          }
        }
        if (response) {
          setMessages((prev) => [...prev, { sender: "BookBot", content: response }]);
        }
      }
    }
  };

  const clearChat = () => {
    setMessages([{ sender: "BookBot", content: "Chat cleared! How can I assist you now?" }]);
  };

  return (
    <div className="w-full h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 flex flex-col">
      <div
        ref={chatLogRef}
        className="flex-1 overflow-y-auto mb-2 border-b border-gray-200 dark:border-gray-600 text-sm"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 ${
              msg.sender === "You"
                ? "text-right text-blue-600 dark:text-blue-400"
                : "text-left text-gray-800 dark:text-gray-200"
            }`}
          >
            <strong>{msg.sender}:</strong>{" "}
            {typeof msg.content === "string" ? (
              <span dangerouslySetInnerHTML={{ __html: msg.content }} />
            ) : (
              msg.content
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          ref={userInputRef}
          type="text"
          placeholder="Ask me anything! (e.g., 'find books about space' or 'what is gravity?')"
          onKeyPress={handleInput}
          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 text-sm"
        />
        <Button variant="outline" size="sm" onClick={clearChat}>
          Clear
        </Button>
      </div>
    </div>
  );
};

export default ChatBot;