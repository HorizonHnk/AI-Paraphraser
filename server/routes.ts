import type { Express } from "express";
import { createServer, type Server } from "http";
import { 
  paraphraseRequestSchema, 
  plagiarismCheckRequestSchema, 
  grammarCheckRequestSchema,
  batchParaphraseRequestSchema,
  type ParaphraseResponse, 
  type PlagiarismCheckResponse,
  type GrammarCheckResponse,
  type BatchParaphraseResponse,
  type HistoryItem,
  type UsageStats
} from "@shared/schema";
import { paraphraseText, countWords, checkPlagiarism, checkGrammar } from "./lib/openai";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get usage stats
  app.get("/api/usage", async (req, res) => {
    try {
      const stats = await storage.getUsageStats();
      return res.json(stats);
    } catch (error: any) {
      console.error("Error getting usage stats:", error);
      return res.status(500).json({ error: "Failed to get usage stats" });
    }
  });

  // Paraphrase endpoint
  app.post("/api/paraphrase", async (req, res) => {
    try {
      const validation = paraphraseRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.errors 
        });
      }

      const { text, mode } = validation.data;
      const wordCount = countWords(text);

      // Check usage limit
      const usageStats = await storage.getUsageStats();
      if (usageStats.wordsUsedToday + wordCount > usageStats.dailyLimit) {
        return res.status(429).json({ 
          error: "Daily word limit exceeded",
          remaining: usageStats.dailyLimit - usageStats.wordsUsedToday,
          resetTime: usageStats.resetTime
        });
      }

      const paraphrasedText = await paraphraseText(text, mode);

      // Update usage stats
      await storage.addWordsUsed(wordCount);

      // Add to history
      await storage.addToHistory({
        originalText: text,
        paraphrasedText,
        mode,
        wordCount,
      });

      const response: ParaphraseResponse = {
        originalText: text,
        paraphrasedText,
        mode,
        originalWordCount: wordCount,
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

  // Batch paraphrase endpoint
  app.post("/api/paraphrase/batch", async (req, res) => {
    try {
      const validation = batchParaphraseRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.errors 
        });
      }

      const { texts, mode } = validation.data;
      const totalWords = texts.reduce((sum, t) => sum + countWords(t), 0);

      // Check usage limit
      const usageStats = await storage.getUsageStats();
      if (usageStats.wordsUsedToday + totalWords > usageStats.dailyLimit) {
        return res.status(429).json({ 
          error: "Daily word limit exceeded",
          remaining: usageStats.dailyLimit - usageStats.wordsUsedToday,
          resetTime: usageStats.resetTime
        });
      }

      // Process all texts in parallel
      const results = await Promise.all(
        texts.map(async (text) => {
          const paraphrasedText = await paraphraseText(text, mode);
          return {
            originalText: text,
            paraphrasedText,
            wordCount: countWords(text),
          };
        })
      );

      // Update usage stats
      await storage.addWordsUsed(totalWords);

      // Add each to history
      for (const result of results) {
        await storage.addToHistory({
          originalText: result.originalText,
          paraphrasedText: result.paraphrasedText,
          mode,
          wordCount: result.wordCount,
        });
      }

      const response: BatchParaphraseResponse = {
        results,
        totalWordsProcessed: totalWords,
      };

      return res.json(response);
    } catch (error: any) {
      console.error("Error in batch paraphrase endpoint:", error);
      return res.status(500).json({ 
        error: error.message || "Failed to process batch" 
      });
    }
  });

  // Plagiarism check endpoint
  app.post("/api/check-plagiarism", async (req, res) => {
    try {
      const validation = plagiarismCheckRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.errors 
        });
      }

      const { text } = validation.data;
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

  // Grammar check endpoint
  app.post("/api/check-grammar", async (req, res) => {
    try {
      const validation = grammarCheckRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.errors 
        });
      }

      const { text } = validation.data;
      const analysis = await checkGrammar(text);

      const response: GrammarCheckResponse = {
        issues: analysis.issues,
        correctedText: analysis.correctedText,
        score: analysis.score,
      };

      return res.json(response);
    } catch (error: any) {
      console.error("Error in grammar check endpoint:", error);
      return res.status(500).json({ 
        error: error.message || "Failed to check grammar" 
      });
    }
  });

  // History endpoints
  app.get("/api/history", async (req, res) => {
    try {
      const history = await storage.getHistory();
      return res.json(history);
    } catch (error: any) {
      console.error("Error getting history:", error);
      return res.status(500).json({ error: "Failed to get history" });
    }
  });

  app.delete("/api/history/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteHistoryItem(id);
      if (deleted) {
        return res.json({ success: true });
      } else {
        return res.status(404).json({ error: "History item not found" });
      }
    } catch (error: any) {
      console.error("Error deleting history item:", error);
      return res.status(500).json({ error: "Failed to delete history item" });
    }
  });

  app.delete("/api/history", async (req, res) => {
    try {
      await storage.clearHistory();
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error clearing history:", error);
      return res.status(500).json({ error: "Failed to clear history" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
