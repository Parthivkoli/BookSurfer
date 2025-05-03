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

interface ReaderClientProps {
  initialBook: Book | null;
  initialContent: string;
  bookId: string;
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

  const [book, setBook] = useState<Book | null>(initialBook);
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
  const summarizeContent = (content: string, maxSentences = 3): string => {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim());
    return sentences.slice(0, maxSentences).join(". ") + ".";
  };

  const handleGenerateSummary = () => {
    if (!book || !contentPages[currentPage]) return;
    setSummaryLoading(true);
    setTimeout(() => {
      const result = summarizeContent(contentPages[currentPage], 3);
      setSummary(result);
      setSummaryLoading(false);
    }, 1000);
  };

  // AI Question Answering
  const generateAnswer = (
    content: string,
    question: string,
    maxSentences = 2
  ): string => {
    const lowerContent = content.toLowerCase();
    const lowerQuestion = question.toLowerCase().trim();

    const questionWords = lowerQuestion
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !["what", "is", "are", "the", "a", "an", "of"].includes(word)
      );

    if (questionWords.length === 0) {
      return "Please ask a more specific question.";
    }

    let bestMatch = "";
    let highestScore = 0;
    const sentences = lowerContent.split(/[.!?]+/).filter((s) => s.trim());

    for (const sentence of sentences) {
      let score = 0;
      for (const word of questionWords) {
        if (sentence.includes(word)) {
          score += 1 + (sentence.split(word).length - 1);
        }
      }
      if (score > highestScore && score > 0) {
        highestScore = score;
        bestMatch = sentence;
      }
    }

    if (bestMatch) {
      const intent = lowerQuestion.startsWith("what")
        ? "Here's what I found: "
        : lowerQuestion.startsWith("who")
        ? "This is who: "
        : lowerQuestion.startsWith("why")
        ? "Here's why: "
        : "Here's the answer: ";

      const responseSentences = bestMatch
        .split(/[.!?]+/)
        .filter((s) => s.trim())
        .slice(0, maxSentences);
      return `${intent}${responseSentences.join(". ")}.`;
    }

    return `I couldn't find a direct answer, but here's some related information from the page: ${sentences
      .slice(0, maxSentences)
      .join(". ")}.`;
  };

  const handleAskQuestion = () => {
    if (!question.trim() || !book || !contentPages[currentPage]) {
      toast({
        title: "Invalid Question",
        description: "Please enter a specific question about the current page.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    setAnswerLoading(true);
    setTimeout(() => {
      const result = generateAnswer(contentPages[currentPage], question, 2);
      setAnswer(result);
      setAiHistory((prev) => [...prev.slice(-4), { question, answer: result }]);
      setAnswerLoading(false);
    }, 1200);
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
                                className={`word cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                                  currentWordIndex === wIndex ? "bg-yellow-200" : ""
                                }`}
                                onClick={() => handleWordClick(wIndex)}
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
                  handleWordClick={handleWordClick}
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
              className="fixed right-6 top-16 bottom-16 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden flex flex-col md:w-96"
            >
              <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-medium">AI Reading Assistant</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAiPanelOpen(false)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <Tabs defaultValue="summary" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="w-full justify-start px-3 pt-2">
                  <TabsTrigger value="summary" className="flex-1">
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="ask" className="flex-1 tooltip" data-tooltip="Ctrl + / to focus">
                    Ask AI
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="flex-1 overflow-y-auto p-3 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Get an AI-generated summary of the current page
                  </p>
                  {summaryLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-3 text-sm text-muted-foreground">Generating summary...</p>
                    </div>
                  ) : summary ? (
                    <Card>
                      <CardContent className="p-3 text-sm">{summary}</CardContent>
                      <CardFooter className="p-2 flex justify-end">
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
                      </CardFooter>
                    </Card>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <BookText className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                      <p className="text-sm text-muted-foreground text-center">No summary generated yet</p>
                    </div>
                  )}
                  <Button
                    onClick={handleGenerateSummary}
                    disabled={summaryLoading}
                    className="w-full transition-all duration-200 hover:bg-primary/90"
                  >
                    Generate Summary
                  </Button>
                </TabsContent>
                <TabsContent value="ask" className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Ask a question about the current page (e.g., "What are the main themes?")
                    </p>
                    <Textarea
                      placeholder="e.g. What are the main themes presented? Who is the protagonist?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                      className="min-h-20 border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary transition-all duration-200"
                    />
                    <p className="text-xs text-muted-foreground text-right">{question.length}/200</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try asking: What are the main themes? Who is the main character? Why does [key phrase] happen?
                    </p>
                    {answerLoading ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <motion.div
                          className="rounded-full h-8 w-8 border-b-2 border-primary"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <p className="mt-3 text-sm text-muted-foreground">Generating answer...</p>
                      </div>
                    ) : answer ? (
                      <Card>
                        <CardContent className="p-3 text-sm">
                          <p className="font-medium">{answer}</p>
                        </CardContent>
                        <CardFooter className="p-2 flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(answer);
                              toast({
                                title: "Copied",
                                description: "Answer copied to clipboard",
                                duration: 1500,
                              });
                            }}
                          >
                            <Copy className="h-4 w-4 mr-1" /> Copy
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setQuestion("")}>
                            New Question
                          </Button>
                        </CardFooter>
                      </Card>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                        <p className="text-sm text-muted-foreground text-center">Ask a question to get an answer</p>
                      </div>
                    )}
                    <div className="mt-4 p-2 bg-muted rounded-md">
                      <h4 className="text-sm font-medium mb-2">Recent Questions</h4>
                      {aiHistory.length > 0 ? (
                        <div className="space-y-2 max-h-20 overflow-y-auto">
                          {aiHistory.map((item, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              <p><strong>Q:</strong> {item.question}</p>
                              <p><strong>A:</strong> {item.answer}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setQuestion(item.question)}
                                className="mt-1"
                              >
                                Re-ask
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent questions.</p>
                      )}
                    </div>
                  </div>
                  <div className="p-3 border-t dark:border-gray-700">
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

        {/* Fullscreen-only Floating Buttons */}
        <AnimatePresence>
          {isFullScreen && controlsVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed top-6 right-6 flex space-x-2"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                className={`shadow-sm ${aiPanelOpen ? "bg-primary/10 text-primary" : ""}`}
                title="Toggle AI assistant"
              >
                <BookText className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/share/${bookId}?page=${currentPage + 1}`;
                  navigator.clipboard.writeText(url);
                  toast({
                    title: "Link Copied",
                    description: "Share link copied to clipboard",
                    duration: 2000,
                  });
                }}
                className="shadow-sm"
                title="Share current page"
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Fixed Jump to Page Button */}
        <Button
          variant="outline"
          size="lg"
          className="fixed bottom-6 left-6 z-50 shadow-md"
          onClick={() => {
            setJumpPageValue(readingDirection === "vertical" ? verticalPage : currentPage + 1);
            setShowPageJump(true);
          }}
          title="Jump to Page"
        >
          <ChevronUp className="h-5 w-5 mr-1" /> Jump to Page
        </Button>

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
  handleWordClick: (index: number) => void;
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
    handleWordClick,
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
                className={`word cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                  currentWordIndex === wIndex ? "bg-yellow-200" : ""
                }`}
                onClick={() => handleWordClick(wIndex)}
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