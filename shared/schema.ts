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
