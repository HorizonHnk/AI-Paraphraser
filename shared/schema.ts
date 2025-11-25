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
