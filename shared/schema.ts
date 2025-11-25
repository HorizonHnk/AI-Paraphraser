import { z } from "zod";

export type ParaphraseMode = "standard" | "creative" | "formal" | "casual";

export const paraphraseRequestSchema = z.object({
  text: z.string().min(1, "Text is required").max(10000, "Text must be less than 10,000 characters"),
  mode: z.enum(["standard", "creative", "formal", "casual"]),
});

export type ParaphraseRequest = z.infer<typeof paraphraseRequestSchema>;

export interface ParaphraseResponse {
  originalText: string;
  paraphrasedText: string;
  mode: ParaphraseMode;
  originalWordCount: number;
  paraphrasedWordCount: number;
  originalCharCount: number;
  paraphrasedCharCount: number;
}

export const plagiarismCheckRequestSchema = z.object({
  text: z.string().min(10, "Text must be at least 10 characters").max(10000, "Text must be less than 10,000 characters"),
});

export type PlagiarismCheckRequest = z.infer<typeof plagiarismCheckRequestSchema>;

export interface FlaggedPassage {
  text: string;
  reason: string;
  severity: "low" | "medium" | "high";
}

export interface PlagiarismCheckResponse {
  originalityScore: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  flaggedPassages: FlaggedPassage[];
  recommendations: string[];
  aiContentProbability: number;
}

// History types
export interface HistoryItem {
  id: string;
  originalText: string;
  paraphrasedText: string;
  mode: ParaphraseMode;
  createdAt: string;
  wordCount: number;
}

// Grammar check types
export const grammarCheckRequestSchema = z.object({
  text: z.string().min(1, "Text is required").max(10000, "Text must be less than 10,000 characters"),
});

export type GrammarCheckRequest = z.infer<typeof grammarCheckRequestSchema>;

export interface GrammarIssue {
  text: string;
  suggestion: string;
  type: "spelling" | "grammar" | "punctuation" | "style";
  position: { start: number; end: number };
}

export interface GrammarCheckResponse {
  issues: GrammarIssue[];
  correctedText: string;
  score: number;
}

// Readability types
export interface ReadabilityScore {
  gradeLevel: number;
  readingLevel: string;
  fleschKincaid: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
}

// Batch processing types
export const batchParaphraseRequestSchema = z.object({
  texts: z.array(z.string().min(1).max(10000)).min(1).max(10),
  mode: z.enum(["standard", "creative", "formal", "casual"]),
});

export type BatchParaphraseRequest = z.infer<typeof batchParaphraseRequestSchema>;

export interface BatchParaphraseResponse {
  results: Array<{
    originalText: string;
    paraphrasedText: string;
    wordCount: number;
  }>;
  totalWordsProcessed: number;
}

// Usage tracking types
export interface UsageStats {
  wordsUsedToday: number;
  dailyLimit: number;
  resetTime: string;
}

// User model (existing)
export interface User {
  id: string;
  username: string;
}

export interface InsertUser {
  username: string;
}
