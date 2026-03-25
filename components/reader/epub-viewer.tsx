"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import ePub, { Book as EpubBook, Rendition, Location } from "epubjs";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EpubViewerProps {
  url: string | ArrayBuffer;
  location?: string | number;
  onLocationChange?: (location: string) => void;
  fontSize?: number;
  fontFamily?: string;
  theme?: string; // "light" | "dark" | "sepia" | "oled"
}

export function EpubViewer({
  url,
  location,
  onLocationChange,
  fontSize = 18,
  fontFamily = "serif",
  theme = "light",
}: EpubViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [book, setBook] = useState<EpubBook | null>(null);
  const [rendition, setRendition] = useState<Rendition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Book and Rendition
  useEffect(() => {
    let currentBook: EpubBook;
    let currentRendition: Rendition;

    const loadBook = async () => {
      try {
        setIsLoading(true);
        setError(null);

        currentBook = ePub(url as any);
        setBook(currentBook);

        await currentBook.ready;

        if (viewerRef.current) {
          // Clean up any existing children
          viewerRef.current.innerHTML = "";
          
          currentRendition = currentBook.renderTo(viewerRef.current, {
            width: "100%",
            height: "100%",
            spread: "none",
            flow: "paginated",
          });
          
          setRendition(currentRendition);

          // Handle location changes
          currentRendition.on("relocated", (loc: Location) => {
            if (onLocationChange) onLocationChange(loc.start.cfi);
          });

          await currentRendition.display(location ? String(location) : undefined);
        }
      } catch (err) {
        console.error("Failed to load EPUB:", err);
        setError("Failed to load the book. The file might be corrupted or in an unsupported format.");
      } finally {
        setIsLoading(false);
      }
    };

    loadBook();

    return () => {
      if (currentBook) currentBook.destroy();
      if (currentRendition) currentRendition.destroy();
    };
  }, [url]);

  // Handle Preferences Updates
  useEffect(() => {
    if (rendition) {
      rendition.themes.fontSize(`${fontSize}px`);
      rendition.themes.font(fontFamily);
      
      const themeColors = {
        light: { bg: "#ffffff", fg: "#0f172a" },
        sepia: { bg: "#f4ecd8", fg: "#4f4236" },
        dark: { bg: "#0f172a", fg: "#f8fafc" },
        oled: { bg: "#000000", fg: "#cccccc" },
      };
      
      const currentTheme = themeColors[theme as keyof typeof themeColors] || themeColors.light;
      
      rendition.themes.register("custom", {
        body: {
          background: "transparent !important", // Letting container mix it
          color: `${currentTheme.fg} !important`
        },
        p: { color: `${currentTheme.fg} !important` },
        h1: { color: `${currentTheme.fg} !important` },
        h2: { color: `${currentTheme.fg} !important` },
        h3: { color: `${currentTheme.fg} !important` },
        a: { color: "#3b82f6 !important" },
      });
      rendition.themes.select("custom");
    }
  }, [rendition, fontSize, fontFamily, theme]);

  const next = useCallback(() => {
    if (rendition) rendition.next();
  }, [rendition]);

  const prev = useCallback(() => {
    if (rendition) rendition.prev();
  }, [rendition]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/50 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading amazing content...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-8 text-center bg-destructive/5 text-destructive">
          <AlertCircle className="h-12 w-12 mb-4 opacity-80" />
          <h3 className="font-serif text-xl font-bold mb-2">Error Loading Book</h3>
          <p className="max-w-md opacity-90">{error}</p>
        </div>
      )}

      {/* Main viewer container */}
      <div 
        ref={viewerRef} 
        className="w-full h-full max-w-4xl mx-auto px-4 sm:px-8 py-6 reader-page-transition"
        style={{ opacity: isLoading || error ? 0 : 1 }}
      />

      {/* Invisible overlay areas for tap-to-turn-page */}
      {!isLoading && !error && (
        <>
          <div 
            className="absolute left-0 top-0 w-1/4 h-full cursor-pointer z-20" 
            onClick={prev}
            aria-label="Previous Page"
          />
          <div 
            className="absolute right-0 top-0 w-1/4 h-full cursor-pointer z-20" 
            onClick={next}
            aria-label="Next Page"
          />
        </>
      )}
    </div>
  );
}
