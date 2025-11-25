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

export interface PlagiarismAnalysis {
  originalityScore: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  flaggedPassages: Array<{
    text: string;
    reason: string;
    severity: "low" | "medium" | "high";
  }>;
  recommendations: string[];
  aiContentProbability: number;
}

// Grammar check interface
export interface GrammarAnalysis {
  issues: Array<{
    text: string;
    suggestion: string;
    type: "spelling" | "grammar" | "punctuation" | "style";
    position: { start: number; end: number };
  }>;
  correctedText: string;
  score: number;
}

export async function checkGrammar(text: string): Promise<GrammarAnalysis> {
  try {
    const systemPrompt = `You are an expert grammar, spelling, and style checker. Analyze the provided text and return a detailed JSON assessment.

Your analysis should:
1. Identify all grammar errors
2. Find spelling mistakes
3. Detect punctuation issues
4. Suggest style improvements

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "issues": [
    {
      "text": "<the problematic text>",
      "suggestion": "<the correction>",
      "type": "<'spelling' | 'grammar' | 'punctuation' | 'style'>",
      "position": { "start": <character index>, "end": <character index> }
    }
  ],
  "correctedText": "<the full text with all corrections applied>",
  "score": <number 0-100, where 100 is perfect grammar>
}

Be thorough but practical. Focus on actual errors, not stylistic preferences unless they significantly impact readability.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Check the grammar and spelling in this text:\n\n${text}`
        }
      ],
      max_completion_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error("No analysis returned from AI");
    }

    let cleanedContent = content;
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.slice(7);
    }
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith("```")) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    const analysis = JSON.parse(cleanedContent) as GrammarAnalysis;
    
    return {
      issues: Array.isArray(analysis.issues) ? analysis.issues : [],
      correctedText: analysis.correctedText || text,
      score: Math.max(0, Math.min(100, analysis.score || 100)),
    };
  } catch (error: any) {
    console.error("Error checking grammar:", error);
    throw new Error(error.message || "Failed to check grammar");
  }
}

export async function checkPlagiarism(text: string): Promise<PlagiarismAnalysis> {
  try {
    const systemPrompt = `You are an expert plagiarism and content originality analyzer. Analyze the provided text and return a detailed JSON assessment.

Your analysis should evaluate:
1. **Originality**: Look for commonly used phrases, clichés, generic statements, and content that appears templated or commonly found online.
2. **AI-Generated Content Detection**: Identify patterns typical of AI-written text such as:
   - Overly formal or robotic language
   - Repetitive sentence structures
   - Lack of personal voice or unique perspective
   - Generic transitional phrases
   - Perfect grammar with no stylistic quirks
3. **Potential Copied Content**: Flag any passages that seem like they could be directly copied or closely paraphrased from common sources.

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "originalityScore": <number 0-100, where 100 is completely original>,
  "riskLevel": "<'low' | 'medium' | 'high'>",
  "summary": "<brief 1-2 sentence summary of findings>",
  "flaggedPassages": [
    {
      "text": "<exact text passage that is flagged>",
      "reason": "<why this passage is flagged>",
      "severity": "<'low' | 'medium' | 'high'>"
    }
  ],
  "recommendations": ["<actionable recommendation 1>", "<recommendation 2>"],
  "aiContentProbability": <number 0-100, likelihood this is AI-generated>
}

Risk level guidelines:
- "low": originalityScore >= 70, minimal concerns
- "medium": originalityScore 40-69, some issues detected
- "high": originalityScore < 40, significant concerns

Be thorough but fair in your analysis. Not all common phrases indicate plagiarism.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Analyze this text for plagiarism and originality:\n\n${text}`
        }
      ],
      max_completion_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error("No analysis returned from AI");
    }

    // Clean up potential JSON formatting issues
    let cleanedContent = content;
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.slice(7);
    }
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith("```")) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    const analysis = JSON.parse(cleanedContent) as PlagiarismAnalysis;
    
    // Validate and normalize the response
    return {
      originalityScore: Math.max(0, Math.min(100, analysis.originalityScore || 50)),
      riskLevel: ["low", "medium", "high"].includes(analysis.riskLevel) ? analysis.riskLevel : "medium",
      summary: analysis.summary || "Analysis complete.",
      flaggedPassages: Array.isArray(analysis.flaggedPassages) ? analysis.flaggedPassages : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
      aiContentProbability: Math.max(0, Math.min(100, analysis.aiContentProbability || 50)),
    };
  } catch (error: any) {
    console.error("Error checking plagiarism:", error);
    throw new Error(error.message || "Failed to analyze text for plagiarism");
  }
}
