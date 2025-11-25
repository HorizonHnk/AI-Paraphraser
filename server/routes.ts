import type { Express } from "express";
import { createServer, type Server } from "http";
import { paraphraseRequestSchema, plagiarismCheckRequestSchema, type ParaphraseResponse, type PlagiarismCheckResponse } from "@shared/schema";
import { paraphraseText, countWords, checkPlagiarism } from "./lib/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Paraphrase endpoint
  app.post("/api/paraphrase", async (req, res) => {
    try {
      // Validate request body
      const validation = paraphraseRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.errors 
        });
      }

      const { text, mode } = validation.data;

      // Paraphrase the text using OpenAI
      const paraphrasedText = await paraphraseText(text, mode);

      // Prepare response with statistics
      const response: ParaphraseResponse = {
        originalText: text,
        paraphrasedText,
        mode,
        originalWordCount: countWords(text),
        paraphrasedWordCount: countWords(paraphrasedText),
        originalCharCount: text.length,
        paraphrasedCharCount: paraphrasedText.length,
      };

      return res.json(response);
    } catch (error: any) {
      console.error("Error in paraphrase endpoint:", error);
      return res.status(500).json({ 
        error: error.message || "Failed to paraphrase text" 
      });
    }
  });

  // Plagiarism check endpoint
  app.post("/api/check-plagiarism", async (req, res) => {
    try {
      // Validate request body
      const validation = plagiarismCheckRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.errors 
        });
      }

      const { text } = validation.data;

      // Check for plagiarism using AI
      const analysis = await checkPlagiarism(text);

      const response: PlagiarismCheckResponse = {
        originalityScore: analysis.originalityScore,
        riskLevel: analysis.riskLevel,
        summary: analysis.summary,
        flaggedPassages: analysis.flaggedPassages,
        recommendations: analysis.recommendations,
        aiContentProbability: analysis.aiContentProbability,
      };

      return res.json(response);
    } catch (error: any) {
      console.error("Error in plagiarism check endpoint:", error);
      return res.status(500).json({ 
        error: error.message || "Failed to check for plagiarism" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
