"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Settings, Sun, Moon, Type, LayoutTemplate, Coffee, Laptop } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ReaderToolbarProps {
  visible: boolean;
  fontSize: number;
  setFontSizeAction: (v: number) => void;
  lineHeight: number;
  setLineHeightAction: (v: number) => void;
  fontFamily: string;
  setFontFamilyAction: (v: string) => void;
  theme: string;
  setThemeAction: (v: string) => void;
  marginSize: string;
  setMarginSizeAction: (v: string) => void;
}

export function ReaderToolbar({
  visible,
  fontSize,
  setFontSizeAction,
  lineHeight,
  setLineHeightAction,
  fontFamily,
  setFontFamilyAction,
  theme,
  setThemeAction,
  marginSize,
  setMarginSizeAction,
}: ReaderToolbarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-background/80 backdrop-blur-xl border border-border shadow-2xl rounded-full supports-[backdrop-filter]:bg-background/60"
        >
          {/* Typography Controls */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50 h-10 w-10">
                <Type className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 border-border shadow-2xl rounded-2xl mb-2" align="center" sideOffset={10}>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-foreground flex items-center justify-between">
                    Text Size
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{fontSize}px</span>
                  </h4>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">A</span>
                    <Slider
                      value={[fontSize]}
                      min={12}
                      max={32}
                      step={1}
                      onValueChange={(v) => setFontSizeAction(v[0])}
                      className="flex-1"
                    />
                    <span className="text-xl font-medium">A</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-foreground flex items-center justify-between">
                    Line Spacing
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{lineHeight}</span>
                  </h4>
                  <Slider
                    value={[lineHeight]}
                    min={1}
                    max={3}
                    step={0.1}
                    onValueChange={(v) => setLineHeightAction(v[0])}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-foreground">Font Family</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "serif", label: "Serif", cls: "font-serif" },
                      { id: "sans", label: "Sans", cls: "font-sans" },
                      { id: "mono", label: "Mono", cls: "font-mono" },
                    ].map((f) => (
                      <Button
                        key={f.id}
                        variant={fontFamily === f.id ? "default" : "outline"}
                        onClick={() => setFontFamilyAction(f.id)}
                        className={`w-full ${f.cls} ${fontFamily === f.id ? "shadow-md" : ""}`}
                        size="sm"
                      >
                        {f.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-foreground">Margins</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {["small", "medium", "large"].map((m) => (
                      <Button
                        key={m}
                        variant={marginSize === m ? "default" : "outline"}
                        onClick={() => setMarginSizeAction(m)}
                        className={`w-full capitalize ${marginSize === m ? "shadow-md" : ""}`}
                        size="sm"
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Theme Controls */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50 h-10 w-10">
                {theme === "light" ? <Sun className="h-5 w-5" /> : theme === "sepia" ? <Coffee className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 border-border shadow-2xl rounded-2xl mb-2" align="center" sideOffset={10}>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setThemeAction("light")}
                  className="w-full justify-start gap-2"
                >
                  <Sun className="h-4 w-4" /> Light
                </Button>
                <Button
                  variant={theme === "sepia" ? "default" : "outline"}
                  onClick={() => setThemeAction("sepia")}
                  className="w-full justify-start gap-2 bg-[#f4ecd8] text-[#4f4236] hover:bg-[#eaddc0] border-[#d8ccb8]"
                >
                  <Coffee className="h-4 w-4" /> Sepia
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setThemeAction("dark")}
                  className="w-full justify-start gap-2"
                >
                  <Moon className="h-4 w-4" /> Dark
                </Button>
                <Button
                  variant={theme === "oled" ? "default" : "outline"}
                  onClick={() => setThemeAction("oled")}
                  className="w-full justify-start gap-2 bg-black text-white hover:bg-zinc-900 border-zinc-800"
                >
                  <Moon className="h-4 w-4 fill-current" /> OLED
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setThemeAction("system")}
                  className="w-full col-span-2 justify-center gap-2"
                >
                  <Laptop className="h-4 w-4" /> System Default
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
        </motion.div>
      )}
    </AnimatePresence>
  );
}
