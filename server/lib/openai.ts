import OpenAI from "openai";
import type { ParaphraseMode } from "@shared/schema";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const MODE_PROMPTS: Record<ParaphraseMode, string> = {
  standard: `You are an expert content rewriter specializing in humanizing AI-generated text. Your task is to paraphrase the following text while:
- Making it sound natural and human-written
- Removing robotic or formulaic patterns typical of AI content
- Maintaining the original meaning and key information
- Using varied sentence structures and natural transitions
- Keeping a balanced, professional tone
- Avoiding overly complex vocabulary unless present in the original

Paraphrase this text:`,
  
  creative: `You are a creative writing expert specializing in transforming text into engaging, unique variations. Your task is to paraphrase the following text while:
- Adding creative flair and unique expressions
- Using vivid language and fresh perspectives
- Varying sentence lengths and structures dramatically
- Incorporating natural, conversational elements
- Making the content more engaging and memorable
- Maintaining the core message but with creative interpretation

Paraphrase this text:`,
  
  formal: `You are a professional business writer specializing in formal communication. Your task is to paraphrase the following text while:
- Using a professional, authoritative tone
- Employing formal vocabulary and sentence structures
- Maintaining objectivity and precision
- Using industry-standard terminology where appropriate
- Ensuring clarity and professionalism throughout
- Removing casual language and colloquialisms

Paraphrase this text:`,
  
  casual: `You are a conversational content expert specializing in friendly, approachable writing. Your task is to paraphrase the following text while:
- Using a warm, conversational tone
- Making it sound like a friendly explanation
- Including natural, everyday language
- Breaking down complex ideas into simple terms
- Adding relatable examples or comparisons when helpful
- Maintaining authenticity and approachability

Paraphrase this text:`
};

export async function paraphraseText(text: string, mode: ParaphraseMode): Promise<string> {
  try {
    const systemPrompt = MODE_PROMPTS[mode];
    
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: text
        }
      ],
      max_completion_tokens: 8192,
    });

    const paraphrasedText = response.choices[0]?.message?.content?.trim();
    
    if (!paraphrasedText) {
      throw new Error("No paraphrased text returned from AI");
    }

    return paraphrasedText;
  } catch (error: any) {
    console.error("Error paraphrasing text:", error);
    throw new Error(error.message || "Failed to paraphrase text");
  }
}

// Helper function to count words
export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
