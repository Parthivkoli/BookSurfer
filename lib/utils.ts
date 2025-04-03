// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine class names using clsx and twMerge for Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Expanded stop words list for better filtering
const stopWords = new Set([
  "the", "is", "at", "which", "on", "and", "a", "an", "in", "to", "of", "for", "with", "as", "by", 
  "that", "it", "from", "or", "be", "was", "were", "are", "this", "these", "those", "i", "you", "he", 
  "she", "we", "they", "me", "him", "her", "us", "them", "am", "has", "have", "had", "do", "does", 
  "did", "will", "would", "should", "could", "can", "may", "might", "not", "no", "yes", "but", "so",
  "about", "above", "after", "again", "against", "all", "am", "any", "are", "because", "been", "before",
  "being", "below", "between", "both", "up", "down", "during", "each", "few", "more", "most", "other",
  "some", "such", "than", "too", "very", "just", "now", "also"
]);

/**
 * Splits text into sentences using a more robust approach
 * @param text - Text to split into sentences
 * @returns Array of sentences
 */
function splitIntoSentences(text: string): string[] {
  // Handle common abbreviations and edge cases
  const prepared = text
    .replace(/([.!?])\s*([A-Z])/g, "$1\n$2") // Add newlines after sentence terminators followed by capital letters
    .replace(/(\b(?:Mr|Mrs|Ms|Dr|Prof|Inc|Ltd|Sr|Jr|St|Ave|Blvd|Fig|et al|etc|vs|e\.g|i\.e)\.)(\s)/gi, "$1PRESERVED_SPACE") // Preserve common abbreviations
    .replace(/(\d+\.)(\s)/g, "$1PRESERVED_SPACE"); // Preserve numbered lists
  
  // Split by sentence-ending punctuation followed by whitespace
  const rawSentences = prepared.split(/(?<=[.!?])\s+/);
  
  // Restore preserved spaces and clean up sentences
  return rawSentences
    .map(s => s.replace(/PRESERVED_SPACE/g, " ").trim())
    .filter(s => s.length > 10); // Filter out very short fragments
}

/**
 * Calculate TF-IDF inspired scores for words in the text
 * @param sentences - Array of sentences from the text
 * @returns Object mapping words to their importance scores
 */
function calculateWordImportance(sentences: string[]): { [word: string]: number } {
  const wordFreq: { [word: string]: number } = {};
  const wordInSentences: { [word: string]: Set<number> } = {};
  
  // Count word occurrences and track which sentences contain each word
  sentences.forEach((sentence, sentIdx) => {
    const words = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    const seenWords = new Set<string>();
    
    words.forEach((word) => {
      if (!stopWords.has(word) && word.length > 2) {
        // Update word frequency
        wordFreq[word] = (wordFreq[word] || 0) + 1;
        
        // Track word appearing in this sentence (only count once per sentence)
        if (!seenWords.has(word)) {
          seenWords.add(word);
          if (!wordInSentences[word]) {
            wordInSentences[word] = new Set<number>();
          }
          wordInSentences[word].add(sentIdx);
        }
      }
    });
  });
  
  // Calculate TF-IDF inspired scores
  const wordImportance: { [word: string]: number } = {};
  const totalSentences = sentences.length;
  
  Object.keys(wordFreq).forEach((word) => {
    const tf = wordFreq[word];
    const sentenceCount = wordInSentences[word]?.size || 0;
    
    // Skip words that appear in too many sentences (likely common domain words)
    if (sentenceCount > totalSentences * 0.8) {
      wordImportance[word] = 0;
      return;
    }
    
    // TF-IDF inspired score: term frequency * log(total sentences / sentence frequency)
    const idf = Math.log(totalSentences / (sentenceCount || 1));
    wordImportance[word] = tf * idf;
  });
  
  return wordImportance;
}

/**
 * Calculate similarity between two sentences based on word overlap
 * @param s1 - First sentence
 * @param s2 - Second sentence
 * @returns Similarity score (0-1)
 */
function calculateSimilarity(s1: string, s2: string): number {
  const words1 = new Set(s1.toLowerCase().match(/\b\w+\b/g)?.filter(w => !stopWords.has(w)) || []);
  const words2 = new Set(s2.toLowerCase().match(/\b\w+\b/g)?.filter(w => !stopWords.has(w)) || []);
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  words1.forEach(word => {
    if (words2.has(word)) intersection++;
  });
  
  // Jaccard similarity
  return intersection / (words1.size + words2.size - intersection);
}

// Define sentence score interface to fix TypeScript error
interface SentenceScore {
  sentence: string;
  score: number;
  index: number;
  diversityScore?: number;
}

/**
 * Summarizes text content using an improved extraction method with TF-IDF and diversity.
 * @param content - The text to summarize (e.g., book content).
 * @param sentenceCount - Number of sentences to include in the summary (default: 5).
 * @param options - Additional options for summarization.
 * @returns A concise summary string.
 */
export function summarizeContent(
  content: string, 
  sentenceCount: number = 5,
  options: {
    diversityFactor?: number;  // How much to prioritize diversity (0-1, default 0.5)
    preferLocation?: 'start' | 'end' | 'none';  // Prefer sentences from start/end (default none)
  } = {}
): string {
  // Set default options
  const { diversityFactor = 0.5, preferLocation = 'none' } = options;
  
  // Handle edge cases
  if (!content || typeof content !== "string") {
    return "No content available to summarize.";
  }

  // Clean content by removing extra whitespace and HTML tags if present
  const cleanedContent = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

  // Split content into sentences using the improved function
  const sentences = splitIntoSentences(cleanedContent);
  if (sentences.length === 0) {
    return "No sentences found in the content.";
  }
  
  // If we need all sentences, just return the content
  if (sentenceCount >= sentences.length) {
    return cleanedContent;
  }

  // Calculate word importance using TF-IDF inspired approach
  const wordImportance = calculateWordImportance(sentences);

  // Initial scoring of sentences
  const initialScores: SentenceScore[] = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    
    // Calculate content score based on word importance
    const contentScore = words.reduce((score, word) => 
      score + (stopWords.has(word) ? 0 : (wordImportance[word] || 0)), 0);
    
    // Apply length normalization (prefer medium-length sentences)
    const wordCount = words.length;
    let lengthMultiplier = 1;
    if (wordCount < 5) lengthMultiplier = 0.7;  // Penalize very short sentences
    if (wordCount > 30) lengthMultiplier = 0.8;  // Slightly penalize very long sentences
    
    // Position bias based on preferLocation option
    let positionMultiplier = 1;
    if (preferLocation === 'start') {
      positionMultiplier = 1 - (index / sentences.length) * 0.5; // Higher score for early sentences
    } else if (preferLocation === 'end') {
      positionMultiplier = 0.5 + (index / sentences.length) * 0.5; // Higher score for later sentences
    }
    
    // Final score combines these factors
    const score = contentScore * lengthMultiplier * positionMultiplier;
    
    return { sentence, score, index };
  });

  // Greedy selection with diversity
  const selected: SentenceScore[] = [];
  const remainingCandidates: SentenceScore[] = [...initialScores].sort((a, b) => b.score - a.score);
  
  // Always select the highest scoring sentence first
  if (remainingCandidates.length > 0) {
    selected.push(remainingCandidates.shift()!);
  }
  
  // Select remaining sentences with diversity consideration
  while (selected.length < sentenceCount && remainingCandidates.length > 0) {
    // Recalculate scores based on diversity
    for (let i = 0; i < remainingCandidates.length; i++) {
      let diversityPenalty = 0;
      
      // Calculate similarity to already selected sentences
      for (const selectedItem of selected) {
        const similarity = calculateSimilarity(
          remainingCandidates[i].sentence,
          selectedItem.sentence
        );
        diversityPenalty += similarity;
      }
      
      // Apply diversity factor to penalize similar sentences
      const diversityScore = remainingCandidates[i].score * (1 - (diversityFactor * diversityPenalty / selected.length));
      remainingCandidates[i].diversityScore = diversityScore;
    }
    
    // Resort remaining candidates by diversity-adjusted score
    remainingCandidates.sort((a, b) => 
      (b.diversityScore || b.score) - (a.diversityScore || a.score)
    );
    
    // Select best candidate
    selected.push(remainingCandidates.shift()!);
  }
  
  // Sort selected sentences by original position to maintain narrative flow
  selected.sort((a, b) => a.index - b.index);
  
  // Join with proper spacing
  let summary = selected.map(item => item.sentence).join(" ").trim();
  
  // Ensure it ends with punctuation
  if (summary && !/[.!?]$/.test(summary)) {
    summary += ".";
  }

  return summary || "Unable to generate a summary.";
}

/**
 * Generates an improved answer to a question based on the content.
 * @param content - The text to search for an answer.
 * @param question - The user's question.
 * @param maxSentences - Maximum number of sentences in the answer (default: 3).
 * @returns A string answer derived from the content.
 */
export function generateAnswer(content: string, question: string, maxSentences: number = 3): string {
  // Handle edge cases
  if (!content || !question || typeof content !== "string" || typeof question !== "string") {
    return "Unable to generate an answer.";
  }

  // Clean content and split into sentences
  const cleanedContent = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const sentences = splitIntoSentences(cleanedContent);
  if (!sentences || sentences.length === 0) {
    return "No relevant information found.";
  }

  // Identify question type and relevant keywords
  const questionLower = question.toLowerCase();
  
  // Extract question type
  let questionType = "general";
  if (/\b(who|whom)\b/.test(questionLower)) questionType = "person";
  else if (/\b(when|what time|what date|what year|how long)\b/.test(questionLower)) questionType = "time";
  else if (/\b(where|location|place)\b/.test(questionLower)) questionType = "location";
  else if (/\b(why|reason|cause)\b/.test(questionLower)) questionType = "reason";
  else if (/\b(how|method|way)\b/.test(questionLower)) questionType = "method";
  else if (/\b(what is|what are|define|meaning of|definition)\b/.test(questionLower)) questionType = "definition";
  
  // Extract keywords from the question (exclude stop words)
  const questionWords = questionLower.match(/\b\w+\b/g) || [];
  const keywords = questionWords.filter(word => !stopWords.has(word) && word.length > 2);
  
  if (!keywords || keywords.length === 0) {
    return "Please provide a more specific question.";
  }

  // Score sentences based on keyword matches and question type match
  const sentenceScores: SentenceScore[] = sentences.map((sentence, index) => {
    const lowerSentence = sentence.toLowerCase();
    
    // Calculate basic keyword match score
    const keywordMatches = keywords.filter(keyword => lowerSentence.includes(keyword));
    const keywordMatchCount = keywordMatches.length;
    const keywordCoverage = keywordMatches.length / keywords.length;
    
    // Bonus for having multiple keywords in close proximity
    let proximityBonus = 0;
    if (keywordMatches.length >= 2) {
      // Simple heuristic: if sentence is relatively short and has multiple matches
      proximityBonus = 2 * (keywordMatches.length / Math.sqrt(sentence.length));
    }
    
    // Question type match bonus
    let typeMatchBonus = 0;
    switch (questionType) {
      case "person":
        if (/\b([A-Z][a-z]+ [A-Z][a-z]+|[A-Z][a-z]+)\b/.test(sentence)) typeMatchBonus = 2;
        break;
      case "time":
        if (/\b(\d{1,2}:\d{2}|\d{1,4}s?|January|February|March|April|May|June|July|August|September|October|November|December|today|yesterday|tomorrow|ago|since|before|after)\b/i.test(sentence)) typeMatchBonus = 2;
        break;
      case "location":
        if (/\b(in|at|on|near) (the )?[A-Z][a-z]+/.test(sentence)) typeMatchBonus = 2;
        break;
      case "reason":
        if (/\b(because|since|due to|therefore|thus|hence|reason|cause)\b/i.test(sentence)) typeMatchBonus = 2;
        break;
      case "method":
        if (/\b(by|through|using|with|method|approach|step|process)\b/i.test(sentence)) typeMatchBonus = 2;
        break;
      case "definition":
        if (/\b(is|are|refers to|defined as|means|consists of)\b/i.test(sentence)) typeMatchBonus = 2;
        break;
    }
    
    // Position bonus (slight preference for earlier sentences)
    const positionMultiplier = Math.max(0.8, 1 - (index / sentences.length) * 0.2);
    
    // Calculate final score
    const baseScore = keywordMatchCount * (1 + keywordCoverage);
    const finalScore = (baseScore + proximityBonus + typeMatchBonus) * positionMultiplier;
    
    return { 
      sentence: sentence.trim(), 
      score: finalScore,
      index
    };
  });

  // Select top-scoring sentences
  const topSentences = sentenceScores
    .filter((item) => item.score > 0) // Only sentences with matches
    .sort((a, b) => b.score - a.score) // Sort by score
    .slice(0, Math.min(maxSentences, sentences.length));
  
  // If no good matches, return default message
  if (topSentences.length === 0) {
    return "No relevant information found on this page.";
  }
  
  // For better readability, sort top sentences by their original position
  topSentences.sort((a, b) => a.index - b.index);
  
  // Generate answer
  let answer = topSentences.map(item => item.sentence).join(" ").trim();
  
  // Ensure proper punctuation
  if (!/[.!?]$/.test(answer)) {
    answer += ".";
  }

  return answer;
}