// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine class names using clsx and twMerge for Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Common stop words to exclude from frequency scoring (expanded for better filtering)
const stopWords = new Set([
  "the", "is", "at", "which", "on", "and", "a", "an", "in", "to", "of", "for", "with", "as", "by", 
  "that", "it", "from", "or", "be", "was", "were", "are", "this", "these", "those", "i", "you", "he", 
  "she", "we", "they", "me", "him", "her", "us", "them", "am", "has", "have", "had", "do", "does", 
  "did", "will", "would", "should", "could", "can", "may", "might", "not", "no", "yes", "but", "so"
]);

/**
 * Summarizes text content using an improved extractive, frequency-based method.
 * @param content - The text to summarize (e.g., book content).
 * @param sentenceCount - Number of sentences to include in the summary (default: 5).
 * @returns A concise summary string.
 */
export function summarizeContent(content: string, sentenceCount: number = 5): string {
  // Handle edge cases
  if (!content || typeof content !== "string") {
    return "No content available to summarize.";
  }

  // Clean content by removing extra whitespace and HTML tags if present
  const cleanedContent = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

  // Split content into sentences using a more robust regex
  const sentences = cleanedContent.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [];
  if (sentences.length === 0) {
    return "No sentences found in the content.";
  }

  // Calculate word frequencies (excluding stop words)
  const wordFrequency: { [word: string]: number } = {};
  sentences.forEach((sentence) => {
    const words = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    words.forEach((word) => {
      if (!stopWords.has(word) && word.length > 2) { // Exclude short words
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });
  });

  // Score each sentence based on word frequency and length penalty
  const sentenceScores = sentences.map((sentence) => {
    const words = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    const freqScore = words.reduce((acc, word) => acc + (wordFrequency[word] || 0), 0);
    const lengthPenalty = Math.min(1, 10 / words.length); // Penalize very short sentences
    const score = freqScore * lengthPenalty;
    return { sentence: sentence.trim(), score };
  });

  // Sort sentences by score and select the top ones
  const topSentences = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(sentenceCount, sentences.length))
    .map((item) => item.sentence);

  // Join with proper spacing and ensure it ends with punctuation
  let summary = topSentences.join(" ").trim();
  if (summary && !/[.!?]$/.test(summary)) {
    summary += ".";
  }

  return summary || "Unable to generate a summary.";
}

/**
 * Generates a simple answer to a question based on the content using keyword matching.
 * @param content - The text to search for an answer (e.g., current page content).
 * @param question - The user’s question.
 * @param maxSentences - Maximum number of sentences in the answer (default: 2).
 * @returns A string answer derived from the content.
 */
export function generateAnswer(content: string, question: string, maxSentences: number = 2): string {
  // Handle edge cases
  if (!content || !question || typeof content !== "string" || typeof question !== "string") {
    return "Unable to generate an answer.";
  }

  // Clean content and split into sentences
  const cleanedContent = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const sentences = cleanedContent.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [];
  if (sentences.length === 0) {
    return "No relevant information found.";
  }

  // Extract keywords from the question (exclude stop words)
  const keywords = question
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => !stopWords.has(word) && word.length > 2);

  if (keywords.length === 0) {
    return "Please provide a more specific question.";
  }

  // Score sentences based on keyword matches
  const sentenceScores = sentences.map((sentence) => {
    const lowerSentence = sentence.toLowerCase();
    const matchCount = keywords.reduce((acc, keyword) => 
      acc + (lowerSentence.includes(keyword) ? 1 : 0), 0);
    return { sentence: sentence.trim(), score: matchCount };
  });

  // Select top-scoring sentences
  const topSentences = sentenceScores
    .filter((item) => item.score > 0) // Only sentences with matches
    .sort((a, b) => b.score - a.score || a.sentence.length - b.sentence.length) // Tiebreaker: longer sentences
    .slice(0, Math.min(maxSentences, sentences.length))
    .map((item) => item.sentence);

  // Generate answer
  let answer = topSentences.join(" ").trim();
  if (!answer) {
    return "No relevant information found on this page.";
  }
  if (!/[.!?]$/.test(answer)) {
    answer += ".";
  }

  return answer;
}