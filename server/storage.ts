import { type User, type InsertUser, type HistoryItem, type UsageStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // History methods
  getHistory(): Promise<HistoryItem[]>;
  addToHistory(item: Omit<HistoryItem, "id" | "createdAt">): Promise<HistoryItem>;
  deleteHistoryItem(id: string): Promise<boolean>;
  clearHistory(): Promise<void>;
  
  // Usage tracking methods
  getUsageStats(): Promise<UsageStats>;
  addWordsUsed(count: number): Promise<UsageStats>;
  resetDailyUsage(): Promise<void>;
}

const DAILY_WORD_LIMIT = 5000;

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private history: Map<string, HistoryItem>;
  private wordsUsedToday: number;
  private lastResetDate: string;

  constructor() {
    this.users = new Map();
    this.history = new Map();
    this.wordsUsedToday = 0;
    this.lastResetDate = new Date().toDateString();
  }

  private checkAndResetDaily(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.wordsUsedToday = 0;
      this.lastResetDate = today;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getHistory(): Promise<HistoryItem[]> {
    return Array.from(this.history.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addToHistory(item: Omit<HistoryItem, "id" | "createdAt">): Promise<HistoryItem> {
    const id = randomUUID();
    const historyItem: HistoryItem = {
      ...item,
      id,
      createdAt: new Date().toISOString(),
    };
    this.history.set(id, historyItem);
    
    // Keep only last 50 items
    if (this.history.size > 50) {
      const oldest = Array.from(this.history.entries())
        .sort((a, b) => new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime())[0];
      if (oldest) {
        this.history.delete(oldest[0]);
      }
    }
    
    return historyItem;
  }

  async deleteHistoryItem(id: string): Promise<boolean> {
    return this.history.delete(id);
  }

  async clearHistory(): Promise<void> {
    this.history.clear();
  }

  async getUsageStats(): Promise<UsageStats> {
    this.checkAndResetDaily();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return {
      wordsUsedToday: this.wordsUsedToday,
      dailyLimit: DAILY_WORD_LIMIT,
      resetTime: tomorrow.toISOString(),
    };
  }

  async addWordsUsed(count: number): Promise<UsageStats> {
    this.checkAndResetDaily();
    this.wordsUsedToday += count;
    return this.getUsageStats();
  }

  async resetDailyUsage(): Promise<void> {
    this.wordsUsedToday = 0;
    this.lastResetDate = new Date().toDateString();
  }
}

export const storage = new MemStorage();
