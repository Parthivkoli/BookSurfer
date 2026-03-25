"use server";

// lib/ai/hf.ts
// Hugging Face Inference API wrapper using Next.js Server Actions

const HF_TOKEN = process.env.HF_TOKEN;

/**
 * Summarize text using facebook/bart-large-cnn
 */
export async function summarizeWithHF(text: string): Promise<string> {
  if (!text || text.length < 50) return "Text too short to summarize.";
  
  // Truncate to reasonable length for BART to avoid token limits
  const truncatedText = text.substring(0, 3000);

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: truncatedText,
          parameters: {
            max_length: 150,
            min_length: 40,
            do_sample: false
          }
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 503) {
        throw new Error("Model is loading. Please try again in a moment.");
      }
      throw new Error(`Hugging Face API Error: ${response.statusText}`);
    }

    const result = await response.json();
    if (result && result[0] && result[0].summary_text) {
      return result[0].summary_text;
    }
    
    throw new Error("Unexpected response format from Hugging Face.");
  } catch (error: any) {
    console.error("HF Summarization error:", error);
    throw new Error(error.message || "Failed to generate summary.");
  }
}

/**
 * Q&A using deepset/roberta-base-squad2
 */
export async function answerQuestionWithHF(question: string, context: string): Promise<string> {
  if (!question || !context) return "Question and context are required.";

  // Truncate context to RoBERTa context window limit (~512 tokens, ~2000 chars)
  const truncatedContext = context.substring(0, 2000);

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2",
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: {
            question,
            context: truncatedContext
          }
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 503) {
        throw new Error("Model is loading. Please try again in a moment.");
      }
      throw new Error(`Hugging Face API Error: ${response.statusText}`);
    }

    const result = await response.json();
    // result expected: { answer: "...", score: 0.9, start: 10, end: 20 }
    if (result && result.answer) {
      // Format with high confidence
      if (result.score < 0.1) {
        return "I'm not completely sure, but it might be related to: " + result.answer;
      }
      return result.answer.charAt(0).toUpperCase() + result.answer.slice(1) + ".";
    }
    
    throw new Error("Could not find a clear answer in the provided text.");
  } catch (error: any) {
    console.error("HF Q&A error:", error);
    throw new Error(error.message || "Failed to answer question.");
  }
}
