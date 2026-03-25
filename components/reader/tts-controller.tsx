"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TTSControllerProps {
  content: string; // Plain text to read
  onWordHighlight?: (wordIndex: number) => void;
  onFinish?: () => void;
  visible?: boolean;
}

export function TTSController({ content, onWordHighlight, onFinish, visible = true }: TTSControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        // Prefer natural english voices
        const preferred = availableVoices.find(v => 
          (v.name.includes("Google") || v.name.includes("Premium") || v.name.includes("Natural")) && 
          v.lang.startsWith("en")
        ) || availableVoices[0];
        
        setSelectedVoice(preferred.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  const togglePlay = () => {
    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    if (!content.trim()) {
      toast.error("No content to read");
      return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(content);
    if (selectedVoice) {
      const voice = voices.find((v) => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    }
    utterance.rate = rate;
    utterance.pitch = pitch;

    let wordCount = 0;
    utterance.onboundary = (e) => {
      if (e.name === "word") {
        if (onWordHighlight) onWordHighlight(wordCount);
        wordCount++;
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      if (onFinish) onFinish();
    };

    utterance.onerror = (e) => {
      if (e.error !== "canceled" && e.error !== "interrupted") {
        console.error("Speech Synthesis Error:", e);
        toast.error("Failed to play audio");
        setIsPlaying(false);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="flex items-center gap-2 p-1.5 bg-background/90 backdrop-blur border border-border rounded-full shadow-lg"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className={`rounded-full w-10 h-10 transition-all ${isPlaying && !isPaused ? "bg-primary/20 text-primary" : ""}`}
        >
          {isPlaying && !isPaused ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>
        
        {isPlaying && (
          <Button
            variant="ghost"
            size="icon"
            onClick={stop}
            className="rounded-full w-10 h-10 text-muted-foreground hover:text-destructive"
          >
            <Square className="h-4 w-4" />
          </Button>
        )}

        <div className="w-px h-6 bg-border mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 rounded-xl border-border shadow-2xl" align="center" sideOffset={10}>
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Voice Options</h4>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {voices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name} className="text-sm">
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-muted-foreground">Speed</span>
                    <span className="font-mono bg-muted px-1.5 rounded">{rate}x</span>
                  </div>
                  <Slider
                    value={[rate]}
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    onValueChange={(v) => {
                      setRate(v[0]);
                      if (isPlaying) { // Apply changes instantly by restarting
                        stop();
                        setTimeout(togglePlay, 50);
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-muted-foreground">Pitch</span>
                    <span className="font-mono bg-muted px-1.5 rounded">{pitch}</span>
                  </div>
                  <Slider
                    value={[pitch]}
                    min={0}
                    max={2}
                    step={0.1}
                    onValueChange={(v) => {
                      setPitch(v[0]);
                      if (isPlaying) { 
                        stop();
                        setTimeout(togglePlay, 50);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </motion.div>
    </AnimatePresence>
  );
}
