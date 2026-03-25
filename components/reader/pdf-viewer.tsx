"use client";

import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Set worker path (ensure this points to a valid public URL or CDN in production)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string | ArrayBuffer;
  onPageChange?: (page: number) => void;
  theme?: string; // High contrast options can be applied via CSS filters
}

export function PdfViewer({ url, onPageChange, theme = "light" }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [isRenderPending, setIsRenderPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load PDF Document
  useEffect(() => {
    let currentDoc: pdfjsLib.PDFDocumentProxy | null = null;
    setIsLoading(true);
    setError(null);

    const loadDoc = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        currentDoc = await loadingTask.promise;
        setPdfDoc(currentDoc);
        setNumPages(currentDoc.numPages);
        setPageNum(1); // Reset to first page
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load PDF:", err);
        setError("Could not load PDF. It might be corrupted or in an unsupported format.");
        setIsLoading(false);
      }
    };

    if (url) loadDoc();
    
    return () => {
      if (currentDoc) currentDoc.destroy();
    };
  }, [url]);

  // Render Page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
    
    setIsRenderPending(true);
    let renderTask: pdfjsLib.RenderTask | null = null;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Calculate scale to fit container width
        if (!containerRef.current) return;
        const containerWidth = containerRef.current.clientWidth - 32; // padding
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / unscaledViewport.width;
        
        const viewport = page.getViewport({ scale: Math.min(scale, 2.5) }); // Cap max scale

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
        
        setIsRenderPending(false);
        if (onPageChange) onPageChange(pageNum);
        
      } catch (err) {
        // Ignore "Rendering cancelled" error as it's expected during rapid page turns
        if ((err as Error).name !== "RenderingCancelledException") {
          console.error("Error rendering PDF page:", err);
        }
      }
    };

    renderPage();
    
    return () => {
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDoc, pageNum, containerRef, canvasRef, onPageChange]);

  const onPrevPage = () => {
    if (pageNum <= 1) return;
    setPageNum((prev) => prev - 1);
  };

  const onNextPage = () => {
    if (pageNum >= numPages) return;
    setPageNum((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/50 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading PDF document...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-8 text-center bg-destructive/5 text-destructive">
          <AlertCircle className="h-12 w-12 mb-4 opacity-80" />
          <h3 className="font-serif text-xl font-bold mb-2">Error Loading PDF</h3>
          <p className="max-w-md opacity-90">{error}</p>
        </div>
      )}

      {/* Full-width container */}
      <div 
        ref={containerRef} 
        className={`flex-1 overflow-auto flex items-start justify-center p-4 transition-colors duration-300 ${
          theme === "dark" || theme === "oled" ? "bg-black/90" : "bg-muted/30"
        }`}
      >
        <div className={`relative shadow-2xl transition-opacity duration-300 ${isRenderPending ? 'opacity-60' : 'opacity-100'} ${theme === 'dark' || theme === 'oled' ? 'invert hue-rotate-180 brightness-90 contrast-90' : ''}`}>
          <canvas ref={canvasRef} className="max-w-full h-auto bg-white rounded-md" />
        </div>
      </div>

      {/* PDF Controls Strip */}
      {!isLoading && !error && numPages > 0 && (
        <div className="h-14 bg-card border-t border-border flex items-center justify-between px-6 z-20">
          <Button 
            variant="ghost" 
            onClick={onPrevPage} 
            disabled={pageNum <= 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          
          <div className="text-sm font-medium font-sans text-muted-foreground bg-muted px-4 py-1.5 rounded-full">
            Page {pageNum} of {numPages}
          </div>
          
          <Button 
            variant="ghost" 
            onClick={onNextPage} 
            disabled={pageNum >= numPages}
            className="flex items-center gap-2"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
