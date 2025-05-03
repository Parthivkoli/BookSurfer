"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Bookmark,
  Settings,
  Sun,
  Moon,
  Laptop,
  Maximize,
  Minimize,
  Copy,
  BookText,
  MessageSquare,
  Play,
  Pause,
  Square,
  ChevronUp,
  ChevronDown,
  Share,
  ArrowLeft,
  Menu,
  X,
  MoreVertical,
} from "lucide-react";
import { Book } from "@/types/book";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { summarizeContent } from "@/lib/utils";
import { generateAIResponse } from "@/lib/api/ai";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ReaderClientProps {
  initialBook: Book | null;
  initialContent: string;
  bookId: string;
}

interface BookWithThemes extends Book {
  themes?: string[];
}

export default function ReaderClient({
  initialBook,
  initialContent,
  bookId,
}: ReaderClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const [book, setBook] = useState<BookWithThemes | null>(initialBook);
  const [contentPages, setContentPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [fontFamily, setFontFamily] = useState("serif");
  const [readingMode, setReadingMode] = useState("dark");
  const [isPlaying, setIsPlaying] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [pageTransition, setPageTransition] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [pageInput, setPageInput] = useState("");
  const [speechRate, setSpeechRate] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [utteranceRef, setUtteranceRef] = useState<SpeechSynthesisUtterance | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [bookProgress, setBookProgress] = useState(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState("");
  const [marginSize, setMarginSize] = useState("medium");
  const [showDefinitionPanel, setShowDefinitionPanel] = useState(false);
  const [selectedWord, setSelectedWord] = useState("");
  const [wordDefinition, setWordDefinition] = useState("");
  const [highContrast, setHighContrast] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aiHistory, setAiHistory] = useState<{ question: string; answer: string }[]>([]);
  const [definitionPosition, setDefinitionPosition] = useState<{ left: number; top: number } | null>(null);
  const [readingDirection, setReadingDirection] = useState<"vertical" | "horizontal">(
    () => (localStorage.getItem("reader-direction") as "vertical" | "horizontal") || "vertical"
  );
  const [showDirectionModal, setShowDirectionModal] = useState(!localStorage.getItem("reader-direction"));
  const [verticalPage, setVerticalPage] = useState(1);
  const [showPageJump, setShowPageJump] = useState(false);
  const [jumpPageValue, setJumpPageValue] = useState(1);
  const [loadedPageCount, setLoadedPageCount] = useState(3);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFloatingButtons, setShowFloatingButtons] = useState(false);
  const floatingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Pagination
  useEffect(() => {
    if (!initialContent) {
      setContentPages(["No content available."]);
      return;
    }
    const pages = paginateByWords(initialContent, 400);
    setContentPages(pages);
    setBookProgress(Math.round(((currentPage + 1) / pages.length) * 100));
    const avgReadingSpeed = 250;
    const wordsLeft = (pages.length - currentPage - 1) * 400;
    const minutesLeft = Math.ceil(wordsLeft / avgReadingSpeed);
    setEstimatedTimeLeft(
      minutesLeft < 60
        ? `~${minutesLeft} min left`
        : `~${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left`
    );
  }, [initialContent, fontSize, lineHeight, fontFamily, isFullScreen, currentPage, marginSize]);

  // Load Saved State
  useEffect(() => {
    const loadSavedState = () => {
      try {
        const savedBookmarks = localStorage.getItem(`bookmarks-${bookId}`);
        if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

        const savedProgress = localStorage.getItem(`progress-${bookId}`);
        if (savedProgress)
          setCurrentPage(Math.min(parseInt(savedProgress, 10), contentPages.length - 1) || 0);

        const savedFontSize = localStorage.getItem("reader-font-size");
        if (savedFontSize) setFontSize(parseInt(savedFontSize, 10));

        const savedLineHeight = localStorage.getItem("reader-line-height");
        if (savedLineHeight) setLineHeight(parseFloat(savedLineHeight));

        const savedFontFamily = localStorage.getItem("reader-font-family");
        if (savedFontFamily) setFontFamily(savedFontFamily);

        const savedMargin = localStorage.getItem("reader-margin");
        if (savedMargin) setMarginSize(savedMargin);

        const savedReadingMode = localStorage.getItem("reader-theme");
        if (savedReadingMode) setReadingMode(savedReadingMode);

        const savedHighContrast = localStorage.getItem("reader-high-contrast");
        if (savedHighContrast) setHighContrast(savedHighContrast === "true");
      } catch (error) {
        console.error("Error loading saved state:", error);
      }
    };

    if (contentPages.length > 0) loadSavedState();
  }, [bookId, contentPages.length]);

  // Save Preferences
  useEffect(() => {
    if (book && currentPage >= 0) {
      localStorage.setItem(`progress-${bookId}`, currentPage.toString());
      localStorage.setItem("reader-font-size", fontSize.toString());
      localStorage.setItem("reader-line-height", lineHeight.toString());
      localStorage.setItem("reader-font-family", fontFamily);
      localStorage.setItem("reader-margin", marginSize);
      localStorage.setItem("reader-theme", readingMode);
      localStorage.setItem("reader-high-contrast", highContrast.toString());
    }
  }, [book, bookId, currentPage, fontSize, lineHeight, fontFamily, marginSize, readingMode, highContrast]);

  // Theme and Contrast
  useEffect(() => {
    if (readingMode === "system") setTheme("system");
    else if (readingMode === "dark") setTheme("dark");
    else setTheme("light");

    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [readingMode, highContrast, setTheme]);

  // Fullscreen Handling
  const toggleFullScreen = () => {
    if (!isFullScreen)
      document.documentElement.requestFullscreen().catch(console.error);
    else document.exitFullscreen().catch(console.error);
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
      if (document.fullscreenElement) {
        setControlsVisible(false);
        setTimeout(() => setControlsVisible(true), 1000);
      }
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  // Auto-Hide Controls in Fullscreen
  useEffect(() => {
    const handleScroll = () => {
      if (!isFullScreen) return;
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY + 50) setControlsVisible(false);
      else if (currentScrollY < lastScrollY - 50) setControlsVisible(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFullScreen, lastScrollY]);

  // Text-to-Speech Voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        const preferredVoice =
          availableVoices.find(
            (v) =>
              (v.name.includes("Google") || v.name.includes("Premium")) &&
              v.lang.startsWith("en")
          ) || availableVoices[0];
        setSelectedVoice(preferredVoice);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // Page Navigation
  const goToNextPage = () => {
    if (currentPage < contentPages.length - 1) {
      setPageTransition(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setPageTransition(false);
        mainContentRef.current?.scrollTo(0, 0);
        if (isPlaying) stopTextToSpeech();
      }, 300);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setPageTransition(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1);
        setPageTransition(false);
        mainContentRef.current?.scrollTo(0, 0);
        if (isPlaying) stopTextToSpeech();
      }, 300);
    }
  };

  const handlePageJump = () => {
    const pageNum = parseInt(pageInput, 10) - 1;
    if (pageNum >= 0 && pageNum < contentPages.length) {
      setCurrentPage(pageNum);
      setPageInput("");
      if (isPlaying) stopTextToSpeech();
      toast({
        title: "Page Changed",
        description: `Moved to page ${pageNum + 1}`,
        duration: 1500,
      });
    } else {
      toast({
        title: "Invalid Page",
        description: `Enter a number between 1 and ${contentPages.length}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Bookmark Toggle
  const toggleBookmark = () => {
    const newBookmarks = [...bookmarks];
    const index = newBookmarks.indexOf(currentPage);
    if (index === -1) {
      newBookmarks.push(currentPage);
      newBookmarks.sort((a, b) => a - b);
      toast({
        title: "Bookmark Added",
        description: `Page ${currentPage + 1} bookmarked`,
        duration: 2000,
      });
    } else {
      newBookmarks.splice(index, 1);
      toast({
        title: "Bookmark Removed",
        description: `Bookmark for page ${currentPage + 1} removed`,
        duration: 2000,
      });
    }
    setBookmarks(newBookmarks);
    localStorage.setItem(`bookmarks-${bookId}`, JSON.stringify(newBookmarks));
  };

  // AI Summary
  const handleGenerateSummary = () => {
    if (!book) return;
    
    // Get the current page based on reading direction
    const pageIndex = readingDirection === "vertical" ? verticalPage - 1 : currentPage;
    if (!contentPages[pageIndex]) return;
    
    setSummaryLoading(true);
    
    // Get current chapter if available
    const currentChapter = book.chapters?.[pageIndex] || `Page ${pageIndex + 1}`;
    
    // Generate summary with context
    const result = summarizeContent(contentPages[pageIndex], 3, {
      context: `Chapter: ${currentChapter}, Book: ${book.title}`,
      preferLocation: 'start'
    });
    
    setSummary(result);
    setSummaryLoading(false);
  };

  // AI Question Answering
  const handleAskQuestion = () => {
    if (!question.trim() || !book) {
      toast({
        title: "Invalid Question",
        description: "Please enter a specific question about the current page.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // Get the current page based on reading direction
    const pageIndex = readingDirection === "vertical" ? verticalPage - 1 : currentPage;
    if (!contentPages[pageIndex]) return;
    
    setAnswerLoading(true);
    
    // Get current chapter if available
    const chapterInfo = book.chapters?.[pageIndex];
    const currentChapter = typeof chapterInfo === 'string' 
      ? chapterInfo 
      : chapterInfo?.title || `Page ${pageIndex + 1}`;
    
    // Generate answer with context
    generateAIResponse(
      book.title,
      contentPages[pageIndex],
      question,
      {
        currentChapter,
        previousContent: contentPages[pageIndex - 1] || '',
        bookMetadata: {
          author: book.authors?.[0],
          genre: book.categories,
          themes: book.themes || []
        }
      }
    ).then((result: string) => {
      setAnswer(result);
      setAiHistory((prev) => [...prev.slice(-4), { question, answer: result }]);
      setAnswerLoading(false);
    });
  };

  // Improved Text-to-Speech with Highlighting and Start Position
  const startTextToSpeech = (startIndex = 0) => {
    if (!contentPages[currentPage] || isPlaying) return;
    window.speechSynthesis.cancel();
    const text = contentPages[currentPage];
    const words = text.split(/\s+/);
    const utterance = new SpeechSynthesisUtterance(words.slice(startIndex).join(" "));
    utterance.rate = speechRate;
    if (selectedVoice) utterance.voice = selectedVoice;

    let wordIndex = startIndex;
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        setCurrentWordIndex(wordIndex);
        const wordElement = contentRef.current?.querySelectorAll(".word")[wordIndex];
        if (wordElement)
          wordElement.scrollIntoView({ behavior: "smooth", block: "center" });
        wordIndex++;
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      if (currentPage < contentPages.length - 1) {
        toast({
          title: "Reading Complete",
          description: "Moving to next page",
          duration: 2000,
        });
        setTimeout(goToNextPage, 1500);
      } else {
        toast({
          title: "Reading Complete",
          description: "End of content reached",
          duration: 2000,
        });
      }
    };

    window.speechSynthesis.speak(utterance);
    setUtteranceRef(utterance);
    setIsPlaying(true);
    toast({
      title: "Reading Started",
      description: selectedVoice?.name || "Text-to-speech started",
      duration: 1500,
    });
  };

  const pauseTextToSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      toast({
        title: "Reading Paused",
        description: "Text-to-speech paused",
        duration: 1500,
      });
    }
  };

  const resumeTextToSpeech = () => {
    if (!isPlaying && utteranceRef) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      toast({
        title: "Reading Resumed",
        description: "Text-to-speech resumed",
        duration: 1500,
      });
    }
  };

  const stopTextToSpeech = () => {
    if (isPlaying || utteranceRef) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      setUtteranceRef(null);
    }
  };

  // Click-to-Start TTS
  const handleWordClick = (index: number) => {
    stopTextToSpeech();
    startTextToSpeech(index);
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      if (e.key === "ArrowRight" || e.key === "j") goToNextPage();
      else if (e.key === "ArrowLeft" || e.key === "k") goToPrevPage();
      else if (e.key === "f") toggleFullScreen();
      else if (e.key === "b") toggleBookmark();
      else if (e.key === "Escape" && isFullScreen)
        document.exitFullscreen().catch(console.error);
      else if (e.key === "p" || e.key === " ") {
        e.preventDefault();
        isPlaying
          ? pauseTextToSpeech()
          : utteranceRef
          ? resumeTextToSpeech()
          : startTextToSpeech();
      } else if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        const textarea = document.querySelector("textarea");
        if (textarea) textarea.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, contentPages.length, isPlaying, isFullScreen]);

  // Dictionary Functionality
  const getWordDefinition = async (
    word: string,
    e: React.MouseEvent<HTMLSpanElement>
  ) => {
    const cleanWord = word.replace(/[.,;:!?()[\]{}""'']/g, "").toLowerCase().trim();
    if (!cleanWord) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = 20;
    const offsetY = -20;
    const panelWidth = 300;
    const left =
      e.clientX + offsetX < window.innerWidth - panelWidth
        ? e.clientX + offsetX
        : e.clientX - panelWidth - offsetX;
    const top = e.clientY + offsetY;

    setDefinitionPosition({ left, top });
    setSelectedWord(cleanWord);

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0) {
        const meaning = data[0].meanings[0];
        const definition =
          meaning.definitions[0].definition || "No definition available for this meaning.";
        const example = meaning.definitions[0].example
          ? `\nExample: ${meaning.definitions[0].example}`
          : "";
        setWordDefinition(`${definition}${example}`);
      } else {
        setWordDefinition(
          `No definition found for "${cleanWord}". It might be a proper noun, slang, or not in our dictionary.`
        );
      }
      setShowDefinitionPanel(true);
    } catch (error) {
      console.error(`Error fetching definition for "${cleanWord}":`, error);
      setWordDefinition(
        `Could not fetch definition for "${cleanWord}". Please check your network or try again later.`
      );
      setShowDefinitionPanel(true);
    }
  };

  // Utility Functions
  const getMarginClass = () => {
    switch (marginSize) {
      case "small":
        return "px-4 sm:px-6";
      case "large":
        return "px-12 md:px-20";
      default:
        return "px-8 md:px-16";
    }
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case "sans":
        return "font-sans";
      case "mono":
        return "font-mono";
      default:
        return "font-serif";
    }
  };

  function paginateByWords(content: string, wordsPerPage = 400): string[] {
    const words = content.split(/\s+/);
    const pages: string[] = [];
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pages.push(words.slice(i, i + wordsPerPage).join(" "));
    }
    return pages.length ? pages : ["No content available."];
  }

  // Infinite Scroll for Vertical Mode
  useEffect(() => {
    if (readingDirection !== "vertical") return;
    const handleScroll = () => {
      const pages = document.querySelectorAll(".reader-page");
      let page = 1;
      for (let i = 0; i < pages.length; i++) {
        const rect = pages[i].getBoundingClientRect();
        if (rect.top > 60) {
          page = i + 1;
          break;
        }
      }
      setVerticalPage(page);

      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
        loadedPageCount < contentPages.length &&
        !isLoadingMore
      ) {
        setIsLoadingMore(true);
        const nextBatch = Math.min(loadedPageCount + 5, contentPages.length);
        setLoadedPageCount(nextBatch);
        setIsLoadingMore(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [readingDirection, contentPages.length, loadedPageCount, isLoadingMore]);

  useEffect(() => {
    setLoadedPageCount(3);
    setIsLoadingMore(false);
  }, [initialContent, readingDirection]);

  const totalPages = contentPages.length;

  const handlePageJumpVertical = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      if (loadedPageCount < pageNum) {
        setLoadedPageCount(pageNum);
        setTimeout(() => {
          const pages = document.querySelectorAll(".reader-page");
          const target = pages[pageNum - 1];
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else {
        const pages = document.querySelectorAll(".reader-page");
        const target = pages[pageNum - 1];
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      setShowPageJump(false);
    }
  };

  // Floating button scroll logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 100) {
        if (!showFloatingButtons && !floatingTimeout.current) {
          floatingTimeout.current = setTimeout(() => {
            setShowFloatingButtons(true);
            floatingTimeout.current = null;
          }, 500);
        }
      } else {
        if (floatingTimeout.current) {
          clearTimeout(floatingTimeout.current);
          floatingTimeout.current = null;
        }
        setShowFloatingButtons(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (floatingTimeout.current) clearTimeout(floatingTimeout.current);
    };
  }, [showFloatingButtons]);

  // Helper for long-press detection
  function useLongPress(callback: () => void, ms = 500) {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const start = () => {
      timerRef.current = setTimeout(callback, ms);
    };
    const clear = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
    return { onTouchStart: start, onTouchEnd: clear, onTouchMove: clear, onTouchCancel: clear };
  }

  const handleWordTTS = (index: number) => {
    stopTextToSpeech();
    startTextToSpeech(index);
  };

  const handleWordTouchStart = (wIndex: number) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      handleWordTTS(wIndex);
    }, 500);
  };
  const handleWordTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  if (!book) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900"
      >
        <MainNav />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
          >
            <BookOpen className="h-16 w-16 mx-auto mb-6 text-primary opacity-80" />
            <h1 className="text-2xl font-bold mb-4">Book Not Found</h1>
            <p className="text-muted-foreground mb-8">
              We couldn't find the book you're looking for.
            </p>
            <Button
              onClick={() => router.push("/discover")}
              size="lg"
              className="w-full"
            >
              <BookOpen className="mr-2 h-5 w-5" /> Discover Books
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className={`min-h-screen flex flex-col ${
          isFullScreen ? "bg-gray-100 dark:bg-gray-900" : ""
        }`}
      >
        {/* Header */}
        {!isFullScreen && (
          <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md md:px-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold text-center flex-1">{book.title}</h1>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={toggleBookmark}>
                <Bookmark className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
              >
                <BookText className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={toggleFullScreen}>
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="py-6 space-y-4">
              <Button variant="ghost" onClick={() => router.push("/discover")}>
                Discover
              </Button>
              <Button variant="ghost" onClick={() => router.push("/library")}>
                My Library
              </Button>
              <Button variant="ghost" onClick={() => router.push("/reader")}>
                Reader
              </Button>
              <Button variant="ghost" onClick={() => router.push("/login")}>
                Login
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div
          ref={mainContentRef}
          className={`flex-1 flex flex-col items-center ${
            isFullScreen ? "p-0" : "py-6 sm:py-10"
          } ${!isFullScreen ? "pb-20 md:pb-24" : ""}`}
        >
          <div
            className={`w-full max-w-3xl mx-auto ${
              isFullScreen ? "h-screen" : "min-h-[70vh]"
            } ${getMarginClass()}`}
          >
            {showDirectionModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-xs w-full text-center shadow-lg">
                  <h2 className="text-lg font-bold mb-2">Setting for the first time...</h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Select the reading mode you want. You can re-config in <b>Settings &gt; Reading Mode</b>
                  </p>
                  <div className="space-y-3">
                    <Button
                      className="w-full flex items-center justify-center"
                      onClick={() => {
                        setReadingDirection("vertical");
                        localStorage.setItem("reader-direction", "vertical");
                        setShowDirectionModal(false);
                      }}
                    >
                      <span className="mr-2">📖</span> Vertical Follow
                    </Button>
                    <Button
                      className="w-full flex items-center justify-center"
                      onClick={() => {
                        setReadingDirection("horizontal");
                        localStorage.setItem("reader-direction", "horizontal");
                        setShowDirectionModal(false);
                      }}
                    >
                      <span className="mr-2">📚</span> Horizontal Follow
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {readingDirection === "vertical" ? (
              <>
                <div
                  className={`prose dark:prose-invert prose-neutral py-6 sm:py-8 ${getFontFamilyClass()}`}
                  style={{ fontSize: `clamp(14px, 4vw, ${fontSize}px)`, lineHeight }}
                >
                  {contentPages.slice(0, loadedPageCount).map((page, idx) => (
                    <div key={idx} className="reader-page mb-12 pb-8 border-b border-gray-200 dark:border-gray-700 relative">
                      {page.split(/\n\s*\n/).map((paragraph, pIndex) =>
                        paragraph.trim() ? (
                          <p key={pIndex} className="mb-4">
                            {paragraph.split(/\s+/).map((word, wIndex) => (
                              <span
                                key={wIndex}
                                className={`word cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${currentWordIndex === wIndex ? "bg-yellow-200" : ""}`}
                                onClick={e => {
                                  if (e.altKey) {
                                    handleWordTTS(wIndex);
                                  } else {
                                    if (isPlaying) pauseTextToSpeech();
                                    getWordDefinition(word, e);
                                  }
                                }}
                                title="Click for definition. Alt+Click (desktop) or long-press (mobile) for TTS."
                                onTouchStart={() => handleWordTouchStart(wIndex)}
                                onTouchEnd={handleWordTouchEnd}
                                onTouchMove={handleWordTouchEnd}
                                onTouchCancel={handleWordTouchEnd}
                              >
                                {word}{" "}
                              </span>
                            ))}
                          </p>
                        ) : null
                      )}
                      <div className="absolute right-4 bottom-2 text-xs text-muted-foreground select-none opacity-60">
                        Page {idx + 1}
                      </div>
                    </div>
                  ))}
                  {loadedPageCount === contentPages.length && (
                    <div className="text-center py-12">
                      <div className="text-lg font-semibold text-primary mb-2">Book finished 🎉</div>
                      <p className="text-sm text-muted-foreground">You've reached the end of the book</p>
                    </div>
                  )}
                </div>
                {!isFullScreen && (
                  <div className="hidden md:flex fixed bottom-0 left-0 w-full z-40 bg-background/95 backdrop-blur border-t border-border py-4 px-8 items-center justify-between gap-4" style={{ minHeight: 64 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shadow-md"
                      onClick={() => {
                        setJumpPageValue(readingDirection === "vertical" ? verticalPage : currentPage + 1);
                        setShowPageJump(true);
                      }}
                    >
                      <ChevronUp className="h-4 w-4 mr-1" /> Jump to Page
                    </Button>
                    <div className="flex gap-4 items-center mx-auto">
                      <Button
                        variant="outline"
                        size="lg"
                        disabled={readingDirection === "vertical" ? verticalPage <= 1 : currentPage <= 0}
                        onClick={() => {
                          if (readingDirection === "vertical") handlePageJumpVertical(verticalPage - 1);
                          else setCurrentPage(currentPage - 1);
                        }}
                      >
                        <ChevronLeft className="h-5 w-5 mr-1" /> Prev
                      </Button>
                      <span className="text-sm text-muted-foreground select-none">
                        Page {readingDirection === "vertical" ? verticalPage : currentPage + 1} of {contentPages.length}
                      </span>
                      <Button
                        variant="outline"
                        size="lg"
                        disabled={readingDirection === "vertical" ? verticalPage >= contentPages.length : currentPage >= contentPages.length - 1}
                        onClick={() => {
                          if (readingDirection === "vertical") handlePageJumpVertical(verticalPage + 1);
                          else setCurrentPage(currentPage + 1);
                        }}
                      >
                        Next <ChevronRight className="h-5 w-5 ml-1" />
                      </Button>
                    </div>
                    <div style={{ width: 120 }} />
                  </div>
                )}
              </>
            ) : (
              <>
                <HorizontalSwipePage
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  contentPages={contentPages}
                  contentRef={contentRef}
                  getFontFamilyClass={getFontFamilyClass}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  getWordDefinition={getWordDefinition}
                  currentWordIndex={currentWordIndex}
                  handleWordTTS={handleWordTTS}
                  isPlaying={isPlaying}
                  pauseTextToSpeech={pauseTextToSpeech}
                  handleWordTouchStart={handleWordTouchStart}
                  handleWordTouchEnd={handleWordTouchEnd}
                />
                {currentPage === contentPages.length - 1 && (
                  <div className="text-center text-lg font-semibold text-primary mt-12 mb-24">Book finished 🎉</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bookmarks Panel */}
        <AnimatePresence>
          {isFullScreen && bookmarks.length > 0 && controlsVisible && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="fixed left-6 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 shadow-md rounded-md p-2 max-h-80 overflow-y-auto"
            >
              <h3 className="text-sm font-medium px-2 py-1">Bookmarks</h3>
              <Separator className="my-1" />
              <div className="space-y-1">
                {bookmarks.map((bookmark) => (
                  <Button
                    key={bookmark}
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start ${
                      currentPage === bookmark ? "bg-primary/10 text-primary" : ""
                    }`}
                    onClick={() => setCurrentPage(bookmark)}
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    Page {bookmark + 1}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Assistant Panel */}
        <AnimatePresence>
          {(isFullScreen ? controlsVisible : true) && aiPanelOpen && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
              className="fixed right-6 top-16 bottom-16 w-96 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden flex flex-col
                sm:right-6 sm:top-16 sm:bottom-16 sm:w-96
                max-sm:right-0 max-sm:left-0 max-sm:top-0 max-sm:bottom-0 max-sm:w-[95vw] max-sm:max-w-sm max-sm:mx-auto max-sm:rounded-b-none max-sm:rounded-t-none max-sm:h-[90vh]"
            >
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold">AI Reading Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAiPanelOpen(false)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation"
                  aria-label="Close AI Assistant"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Tabs defaultValue="summary" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="w-full justify-start px-4 py-2 bg-muted/50">
                  <TabsTrigger value="summary" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <BookText className="h-4 w-4 mr-2" />
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="ask" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ask AI
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="flex-1 flex flex-col h-full p-0">
                  <div className="bg-muted/30 rounded-lg px-4 pt-4 pb-2 shrink-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Page Summary</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Get an AI-generated summary of the current page
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Page {readingDirection === "vertical" ? verticalPage : currentPage + 1} of {contentPages.length}
                      </div>
                    </div>
                  </div>
                  {/* Compact Book Info Row */}
                  <div className="px-4 pt-2 pb-0 shrink-0">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-xs text-muted-foreground truncate">
                      <span title={book.title}><b>Title:</b> {book.title}</span>
                      {book.authors && book.authors.length > 0 && <span title={book.authors[0]}><b>Author:</b> {book.authors[0]}</span>}
                      {book.publishedDate && <span><b>Year:</b> {book.publishedDate}</span>}
                      {book.categories && book.categories.length > 0 && (
                        <span
                          className="max-w-[120px] truncate"
                          title={book.categories.join(', ')}
                        >
                          <b>Genre:</b> {book.categories.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Main scrollable summary area */}
                  <div className="flex-1 overflow-y-auto px-4 pt-2 pb-2 space-y-2">
                    {summaryLoading ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-2">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary"></div>
                          <MessageSquare className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">Generating summary...</p>
                      </div>
                    ) : summary ? (
                      <>
                        <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 rounded-lg p-3 mt-0">
                          <p className="text-sm mb-1">{summary}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-2">
                            <BookText className="h-4 w-4" />
                            <span>AI-generated summary</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(summary);
                              toast({
                                title: "Copied",
                                description: "Summary copied to clipboard",
                                duration: 1500,
                              });
                            }}
                          >
                            <Copy className="h-4 w-4 mr-1" /> Copy
                          </Button>
                        </div>
                        {/* Key Themes */}
                        {book.themes && book.themes.length > 0 && (
                          <div className="mt-2 bg-muted/20 rounded-md p-2 text-xs">
                            <b>Themes:</b> {

book.themes.join(', ')}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-start gap-2 mt-2">
                        <MessageSquare className="h-8 w-8 text-muted-foreground opacity-50 mb-1" />
                        <p className="text-sm text-muted-foreground">Click the button below to generate a summary</p>
                      </div>
                    )}
                  </div>
                  {/* Action buttons and tip pinned to bottom */}
                  <div className="px-4 pb-4 pt-2 mt-1 shrink-0">
                    <div className="space-y-2">
                      <Button 
                        onClick={handleGenerateSummary} 
                        className="w-full transition-all duration-200 hover:bg-primary/90"
                        disabled={summaryLoading}
                      >
                        {summary ? "Generate New Summary" : "Generate Summary"}
                      </Button>
                      {summary && (
                        <Button
                          variant="outline"
                          onClick={() => setSummary("")}
                          className="w-full"
                        >
                          Clear Summary
                        </Button>
                      )}
                      <div className="bg-muted/10 rounded-md p-2 text-xs text-muted-foreground">
                        <b>Tip:</b> You can ask the AI about characters, themes, or events in the "Ask AI" tab!
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="ask" className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        Ask a question about the current page (e.g., "What are the main themes?")
                      </p>
                    </div>
                    <Textarea
                      placeholder="e.g. What are the main themes presented? Who is the protagonist?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                      className="min-h-24 resize-none border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary transition-all duration-200"
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <p>Try asking: What are the main themes? Who is the main character?</p>
                      <p>{question.length}/200</p>
                    </div>
                    {answerLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 space-y-3">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
                          <MessageSquare className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">Thinking...</p>
                      </div>
                    ) : answer ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 rounded-lg p-3">
                        <p className="text-sm">{answer}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 space-y-3">
                        <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground text-center">Ask a question to get an answer</p>
                      </div>
                    )}
                    {aiHistory.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Recent Questions</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {aiHistory.map((item, index) => (
                            <div key={index} className="bg-muted/30 rounded-lg p-3 space-y-1">
                              <p className="text-sm font-medium">Q: {item.question}</p>
                              <p className="text-sm text-muted-foreground">A: {item.answer}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setQuestion(item.question)}
                                className="w-full mt-2"
                              >
                                Re-ask
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t dark:border-gray-700">
                    <Button
                      onClick={handleAskQuestion}
                      disabled={answerLoading || !question.trim()}
                      className="w-full transition-all duration-200 hover:bg-primary/90"
                    >
                      Ask Question
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Definition Panel */}
        <AnimatePresence>
          {showDefinitionPanel && definitionPosition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "fixed", top: definitionPosition.top, left: definitionPosition.left, zIndex: 1000 }}
              className="bg-white dark:bg-gray-800 shadow-lg rounded-md p-4 w-80 max-w-full"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{selectedWord}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDefinitionPanel(false)}>
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{wordDefinition}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating FAB (Quick Actions) */}
        {showFloatingButtons && !isFullScreen && (
          <Popover open={fabOpen} onOpenChange={setFabOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="fixed bottom-36 right-6 z-50 shadow-md rounded-full bg-background"
                aria-label="Quick Actions"
              >
                <MoreVertical className="h-6 w-6" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={12}
              className="w-44 p-2 flex flex-col gap-1 rounded-xl shadow-lg bg-background"
              style={{ bottom: 0, right: 0 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => { toggleBookmark(); setFabOpen(false); }}
              >
                <Bookmark className="h-5 w-5 mr-2" /> Bookmark
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => { setAiPanelOpen(!aiPanelOpen); setFabOpen(false); }}
              >
                <BookText className="h-5 w-5 mr-2" /> AI Assistant
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => { toggleFullScreen(); setFabOpen(false); }}
              >
                <Maximize className="h-5 w-5 mr-2" /> Fullscreen
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => { setFabOpen(false); setIsMobileMenuOpen(true); }}
              >
                <Settings className="h-5 w-5 mr-2" /> Settings
              </Button>
            </PopoverContent>
          </Popover>
        )}

        {/* Settings Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed bottom-6 right-6 shadow-md z-50"
              title="Reading settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Reading Settings</SheetTitle>
              <SheetDescription>Customize your reading experience</SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Theme</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={readingMode === "light" ? "bg-primary/10 text-primary" : ""}
                    onClick={() => setReadingMode("light")}
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={readingMode === "dark" ? "bg-primary/10 text-primary" : ""}
                    onClick={() => setReadingMode("dark")}
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={readingMode === "system" ? "bg-primary/10 text-primary" : ""}
                    onClick={() => setReadingMode("system")}
                  >
                    <Laptop className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Font Size</h3>
                  <span className="text-sm font-medium">{fontSize}px</span>
                </div>
                <Slider
                  value={[fontSize]}
                  min={14}
                  max={24}
                  step={1}
                  onValueChange={(value) => setFontSize(value[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>A</span>
                  <span className="text-base">A</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Line Spacing</h3>
                  <span className="text-sm font-medium">{lineHeight.toFixed(1)}</span>
                </div>
                <Slider
                  value={[lineHeight]}
                  min={1.2}
                  max={2.2}
                  step={0.1}
                  onValueChange={(value) => setLineHeight(value[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Compact</span>
                  <span>Spacious</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Font Family</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={fontFamily === "serif" ? "bg-primary/10 text-primary" : ""}
                    onClick={() => setFontFamily("serif")}
                  >
                    <span className="font-serif">Serif</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={fontFamily === "sans" ? "bg-primary/10 text-primary" : ""}
                    onClick={() => setFontFamily("sans")}
                  >
                    <span className="font-sans">Sans</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={fontFamily === "mono" ? "bg-primary/10 text-primary" : ""}
                    onClick={() => setFontFamily("mono")}
                  >
                    <span className="font-mono">Mono</span>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Margins</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={marginSize === "small" ? "bg-primary/10 text-primary" : ""}
                    onClick={() => setMarginSize("small")}
                  >
                    Narrow
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={marginSize === "medium" ? "bg-primary/10 text-primary" : ""}
                    onClick={() => setMarginSize("medium")}
                  >
                    Medium
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={marginSize === "large" ? "bg-primary/10 text-primary" : ""}
                    onClick={() => setMarginSize("large")}
                  >
                    Wide
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Accessibility</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className={highContrast ? "bg-primary/10 text-primary" : ""}
                  onClick={() => setHighContrast(!highContrast)}
                >
                  {highContrast ? <span>Disable High Contrast</span> : <span>Enable High Contrast</span>}
                </Button>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Reading Mode</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={readingDirection === "vertical" ? "bg-primary/10 text-primary" : ""}
                    onClick={() => {
                      setReadingDirection("vertical");
                      localStorage.setItem("reader-direction", "vertical");
                    }}
                  >
                    Vertical Follow
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={readingDirection === "horizontal" ? "bg-primary/10 text-primary" : ""}
                    onClick={() => {
                      setReadingDirection("horizontal");
                      localStorage.setItem("reader-direction", "horizontal");
                    }}
                  >
                    Horizontal Follow
                  </Button>
                </div>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button>Done</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* TTS Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed bottom-20 right-6 shadow-md z-50"
              title="Text-to-speech controls"
            >
              <Headphones className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Text-to-Speech</SheetTitle>
              <SheetDescription>Customize your listening experience</SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div className="flex space-x-3 justify-center">
                <Button
                  variant={isPlaying ? "outline" : "default"}
                  size="icon"
                  onClick={() => isPlaying ? pauseTextToSpeech() : startTextToSpeech()}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button variant="outline" size="icon" onClick={stopTextToSpeech} title="Stop">
                  <Square className="h-5 w-5" />
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Reading Speed</h3>
                  <span className="text-sm font-medium">{speechRate.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[speechRate]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={(value) => setSpeechRate(value[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slower</span>
                  <span>Faster</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Voice</h3>
                <Select
                  value={selectedVoice?.name || ""}
                  onValueChange={(name) => {
                    const voice = voices.find((v) => v.name === name) || null;
                    setSelectedVoice(voice);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.length > 0 ? (
                      voices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="default">Default Voice</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground mt-4">
                <p>Keyboard shortcuts:</p>
                <p>Space or 'P' key: Play/Pause</p>
                <p>Click a word to start reading from there</p>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button>Done</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Side Navigation Zones */}
        <>
          <div
            className={`hidden md:block fixed left-0 z-30 cursor-pointer group ${isFullScreen ? "opacity-90" : ""}`}
            style={{ top: "40%", height: "20%", width: "48px", background: "linear-gradient(to right, rgba(0,0,0,0.08), transparent)", borderRadius: "0 16px 16px 0" }}
            onClick={() => {
              if (readingDirection === "vertical") handlePageJumpVertical(verticalPage - 1);
              else setCurrentPage(currentPage - 1);
            }}
          >
            <div className={`flex items-center h-full justify-center transition-opacity ${isFullScreen ? "opacity-100" : "opacity-60"} group-hover:opacity-100`}>
              <ChevronLeft className={`text-muted-foreground ${isFullScreen ? "h-12 w-12" : "h-8 w-8"}`} />
            </div>
          </div>
          <div
            className={`hidden md:block fixed right-0 z-30 cursor-pointer group ${isFullScreen ? "opacity-90" : ""}`}
            style={{ top: "40%", height: "20%", width: "48px", background: "linear-gradient(to left, rgba(0,0,0,0.08), transparent)", borderRadius: "16px 0 0 16px" }}
            onClick={() => {
              if (readingDirection === "vertical") handlePageJumpVertical(verticalPage + 1);
              else setCurrentPage(currentPage + 1);
            }}
          >
            <div className={`flex items-center h-full justify-center transition-opacity ${isFullScreen ? "opacity-100" : "opacity-60"} group-hover:opacity-100`}>
              <ChevronRight className={`text-muted-foreground ${isFullScreen ? "h-12 w-12" : "h-8 w-8"}`} />
            </div>
          </div>
        </>

        {/* Fixed Jump to Page Button (only in horizontal mode) */}
        {readingDirection === "horizontal" && (
          <Button
            variant="outline"
            size="lg"
            className="fixed bottom-6 left-6 z-50 shadow-md"
            onClick={() => {
              setJumpPageValue(currentPage + 1);
              setShowPageJump(true);
            }}
            title="Jump to Page"
          >
            <ChevronUp className="h-5 w-5 mr-1" /> Jump to Page
          </Button>
        )}
        {/* Floating Jump to Page Button (only in vertical mode) */}
        {readingDirection === "vertical" && showFloatingButtons && !isFullScreen && (
          <Button
            variant="outline"
            size="lg"
            className="fixed bottom-6 left-6 z-50 shadow-md"
            onClick={() => {
              setJumpPageValue(verticalPage);
              setShowPageJump(true);
            }}
            title="Jump to Page"
          >
            <ChevronUp className="h-5 w-5 mr-1" /> Jump to Page
          </Button>
        )}

        {showPageJump && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-xs">
              <h2 className="text-lg font-bold mb-2">Jump to Page</h2>
              <div className="mb-2 text-center text-sm text-muted-foreground">
                Page {jumpPageValue} of {contentPages.length}
              </div>
              <Slider
                min={1}
                max={contentPages.length}
                step={1}
                value={[jumpPageValue]}
                onValueChange={([val]) => setJumpPageValue(val)}
                className="mb-4"
              />
              <div className="flex justify-between gap-2">
                <Button
                  onClick={() => {
                    if (jumpPageValue >= 1 && jumpPageValue <= contentPages.length) {
                      if (readingDirection === "vertical") {
                        handlePageJumpVertical(jumpPageValue);
                      } else {
                        setCurrentPage(jumpPageValue - 1);
                        setShowPageJump(false);
                      }
                    }
                  }}
                >
                  Go
                </Button>
                <Button variant="outline" onClick={() => setShowPageJump(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface HorizontalSwipePageProps {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  contentPages: string[];
  contentRef: React.RefObject<HTMLDivElement>;
  getFontFamilyClass: () => string;
  fontSize: number;
  lineHeight: number;
  getWordDefinition: (word: string, e: React.MouseEvent<HTMLSpanElement>) => void;
  currentWordIndex: number;
  handleWordTTS: (index: number) => void;
  isPlaying: boolean;
  pauseTextToSpeech: () => void;
  handleWordTouchStart: (wIndex: number) => void;
  handleWordTouchEnd: () => void;
}

function HorizontalSwipePage(props: HorizontalSwipePageProps) {
  const {
    currentPage,
    setCurrentPage,
    contentPages,
    contentRef,
    getFontFamilyClass,
    fontSize,
    lineHeight,
    getWordDefinition,
    currentWordIndex,
    handleWordTTS,
    isPlaying,
    pauseTextToSpeech,
    handleWordTouchStart,
    handleWordTouchEnd,
  } = props;
  const touchStartX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50 && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (deltaX < -50 && currentPage < contentPages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-lg shadow-md"
      style={{ touchAction: "pan-y" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={contentRef}
        className={`py-6 sm:py-8 ${getFontFamilyClass()} prose dark:prose-invert prose-neutral`}
        style={{ fontSize: `clamp(14px, 4vw, ${fontSize}px)`, lineHeight }}
      >
        {contentPages[currentPage]?.split("\n\n").map((paragraph, pIndex) => (
          <p key={pIndex} className="mb-4">
            {paragraph.split(/\s+/).map((word, wIndex) => (
              <span
                key={wIndex}
                className={`word cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${currentWordIndex === wIndex ? "bg-yellow-200" : ""}`}
                onClick={e => {
                  if (e.altKey) {
                    handleWordTTS(wIndex);
                  } else {
                    if (isPlaying) pauseTextToSpeech();
                    getWordDefinition(word, e);
                  }
                }}
                title="Click for definition. Alt+Click (desktop) or long-press (mobile) for TTS."
                onTouchStart={() => handleWordTouchStart(wIndex)}
                onTouchEnd={handleWordTouchEnd}
                onTouchMove={handleWordTouchEnd}
                onTouchCancel={handleWordTouchEnd}
              >
                {word}{" "}
              </span>
            ))}
          </p>
        ))}
      </div>
    </motion.div>
  );
}