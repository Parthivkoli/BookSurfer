export interface TextStats {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
  readingLevel: string;
  fleschKincaidScore: number;
  sentiment: "Positive" | "Neutral" | "Negative" | "Mixed";
}

/**
 * Calculates generic text statistics for a given text
 */
export function calculateTextStats(text: string): TextStats {
  if (!text || text.trim() === "") {
    return {
      wordCount: 0,
      characterCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      readingTimeMinutes: 0,
      readingLevel: "Unknown",
      fleschKincaidScore: 0,
      sentiment: "Neutral",
    };
  }

  const cleanText = text.trim();
  
  // Basic counts
  const characterCount = cleanText.length;
  const words = cleanText.match(/\b\w+\b/g) || [];
  const wordCount = words.length;
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;
  const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length || 1;

  // Reading time (average adult reads ~250 words per minute)
  const readingTimeMinutes = Math.ceil(wordCount / 250);

  // Approximate syllable count (heuristic)
  let syllableCount = 0;
  words.forEach(word => {
    word = word.toLowerCase();
    if (word.length <= 3) {
      syllableCount += 1;
      return;
    }
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    syllableCount += syllables ? syllables.length : 1;
  });

  // Calculate Flesch Reading Ease Score
  // Score = 206.835 - 1.015 * (Total Words / Total Sentences) - 84.6 * (Total Syllables / Total Words)
  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / (wordCount || 1);
  
  let fleschKincaidScore = 206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord);
  fleschKincaidScore = Math.max(0, Math.min(100, Math.round(fleschKincaidScore * 10) / 10));

  // Map to Reading Level
  let readingLevel = "Unknown";
  if (fleschKincaidScore >= 90) readingLevel = "5th Grade (Very Easy)";
  else if (fleschKincaidScore >= 80) readingLevel = "6th Grade (Easy)";
  else if (fleschKincaidScore >= 70) readingLevel = "7th Grade (Fairly Easy)";
  else if (fleschKincaidScore >= 60) readingLevel = "8th-9th Grade (Standard)";
  else if (fleschKincaidScore >= 50) readingLevel = "10th-12th Grade (Fairly Difficult)";
  else if (fleschKincaidScore >= 30) readingLevel = "College Student (Difficult)";
  else readingLevel = "College Graduate (Very Difficult)";

  // Basic sentiment analysis heuristic
  const positiveWords = new Set(["good", "great", "excellent", "happy", "joy", "love", "wonderful", "fantastic", "success", "beautiful", "amazing", "best"]);
  const negativeWords = new Set(["bad", "terrible", "awful", "sad", "hate", "angry", "worst", "fail", "pain", "poor", "dark", "death"]);
  
  let posCount = 0;
  let negCount = 0;
  
  words.forEach(w => {
    const word = w.toLowerCase();
    if (positiveWords.has(word)) posCount++;
    if (negativeWords.has(word)) negCount++;
  });

  let sentiment: TextStats["sentiment"] = "Neutral";
  if (posCount > negCount * 1.5) sentiment = "Positive";
  else if (negCount > posCount * 1.5) sentiment = "Negative";
  else if (posCount > 0 && negCount > 0) sentiment = "Mixed";

  return {
    wordCount,
    characterCount,
    sentenceCount,
    paragraphCount,
    readingTimeMinutes,
    readingLevel,
    fleschKincaidScore,
    sentiment,
  };
}
