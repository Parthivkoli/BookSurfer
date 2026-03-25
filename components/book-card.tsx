'use client';

import Image from "next/image";
import Link from "next/link";
import { Book as BookType } from "@/types/book";
import { BookOpen, Star } from "lucide-react";
import { motion } from "framer-motion";

interface BookCardProps {
  book: BookType;
  index?: number;
  priority?: boolean;
}

export function BookCard({ book, index = 0, priority = false }: BookCardProps) {
  return (
    <Link href={`/reader/${book.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{
          y: -8,
          transition: { duration: 0.2 },
        }}
        className="group h-full bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-border flex flex-col relative"
      >
        <div className="aspect-[2/3] bg-muted relative overflow-hidden flex-shrink-0">
          {book.coverImage ? (
            <>
              <Image
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={priority}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground font-medium px-4 text-center">No Cover Available</span>
            </div>
          )}
          
          {/* Top Rating Badge */}
          {(book.rating ?? 0) > 0 && (
            <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-md text-primary-foreground px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg border border-primary/20">
              <Star className="h-3 w-3 fill-current" />
              {book.rating?.toFixed(1)}
            </div>
          )}

          {/* Hover "Read Now" button overlay */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          >
            <span className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-6 rounded-full shadow-xl transform transition-transform duration-200">
              Read Now
            </span>
          </motion.div>
        </div>

        <div className="p-4 flex flex-col flex-1 justify-between bg-card z-20">
          <div>
            <h3 className="font-serif font-bold text-lg mb-1 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <p className="text-sm text-muted-foreground font-sans line-clamp-1 mb-2">
              {book.authors?.[0] ?? book.author ?? "Unknown Author"}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
            <span className="text-xs font-medium text-muted-foreground capitalize">
              {book.source || "Library"}
            </span>
            {book.pageCount && (
              <span className="text-xs text-muted-foreground">
                {book.pageCount} pages
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
