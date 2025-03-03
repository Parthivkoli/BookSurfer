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
  Copy,
  BookText,
  MessageSquare,
  Play,
  Pause,
  Square,
} from "lucide-react";
import { Book } from "@/types/book";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { summarizeContent, generateAnswer } from "@/lib/utils";
import { useTheme } from "next-themes";

interface ReaderClientProps {
  initialBook: Book | null;
  initialContent: string;
  bookId: string;
}

export default function ReaderClient({ initialBook, initialContent, bookId }: ReaderClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  const [book, setBook] = useState<Book | null>(initialBook);
  const [contentPages, setContentPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [readingMode, setReadingMode] = useState("light");
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
  const [speechRate, setSpeechRate] = useState(1); // Default 1x speed
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Dynamically paginate content to fit viewport height without scrolling
  useEffect(() => {
    const paginateContent = () => {
      if (!contentRef.current || !initialContent) {
        setContentPages(["No content available."]);
        return;
      }

      const containerHeight = window.innerHeight - (isFullScreen ? 40 : 120); // Reduced padding in non-full-screen for fitting content
      const paragraphs = initialContent.split("\n\n").filter((p) => p.trim());
      const pages: string[] = [];
      let currentPageContent = "";
      let currentHeight = 0;

      const tempDiv = document.createElement("div");
      tempDiv.style.fontSize = `${fontSize}px`;
      tempDiv.style.lineHeight = "1.6";
      tempDiv.style.padding = isFullScreen ? "2rem" : "1rem"; // Reduced padding in non-full-screen
      tempDiv.style.maxWidth = "75ch";
      tempDiv.style.position = "absolute";
      tempDiv.style.visibility = "hidden";
      document.body.appendChild(tempDiv);

      paragraphs.forEach((paragraph) => {
        tempDiv.innerText = currentPageContent + (currentPageContent ? "\n\n" : "") + paragraph;
        const height = tempDiv.offsetHeight;

        if (height <= containerHeight) {
          currentPageContent += (currentPageContent ? "\n\n" : "") + paragraph;
          currentHeight = height;
        } else {
          pages.push(currentPageContent);
          currentPageContent = paragraph;
          currentHeight = tempDiv.offsetHeight;
        }
      });

      if (currentPageContent) pages.push(currentPageContent);
      document.body.removeChild(tempDiv);

      setContentPages(pages.length > 0 ? pages : ["No content available."]);
    };

    paginateContent();
    window.addEventListener("resize", paginateContent);
    return () => window.removeEventListener("resize", paginateContent);
  }, [initialContent, fontSize, isFullScreen]);

  // Load bookmarks and progress
  useEffect(() => {
    const savedBookmarks = localStorage.getItem(`bookmarks-${bookId}`);
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

    const savedProgress = localStorage.getItem(`progress-${bookId}`);
    if (savedProgress) setCurrentPage(Math.min(parseInt(savedProgress, 10), contentPages.length - 1));
  }, [bookId, contentPages.length]);

  // Save reading progress
  useEffect(() => {
    if (book && currentPage >= 0) {
      localStorage.setItem(`progress-${bookId}`, currentPage.toString());
    }
  }, [book, bookId, currentPage]);

  // Apply reading mode
  useEffect(() => {
    if (readingMode === "system") setTheme("system");
    else if (readingMode === "dark") setTheme("dark");
    else setTheme("light");
  }, [readingMode, setTheme]);

  // Full-screen handling
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      contentRef.current?.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  // Load available voices for TTS
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(availableVoices[0]); // Default to first voice
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // Page navigation
  const goToNextPage = () => {
    if (currentPage < contentPages.length - 1) {
      setPageTransition(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setPageTransition(false);
      }, 300); // Slightly longer transition for smoothness
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setPageTransition(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1);
        setPageTransition(false);
      }, 300);
    }
  };

  const handlePageJump = () => {
    const pageNum = parseInt(pageInput, 10) - 1;
    if (pageNum >= 0 && pageNum < contentPages.length) {
      setCurrentPage(pageNum);
      setPageInput("");
    } else {
      toast({ title: "Invalid Page", description: "Please enter a valid page number.", variant: "destructive" });
    }
  };

  // Toggle bookmark
  const toggleBookmark = () => {
    const newBookmarks = [...bookmarks];
    const index = newBookmarks.indexOf(currentPage);
    if (index === -1) {
      newBookmarks.push(currentPage);
      toast({ title: "Bookmark Added", description: `Page ${currentPage + 1} bookmarked.` });
    } else {
      newBookmarks.splice(index, 1);
      toast({ title: "Bookmark Removed", description: `Bookmark for page ${currentPage + 1} removed.` });
    }
    setBookmarks(newBookmarks);
    localStorage.setItem(`bookmarks-${bookId}`, JSON.stringify(newBookmarks));
  };

  // Generate AI summary (client-side)
  const handleGenerateSummary = () => {
    if (!book || !contentPages[currentPage]) return;
    setSummaryLoading(true);
    try {
      const result = summarizeContent(contentPages[currentPage], 3); // 3 sentences for brevity
      setSummary(result);
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({ title: "Error", description: "Failed to generate summary.", variant: "destructive" });
    } finally {
      setSummaryLoading(false);
    }
  };

  // Ask AI a question (client-side keyword search)
  const handleAskQuestion = () => {
    if (!question.trim() || !book || !contentPages[currentPage]) return;
    setAnswerLoading(true);
    try {
      const result = generateAnswer(contentPages[currentPage], question, 2); // 2 sentences
      setAnswer(result);
    } catch (error) {
      console.error("Error generating answer:", error);
      toast({ title: "Error", description: "Failed to generate answer.", variant: "destructive" });
    } finally {
      setAnswerLoading(false);
    }
  };

  // Text-to-speech with word highlighting
  const startTextToSpeech = () => {
    if (!contentPages[currentPage] || isPlaying) return;
    window.speechSynthesis.cancel(); // Clear any existing speech
    const text = contentPages[currentPage];
    const words = text.split(/\s+/);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex;
        let wordIndex = 0;
        let currentPosition = 0;
        for (let i = 0; i < words.length; i++) {
          currentPosition += words[i].length + 1; // +1 for space
          if (currentPosition > charIndex) {
            wordIndex = i;
            break;
          }
        }
        setCurrentWordIndex(wordIndex);
      }
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
    };
    window.speechSynthesis.speak(utterance);
    utteranceRef.current = utterance;
    setIsPlaying(true);
    toast({ title: "Audio Started", description: "Text-to-speech started." });
  };

  const pauseTextToSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      toast({ title: "Audio Paused", description: "Text-to-speech paused." });
    }
  };

  const resumeTextToSpeech = () => {
    if (!isPlaying && utteranceRef.current) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      toast({ title: "Audio Resumed", description: "Text-to-speech resumed." });
    }
  };

  const stopTextToSpeech = () => {
    if (isPlaying || utteranceRef.current) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      utteranceRef.current = null;
      toast({ title: "Audio Stopped", description: "Text-to-speech stopped." });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNextPage();
      else if (e.key === "ArrowLeft") goToPrevPage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, contentPages.length]);

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
        <MainNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Book Not Found</h1>
            <p className="text-muted-foreground mb-6">We couldn’t find the book.</p>
            <Button onClick={() => router.push("/discover")}>Discover Books</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isFullScreen ? "bg-gray-100 dark:bg-gray-900" : ""}`}>
      <MainNav className={isFullScreen ? "hidden" : ""} />
      <div
        className={`flex-1 flex flex-col ${isFullScreen ? "p-0" : "container py-6 max-w-4xl"}`}
      >
        {/* Header */}
        {!isFullScreen && (
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{book.title}</h1>
              <p className="text-muted-foreground">{book.authors.join(", ") || "Unknown Author"}</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleBookmark}
                className={bookmarks.includes(currentPage) ? "text-primary" : ""}
              >
                <Bookmark className="h-5 w-5" />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Headphones className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Text-to-Speech Controls</SheetTitle>
                    <SheetDescription>Adjust your audio settings</SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-6">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={startTextToSpeech}
                        disabled={isPlaying}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={pauseTextToSpeech}
                        disabled={!isPlaying}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={stopTextToSpeech}>
                        <Square className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Speech Rate</h3>
                      <Slider
                        value={[speechRate]}
                        min={0.5}
                        max={2}
                        step={0.1}
                        onValueChange={(value) => setSpeechRate(value[0])}
                      />
                      <span className="text-sm text-muted-foreground">{speechRate}x</span>
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
                          {voices.map((voice) => (
                            <SelectItem key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Button variant="outline" size="icon" onClick={toggleFullScreen}>
                <Maximize className="h-5 w-5" />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
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
                      <h3 className="text-sm font-medium">Font Size</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs">A</span>
                        <Slider
                          value={[fontSize]}
                          min={14}
                          max={24}
                          step={1}
                          onValueChange={(value) => setFontSize(value[0])}
                        />
                        <span className="text-lg">A</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Reading Mode</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={readingMode === "light" ? "default" : "outline"}
                          onClick={() => setReadingMode("light")}
                        >
                          <Sun className="h-4 w-4 mr-2" /> Light
                        </Button>
                        <Button
                          variant={readingMode === "dark" ? "default" : "outline"}
                          onClick={() => setReadingMode("dark")}
                        >
                          <Moon className="h-4 w-4 mr-2" /> Dark
                        </Button>
                        <Button
                          variant={readingMode === "system" ? "default" : "outline"}
                          onClick={() => setReadingMode("system")}
                        >
                          <Laptop className="h-4 w-4 mr-2" /> System
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Bookmarks</h3>
                      {bookmarks.length > 0 ? (
                        bookmarks.map((bookmark) => (
                          <Button
                            key={bookmark}
                            variant="outline"
                            className="w-full justify-start text-left"
                            onClick={() => {
                              setCurrentPage(bookmark);
                              document
                                .querySelector('[data-state="closed"]')
                                ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                            }}
                          >
                            <Bookmark className="h-4 w-4 mr-2" />
                            <div>
                              <span>Page {bookmark + 1}</span>
                              <p className="text-xs text-muted-foreground truncate">
                                {contentPages[bookmark]?.split("\n\n")[0] || "No preview available"}
                              </p>
                            </div>
                          </Button>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No bookmarks yet.</p>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className={`mb-4 ${isFullScreen ? "px-4" : ""}`}>
          <Progress value={(currentPage + 1) / contentPages.length * 100} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Page {currentPage + 1} of {contentPages.length}</span>
            <span>{Math.round(((currentPage + 1) / contentPages.length) * 100)}% complete</span>
          </div>
        </div>

        {/* Content Area */}
        <div
          ref={contentRef}
          className={`flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300 ${
            pageTransition ? "opacity-0 translate-x-10" : "opacity-100 translate-x-0"
          } ${isFullScreen ? "p-16" : "p-1"}`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: "1.6",
            maxWidth: "75ch",
            margin: "0 auto",
            maxHeight: isFullScreen ? "100vh" : "100vh", // Use full viewport height in default view
            overflowY: "hidden",
          }}
        >
          {contentPages[currentPage]?.split(/\s+/).map((word, index) => (
            <span
              key={index}
              className={currentWordIndex === index && isPlaying ? "bg-yellow-200 dark:bg-yellow-600" : ""}
            >
              {word}{" "}
            </span>
          ))}
        </div>

        {/* Navigation Controls */}
        <div
          className={`flex items-center justify-between mt-6 space-x-4 ${
            isFullScreen ? "px-4 absolute bottom-4 left-0 right-0" : ""
          }`}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            className="shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-6 w-6 mr-2" /> Previous
          </Button>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              placeholder={`1-${contentPages.length}`}
              className="w-24 text-center"
            />
            <Button onClick={handlePageJump} variant="outline">
              Go
            </Button>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={goToNextPage}
            disabled={currentPage === contentPages.length - 1}
            className="shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Next <ChevronRight className="h-6 w-6 ml-2" />
          </Button>
        </div>

        {/* AI Features */}
        {!isFullScreen && (
          <Tabs defaultValue="summary" className="mt-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700 rounded-t-lg">
              <TabsTrigger value="summary">
                <BookText className="h-4 w-4 mr-2" /> AI Summary
              </TabsTrigger>
              <TabsTrigger value="ask">
                <MessageSquare className="h-4 w-4 mr-2" /> Ask About Book
              </TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="mt-0">
              <Card className="rounded-t-none">
                <CardHeader>
                  <CardTitle>AI-Generated Summary</CardTitle>
                  <CardDescription>Get a summary of the current page</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary ? (
                    <div className="relative">
                      <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{summary}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0"
                        onClick={() => {
                          navigator.clipboard.writeText(summary);
                          toast({ title: "Summary Copied", description: "Summary copied to clipboard." });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Generate a summary below.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleGenerateSummary}
                    disabled={summaryLoading}
                    className="w-full"
                  >
                    {summaryLoading ? (
                      <span>Generating...</span>
                    ) : (
                      <>
                        <BookText className="h-4 w-4 mr-2" /> Generate Summary
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="ask" className="mt-0">
              <Card className="rounded-t-none">
                <CardHeader>
                  <CardTitle>Ask About the Book</CardTitle>
                  <CardDescription>Ask questions about the current page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Ask a question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[100px]"
                  />
                  {answer && (
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
                      <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Answer:</h4>
                      <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{answer}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleAskQuestion}
                    disabled={answerLoading || !question.trim()}
                    className="w-full"
                  >
                    {answerLoading ? (
                      <span>Generating...</span>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" /> Ask Question
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}