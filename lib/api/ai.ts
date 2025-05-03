import { Book } from "@/types/book";

// Common English stop words to filter out
const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'i', 'you', 'they', 'we', 'my', 'your', 'his', 'her', 'their',
  'our', 'this', 'that', 'these', 'those', 'am', 'been', 'being', 'have', 'had',
  'has', 'having', 'do', 'does', 'did', 'doing', 'would', 'should', 'could',
  'ought', 'i\'m', 'you\'re', 'he\'s', 'she\'s', 'it\'s', 'we\'re', 'they\'re',
  'i\'ve', 'you\'ve', 'we\'ve', 'they\'ve', 'i\'d', 'you\'d', 'he\'d', 'she\'d',
  'we\'d', 'they\'d', 'i\'ll', 'you\'ll', 'he\'ll', 'she\'ll', 'we\'ll', 'they\'ll',
  'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t', 'hasn\'t', 'haven\'t', 'hadn\'t',
  'doesn\'t', 'don\'t', 'didn\'t', 'won\'t', 'wouldn\'t', 'shan\'t', 'shouldn\'t',
  'can\'t', 'cannot', 'couldn\'t', 'mustn\'t', 'let\'s', 'that\'s', 'who\'s',
  'what\'s', 'here\'s', 'there\'s', 'when\'s', 'where\'s', 'why\'s', 'how\'s'
]);

// Mock book content for demo purposes
const SAMPLE_BOOK_CONTENT = `
Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.

In another moment down went Alice after it, never once considering how in the world she was to get out again.

The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.

Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled "ORANGE MARMALADE", but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody underneath, so managed to put it into one of the cupboards as she fell past it.
`;

// More sample content for different books
const BOOK_CONTENT_SAMPLES: Record<string, string> = {
  "gutenberg-11": SAMPLE_BOOK_CONTENT, // Alice in Wonderland
  "gutenberg-84": `
Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people's hats off—then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.

There now is your insular city of the Manhattoes, belted round by wharves as Indian isles by coral reefs—commerce surrounds it with her surf. Right and left, the streets take you waterward. Its extreme downtown is the battery, where that noble mole is washed by waves, and cooled by breezes, which a few hours previous were out of sight of land. Look at the crowds of water-gazers there.

Circumambulate the city of a dreamy Sabbath afternoon. Go from Corlears Hook to Coenties Slip, and from thence, by Whitehall, northward. What do you see?—Posted like silent sentinels all around the town, stand thousands upon thousands of mortal men fixed in ocean reveries. Some leaning against the spiles; some seated upon the pier-heads; some looking over the bulwarks of ships from China; some high aloft in the rigging, as if striving to get a still better seaward peep. But these are all landsmen; of week days pent up in lath and plaster—tied to counters, nailed to benches, clinched to desks. How then is this? Are the green fields gone? What do they here?
  `, // Moby Dick
  "gutenberg-1342": `
It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.

However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.

"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"

Mr. Bennet replied that he had not.

"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."

Mr. Bennet made no answer.

"Do you not want to know who has taken it?" cried his wife impatiently.

"You want to tell me, and I have no objection to hearing it."

This was invitation enough.

"Why, my dear, you must know, Mrs. Long says that Netherfield is taken by a young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place, and was so much delighted with it, that he agreed with Mr. Morris immediately; that he is to take possession before Michaelmas, and some of his servants are to be in the house by the end of next week."

"What is his name?"

"Bingley."

"Is he married or single?"

"Oh! Single, my dear, to be sure! A single man of large fortune; four or five thousand a year. What a fine thing for our girls!"

"How so? How can it affect them?"

"My dear Mr. Bennet," replied his wife, "how can you be so tiresome! You must know that I am thinking of his marrying one of them."

"Is that his design in settling here?"

"Design! Nonsense, how can you talk so! But it is very likely that he may fall in love with one of them, and therefore you must visit him as soon as he comes."
  `, // Pride and Prejudice
};

/**
 * Fetch book content from API or use sample data for demo
 */
export async function getBookContent(bookId: string): Promise<string> {
  // In a real application, this would fetch the actual book content from an API
  // For demo purposes, we'll return sample content
  
  // Check if we have a sample for this book ID
  if (BOOK_CONTENT_SAMPLES[bookId]) {
    return BOOK_CONTENT_SAMPLES[bookId];
  }
  
  // If no specific sample, return the default sample
  return SAMPLE_BOOK_CONTENT;
}

/**
 * Generate a summary of the provided content using AI
 */
export async function summarizeContent(bookTitle: string, content: string): Promise<string> {
  // In a real application, this would call an AI API like OpenAI
  // For demo purposes, we'll simulate a delay and return a mock summary
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate a mock summary based on the content
  if (content.includes("Alice")) {
    return "In this section, Alice is sitting by a riverbank with her sister when she spots a White Rabbit with a pocket watch. Curious, she follows the rabbit down a hole, which leads to a long fall. During her descent, she observes cupboards and bookshelves lining the walls of the well, suggesting she's entering a strange and fantastical world.";
  } else if (content.includes("Ishmael")) {
    return "The narrator, Ishmael, introduces himself and explains his desire to go to sea whenever he feels depressed or confined by society. He views sailing as a way to escape suicidal thoughts and reconnect with the world. He observes how many people in Manhattan are drawn to the water, suggesting a universal human connection to the sea.";
  } else if (content.includes("Bennet")) {
    return "The opening introduces the Bennet family and establishes the central theme of marriage prospects. Mrs. Bennet is excited about a wealthy bachelor named Bingley who has moved to Netherfield Park, viewing him as a potential husband for one of her daughters. Mr. Bennet responds with dry wit to his wife's enthusiasm, establishing their contrasting personalities.";
  } else {
    // Generic summary for other content
    return "This section introduces key characters and sets the stage for upcoming events. The narrative establishes the setting and begins to develop the main themes that will be explored throughout the book. Character motivations are subtly revealed through dialogue and description.";
  }
}

/**
 * Generate an AI response to a question about the book
 */
export async function generateAIResponse(
  bookTitle: string,
  content: string,
  question: string,
  context: {
    currentChapter?: string;
    previousContent?: string;
    bookMetadata?: {
      author?: string;
      genre?: string[];
      themes?: string[];
    };
  } = {}
): Promise<string> {
  // Clean and normalize inputs
  const cleanContent = content.toLowerCase().replace(/[^\w\s]/g, ' ');
  const cleanQuestion = question.toLowerCase().trim();
  
  // Identify question type
  const questionTypes = {
    what: cleanQuestion.includes('what'),
    who: cleanQuestion.includes('who'),
    why: cleanQuestion.includes('why'),
    how: cleanQuestion.includes('how'),
    when: cleanQuestion.includes('when'),
    where: cleanQuestion.includes('where'),
    theme: cleanQuestion.includes('theme') || cleanQuestion.includes('meaning'),
    character: cleanQuestion.includes('character') || cleanQuestion.includes('protagonist'),
    summary: cleanQuestion.includes('summarize') || cleanQuestion.includes('summary'),
    analysis: cleanQuestion.includes('analyze') || cleanQuestion.includes('analysis')
  };
  
  // Extract key terms from the question, excluding question words
  const questionTerms = cleanQuestion
    .split(/\s+/)
    .filter(term => 
      term.length > 2 && 
      !stopWords.has(term) && 
      !['what', 'who', 'why', 'how', 'when', 'where'].includes(term)
    );
  
  // Split content into paragraphs and sentences
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  
  // Score sentences based on multiple factors
  const scoredSentences = sentences.map(sentence => {
    const cleanSentence = sentence.toLowerCase().replace(/[^\w\s]/g, ' ');
    let score = 0;
    
    // Term matching with proximity bonus
    questionTerms.forEach(term => {
      if (cleanSentence.includes(term)) {
        score += 2;
        // Boost score if terms appear close together
        const termPositions = questionTerms
          .filter(t => cleanSentence.includes(t))
          .map(t => cleanSentence.indexOf(t));
        if (termPositions.length > 1) {
          const maxDistance = Math.max(...termPositions) - Math.min(...termPositions);
          score += 1 / (maxDistance + 1) * 2;
        }
      }
    });
    
    // Context-based scoring
    if (context.currentChapter) {
      const chapterTerms = context.currentChapter.toLowerCase().split(/\s+/);
      chapterTerms.forEach(term => {
        if (cleanSentence.includes(term) && term.length > 3) score += 0.5;
      });
    }
    
    // Theme and genre scoring
    if (context.bookMetadata?.themes) {
      context.bookMetadata.themes.forEach(theme => {
        const themeTerms = theme.toLowerCase().split(/\s+/);
        themeTerms.forEach(term => {
          if (cleanSentence.includes(term) && term.length > 3) score += 1.5;
        });
      });
    }
    
    if (context.bookMetadata?.genre) {
      context.bookMetadata.genre.forEach(genre => {
        const genreTerms = genre.toLowerCase().split(/\s+/);
        genreTerms.forEach(term => {
          if (cleanSentence.includes(term) && term.length > 3) score += 1;
        });
      });
    }
    
    // Question type specific scoring
    if (questionTypes.character && 
        /\b[A-Z][a-z]+\b/.test(sentence)) score += 1.5; // Proper nouns for character questions
    if (questionTypes.theme && 
        context.bookMetadata?.themes?.some(theme => 
          cleanSentence.includes(theme.toLowerCase())
        )) score += 2;
    if (questionTypes.where && 
        /\b(at|in|on|near|by)\b.*\b[A-Z][a-z]+\b/.test(sentence)) score += 1.5; // Location descriptions
    
    // Consider surrounding context
    const sentenceIndex = sentences.indexOf(sentence);
    const hasContext = sentenceIndex > 0 && sentenceIndex < sentences.length - 1;
    if (hasContext) score += 0.5;
    
    return { sentence, score, index: sentenceIndex };
  });
  
  // Sort sentences by score and select top relevant ones
  scoredSentences.sort((a, b) => b.score - a.score);
  let relevantSentences = scoredSentences
    .slice(0, 3)
    .sort((a, b) => a.index - b.index) // Restore original order
    .map(s => s.sentence.trim());
  
  // If no good matches found
  if (relevantSentences.length === 0 || scoredSentences[0].score < 1) {
    if (questionTypes.theme && context.bookMetadata?.themes) {
      return `While I don't find a direct discussion of themes in this section, this book explores themes like ${context.bookMetadata.themes.join(', ')}. You might want to read further to see how these themes develop.`;
    }
    return "I don't find a direct answer to your question in the current section. Try rephrasing your question or checking other parts of the book.";
  }
  
  // Construct a natural response
  let response = '';
  
  // Add context about location in book
  if (context.currentChapter) {
    response += `In ${context.currentChapter}, `;
  }
  
  // Handle different question types
  if (questionTypes.summary) {
    response += relevantSentences.join(' ');
  } else if (questionTypes.theme) {
    response += `This passage explores ${context.bookMetadata?.themes?.[0] || 'themes'} through the following: ${relevantSentences.join(' ')}`;
  } else if (questionTypes.character) {
    response += `The character is shown in the following context: ${relevantSentences.join(' ')}`;
  } else if (questionTypes.analysis) {
    response += `Analyzing this section: ${relevantSentences.join(' ')} `;
    if (context.bookMetadata?.themes) {
      response += `This connects to the theme of ${context.bookMetadata.themes[0]}.`;
    }
  } else {
    response += relevantSentences.join(' ');
  }
  
  // Add genre context if relevant
  if (context.bookMetadata?.genre && questionTypes.analysis) {
    response += ` As a ${context.bookMetadata.genre[0]} work, this passage is particularly significant.`;
  }
  
  return response;
}

/**
 * Get AI-powered book recommendations based on reading history
 */
export async function getAIRecommendations(readBooks: string[]): Promise<Book[]> {
  // In a real application, this would call an AI API for personalized recommendations
  // For demo purposes, we'll return mock recommendations
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock recommendations
  return [
    {
      id: "gutenberg-11",
      title: "Alice's Adventures in Wonderland",
      authors: ["Lewis Carroll"],
      coverImage: "https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg",
      description: "A young girl named Alice falls through a rabbit hole into a fantasy world populated by peculiar creatures.",
      publishedDate: "1865",
      categories: ["Fiction", "Fantasy", "Children's Literature"],
      language: ["en"],
      pageCount: 144,
      source: "gutenberg",
      downloadUrl: "https://www.gutenberg.org/ebooks/11",
      rating: 4.5,
    },
    {
      id: "gutenberg-84",
      title: "Frankenstein; Or, The Modern Prometheus",
      authors: ["Mary Wollstonecraft Shelley"],
      coverImage: "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg",
      description: "A scientist creates a sapient creature in an unorthodox scientific experiment.",
      publishedDate: "1818",
      categories: ["Fiction", "Gothic", "Science Fiction"],
      language: ["en"],
      pageCount: 280,
      source: "gutenberg",
      downloadUrl: "https://www.gutenberg.org/ebooks/84",
      rating: 4.3,
    },
    {
      id: "gutenberg-1342",
      title: "Pride and Prejudice",
      authors: ["Jane Austen"],
      coverImage: "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
      description: "The story follows the main character Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage.",
      publishedDate: "1813",
      categories: ["Fiction", "Romance", "Classic"],
      language: ["en"],
      pageCount: 432,
      source: "gutenberg",
      downloadUrl: "https://www.gutenberg.org/ebooks/1342",
      rating: 4.7,
    },
  ];
}