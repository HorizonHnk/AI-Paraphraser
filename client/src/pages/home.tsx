import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import { computeTextDiff, calculateChangePercentage } from "@/lib/text-diff";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Wand2, 
  Briefcase, 
  MessageCircle,
  FileText,
  Shield,
  Zap,
  RefreshCw,
  ArrowRight,
  Mail,
  Github,
  Twitter,
  TrendingDown,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Download,
  History,
  Trash2,
  Clock,
  BookOpen,
  SpellCheck,
  Layers,
  X,
  Plus
} from "lucide-react";
import { SiDiscord, SiTiktok, SiYoutube, SiInstagram } from "react-icons/si";
import type { 
  ParaphraseMode, 
  ParaphraseResponse, 
  PlagiarismCheckResponse, 
  GrammarCheckResponse,
  HistoryItem,
  UsageStats,
  ReadabilityScore,
  BatchParaphraseResponse
} from "@shared/schema";

// Readability calculation helper
function calculateReadability(text: string): ReadabilityScore {
  if (!text?.trim()) {
    return { gradeLevel: 0, readingLevel: "N/A", fleschKincaid: 0, avgSentenceLength: 0, avgSyllablesPerWord: 0 };
  }
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);
  
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;
  
  // Flesch-Kincaid Grade Level formula
  const gradeLevel = Math.max(0, 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59);
  const fleschKincaid = Math.max(0, Math.min(100, 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord));
  
  let readingLevel = "College Graduate";
  if (gradeLevel <= 5) readingLevel = "5th Grade";
  else if (gradeLevel <= 6) readingLevel = "6th Grade";
  else if (gradeLevel <= 7) readingLevel = "7th Grade";
  else if (gradeLevel <= 8) readingLevel = "8th Grade";
  else if (gradeLevel <= 9) readingLevel = "9th Grade";
  else if (gradeLevel <= 10) readingLevel = "10th Grade";
  else if (gradeLevel <= 11) readingLevel = "11th Grade";
  else if (gradeLevel <= 12) readingLevel = "12th Grade";
  else if (gradeLevel <= 14) readingLevel = "College";
  
  return {
    gradeLevel: Math.round(gradeLevel * 10) / 10,
    readingLevel,
    fleschKincaid: Math.round(fleschKincaid),
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export default function Home() {
  const [originalText, setOriginalText] = useState("");
  const [paraphrasedText, setParaphrasedText] = useState("");
  const [selectedMode, setSelectedMode] = useState<ParaphraseMode>("standard");
  const [copied, setCopied] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismCheckResponse | null>(null);
  const [showPlagiarismDetails, setShowPlagiarismDetails] = useState(false);
  const [grammarResult, setGrammarResult] = useState<GrammarCheckResponse | null>(null);
  const [showGrammarDetails, setShowGrammarDetails] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchTexts, setBatchTexts] = useState<string[]>([""]);
  const [batchResults, setBatchResults] = useState<BatchParaphraseResponse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const originalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const paraphrasedTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isSyncingScroll = useRef(false);
  const lastScrollY = useRef(0);

  // Fetch usage stats
  const { data: usageStats } = useQuery<UsageStats>({
    queryKey: ['/api/usage'],
    refetchInterval: 60000,
  });

  // Fetch history
  const { data: history = [] } = useQuery<HistoryItem[]>({
    queryKey: ['/api/history'],
  });

  // Hide header on scroll down, show on scroll up
  useEffect(() => {
    const handleWindowScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;
      const scrolledPastThreshold = currentScrollY > 80;
      
      if (scrollingDown && scrolledPastThreshold) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  const modes = [
    { id: "standard" as const, label: "Standard", icon: FileText, description: "Balanced rewriting" },
    { id: "creative" as const, label: "Creative", icon: Wand2, description: "Unique variations" },
    { id: "formal" as const, label: "Formal", icon: Briefcase, description: "Professional tone" },
    { id: "casual" as const, label: "Casual", icon: MessageCircle, description: "Conversational style" },
  ];

  // Synchronized scrolling
  const handleScroll = (source: 'original' | 'paraphrased') => {
    if (isSyncingScroll.current) return;
    
    isSyncingScroll.current = true;
    
    const sourceRef = source === 'original' ? originalTextareaRef : paraphrasedTextareaRef;
    const targetRef = source === 'original' ? paraphrasedTextareaRef : originalTextareaRef;
    
    if (sourceRef.current && targetRef.current) {
      const scrollPercentage = sourceRef.current.scrollTop / 
        (sourceRef.current.scrollHeight - sourceRef.current.clientHeight || 1);
      
      targetRef.current.scrollTop = scrollPercentage * 
        (targetRef.current.scrollHeight - targetRef.current.clientHeight);
    }
    
    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 50);
  };

  const paraphraseMutation = useMutation({
    mutationFn: async (data: { text: string; mode: ParaphraseMode }) => {
      const response = await apiRequest("POST", "/api/paraphrase", data);
      return await response.json() as ParaphraseResponse;
    },
    onSuccess: (data) => {
      setParaphrasedText(data.paraphrasedText);
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/usage'] });
      toast({
        title: "Success!",
        description: "Your text has been paraphrased.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to paraphrase text. Please try again.",
        variant: "destructive",
      });
    },
  });

  const batchMutation = useMutation({
    mutationFn: async (data: { texts: string[]; mode: ParaphraseMode }) => {
      const response = await apiRequest("POST", "/api/paraphrase/batch", data);
      return await response.json() as BatchParaphraseResponse;
    },
    onSuccess: (data) => {
      setBatchResults(data);
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/usage'] });
      toast({
        title: "Batch Complete!",
        description: `Processed ${data.results.length} texts (${data.totalWordsProcessed} words).`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process batch. Please try again.",
        variant: "destructive",
      });
    },
  });

  const plagiarismMutation = useMutation({
    mutationFn: async (data: { text: string }) => {
      const response = await apiRequest("POST", "/api/check-plagiarism", data);
      return await response.json() as PlagiarismCheckResponse;
    },
    onSuccess: (data) => {
      setPlagiarismResult(data);
      setShowPlagiarismDetails(true);
      toast({
        title: "Analysis Complete",
        description: `Originality Score: ${data.originalityScore}%`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check plagiarism. Please try again.",
        variant: "destructive",
      });
    },
  });

  const grammarMutation = useMutation({
    mutationFn: async (data: { text: string }) => {
      const response = await apiRequest("POST", "/api/check-grammar", data);
      return await response.json() as GrammarCheckResponse;
    },
    onSuccess: (data) => {
      setGrammarResult(data);
      setShowGrammarDetails(true);
      toast({
        title: "Grammar Check Complete",
        description: `Score: ${data.score}% - Found ${data.issues.length} issue(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check grammar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/history");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
      toast({ title: "History Cleared" });
    },
  });

  const deleteHistoryItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/history/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
    },
  });

  const handleParaphrase = () => {
    if (!originalText.trim()) {
      toast({
        title: "No text entered",
        description: "Please enter some text to paraphrase.",
        variant: "destructive",
      });
      return;
    }
    paraphraseMutation.mutate({ text: originalText, mode: selectedMode });
  };

  const handleBatchParaphrase = () => {
    const validTexts = batchTexts.filter(t => t.trim());
    if (validTexts.length === 0) {
      toast({
        title: "No texts entered",
        description: "Please enter at least one text to paraphrase.",
        variant: "destructive",
      });
      return;
    }
    batchMutation.mutate({ texts: validTexts, mode: selectedMode });
  };

  const handleCopy = async () => {
    if (!paraphrasedText) return;
    
    try {
      await navigator.clipboard.writeText(paraphrasedText);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Paraphrased text copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setOriginalText("");
    setParaphrasedText("");
    setPlagiarismResult(null);
    setShowPlagiarismDetails(false);
    setGrammarResult(null);
    setShowGrammarDetails(false);
    setBatchResults(null);
  };

  const handlePlagiarismCheck = () => {
    if (!originalText.trim()) {
      toast({
        title: "No text entered",
        description: "Please enter some text to check for plagiarism.",
        variant: "destructive",
      });
      return;
    }
    plagiarismMutation.mutate({ text: originalText });
  };

  const handleGrammarCheck = () => {
    if (!originalText.trim()) {
      toast({
        title: "No text entered",
        description: "Please enter some text to check grammar.",
        variant: "destructive",
      });
      return;
    }
    grammarMutation.mutate({ text: originalText });
  };

  const handleExportTxt = () => {
    if (!paraphrasedText) return;
    const blob = new Blob([paraphrasedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paraphrased-text.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!", description: "Text file saved." });
  };

  const handleExportPdf = () => {
    if (!paraphrasedText) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Paraphrased Text</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              h1 { font-size: 18px; margin-bottom: 20px; }
              p { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>Paraphrased Text</h1>
            <p>${paraphrasedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    toast({ title: "Print Dialog Opened", description: "Save as PDF from print dialog." });
  };

  const loadFromHistory = (item: HistoryItem) => {
    setOriginalText(item.originalText);
    setParaphrasedText(item.paraphrasedText);
    setSelectedMode(item.mode);
    setShowHistory(false);
    toast({ title: "Loaded from history" });
  };

  const addBatchText = () => {
    if (batchTexts.length < 10) {
      setBatchTexts([...batchTexts, ""]);
    }
  };

  const removeBatchText = (index: number) => {
    setBatchTexts(batchTexts.filter((_, i) => i !== index));
  };

  const updateBatchText = (index: number, value: string) => {
    const newTexts = [...batchTexts];
    newTexts[index] = value;
    setBatchTexts(newTexts);
  };

  const originalWordCount = originalText?.trim() ? originalText.trim().split(/\s+/).length : 0;
  const paraphrasedWordCount = paraphrasedText?.trim() ? paraphrasedText.trim().split(/\s+/).length : 0;

  // Compute text differences and AI detection risk
  const textDiff = useMemo(() => {
    if (!originalText || !paraphrasedText) return null;
    return computeTextDiff(originalText, paraphrasedText);
  }, [originalText, paraphrasedText]);

  const changePercentage = useMemo(() => {
    if (!originalText || !paraphrasedText) return 0;
    return calculateChangePercentage(originalText, paraphrasedText);
  }, [originalText, paraphrasedText]);

  // Readability scores
  const originalReadability = useMemo(() => calculateReadability(originalText), [originalText]);
  const paraphrasedReadability = useMemo(() => calculateReadability(paraphrasedText), [paraphrasedText]);

  const riskLevel = changePercentage < 30 ? 'high' : changePercentage < 50 ? 'medium' : 'low';
  const riskColor = riskLevel === 'low' ? 'text-green-600 dark:text-green-400' : 
                    riskLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-red-600 dark:text-red-400';

  const usagePercentage = usageStats ? (usageStats.wordsUsedToday / usageStats.dailyLimit) * 100 : 0;

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header - hides on scroll down, shows on scroll up */}
      <header 
        className={`border-b fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm z-50 transition-transform duration-300 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" data-testid="icon-logo" />
            <span className="text-xl font-semibold" data-testid="text-logo">AI Paraphraser</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-how-it-works">
                How It Works
              </a>
            </nav>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowHistory(!showHistory)}
              data-testid="button-history"
            >
              <History className="w-5 h-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed right-0 top-16 bottom-0 w-80 bg-background border-l shadow-lg z-40 overflow-hidden flex flex-col" data-testid="panel-history">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </h3>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => clearHistoryMutation.mutate()}
                disabled={history.length === 0}
                data-testid="button-clear-history"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No history yet</p>
            ) : (
              history.map((item) => (
                <Card 
                  key={item.id} 
                  className="p-3 cursor-pointer hover-elevate"
                  onClick={() => loadFromHistory(item)}
                  data-testid={`history-item-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.originalText.slice(0, 50)}...</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{item.mode}</Badge>
                        <span className="text-xs text-muted-foreground">{item.wordCount} words</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistoryItemMutation.mutate(item.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Word Limit Indicator */}
      {usageStats && (
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Daily Usage</span>
                <span className="text-sm text-muted-foreground">
                  {usageStats.wordsUsedToday.toLocaleString()} / {usageStats.dailyLimit.toLocaleString()} words
                </span>
              </div>
              <Progress 
                value={usagePercentage} 
                className={`h-2 ${usagePercentage > 80 ? '[&>div]:bg-red-500' : usagePercentage > 50 ? '[&>div]:bg-yellow-500' : ''}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none opacity-50" />
        <div className="max-w-5xl mx-auto px-6 text-center relative">
          <Badge className="mb-4" variant="secondary" data-testid="badge-ai-powered">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by Advanced AI
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" data-testid="text-hero-title">
            Humanize Your Content with AI
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
            Transform AI-generated text into natural, human-like content. Remove AI detection patterns while maintaining meaning and quality.
          </p>
          <Button 
            size="lg" 
            className="gap-2" 
            onClick={() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' })}
            data-testid="button-get-started"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Main Tool Interface */}
      <section id="tool" className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-6">
          <Card className="p-6 md:p-8" data-testid="card-tool">
            {/* Mode Toggle: Single vs Batch */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant={!batchMode ? "default" : "outline"}
                onClick={() => setBatchMode(false)}
                className="gap-2"
                data-testid="button-single-mode"
              >
                <FileText className="w-4 h-4" />
                Single Text
              </Button>
              <Button
                variant={batchMode ? "default" : "outline"}
                onClick={() => setBatchMode(true)}
                className="gap-2"
                data-testid="button-batch-mode"
              >
                <Layers className="w-4 h-4" />
                Batch Processing
              </Button>
            </div>

            {/* Mode Selector */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-3 block" data-testid="label-mode-selector">
                Paraphrasing Mode
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {modes.map((mode) => (
                  <Button
                    key={mode.id}
                    variant={selectedMode === mode.id ? "default" : "outline"}
                    className="flex flex-col items-start h-auto py-3 px-4 gap-1"
                    onClick={() => setSelectedMode(mode.id)}
                    data-testid={`button-mode-${mode.id}`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <mode.icon className="w-4 h-4" />
                      <span className="font-medium">{mode.label}</span>
                    </div>
                    <span className="text-xs opacity-80 font-normal">{mode.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Single Mode Interface */}
            {!batchMode && (
              <>
                {/* Text Input Panels with Synchronized Scrolling */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Original Text */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium" data-testid="label-original-text">
                        Original Text
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono" data-testid="text-original-stats">
                          {originalWordCount} words · {originalText.length} chars
                        </span>
                      </div>
                    </div>
                    <Textarea
                      ref={originalTextareaRef}
                      placeholder="Paste or type your text here to paraphrase it..."
                      className="min-h-64 resize-none font-sans text-base leading-relaxed"
                      value={originalText}
                      onChange={(e) => setOriginalText(e.target.value)}
                      onScroll={() => handleScroll('original')}
                      disabled={paraphraseMutation.isPending}
                      data-testid="textarea-original"
                    />
                    {/* Readability Score for Original */}
                    {originalText && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-md flex items-center gap-4 text-xs">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span>Reading Level: <strong>{originalReadability.readingLevel}</strong></span>
                        <span>Grade: <strong>{originalReadability.gradeLevel}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Paraphrased Text with Highlighting */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium" data-testid="label-paraphrased-text">
                        Paraphrased Text
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono" data-testid="text-paraphrased-stats">
                          {paraphrasedWordCount} words · {paraphrasedText.length} chars
                        </span>
                      </div>
                    </div>
                    {paraphraseMutation.isPending ? (
                      <div className="min-h-64 border rounded-md p-4 space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex items-center gap-2 mt-4">
                          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Paraphrasing your text...</span>
                        </div>
                      </div>
                    ) : paraphrasedText ? (
                      <div 
                        ref={paraphrasedTextareaRef as any}
                        className="min-h-64 border rounded-md p-4 overflow-y-auto bg-muted/30 font-sans text-base leading-relaxed"
                        onScroll={() => handleScroll('paraphrased')}
                        data-testid="div-paraphrased-output"
                      >
                        {textDiff ? (
                          textDiff.map((part, index) => (
                            <span
                              key={index}
                              className={
                                part.type === 'changed'
                                  ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 px-0.5 rounded"
                                  : ""
                              }
                            >
                              {part.text}{' '}
                            </span>
                          ))
                        ) : (
                          paraphrasedText
                        )}
                      </div>
                    ) : (
                      <div className="min-h-64 border rounded-md p-4 flex items-center justify-center text-muted-foreground border-dashed">
                        <p className="text-center text-sm">
                          Paraphrased text will appear here
                        </p>
                      </div>
                    )}
                    {/* Readability Score for Paraphrased */}
                    {paraphrasedText && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-md flex items-center gap-4 text-xs">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span>Reading Level: <strong>{paraphrasedReadability.readingLevel}</strong></span>
                        <span>Grade: <strong>{paraphrasedReadability.gradeLevel}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Detection Risk Meter */}
                {paraphrasedText && (
                  <div className="mb-6 p-4 border rounded-md bg-muted/30" data-testid="card-ai-detection">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        AI Detection Risk
                      </span>
                      <Badge 
                        variant={riskLevel === 'low' ? 'default' : riskLevel === 'medium' ? 'secondary' : 'destructive'}
                        data-testid="badge-risk-level"
                      >
                        {riskLevel === 'low' ? 'Low Risk' : riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
                      </Badge>
                    </div>
                    <Progress value={changePercentage} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      <span className={riskColor}>{Math.round(changePercentage)}% text changed</span> — 
                      {riskLevel === 'low' 
                        ? " Great! This text should pass most AI detection tools."
                        : riskLevel === 'medium'
                        ? " Consider paraphrasing again for better results."
                        : " Warning: High similarity to original. Try the Creative mode."}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between flex-wrap">
                  <div className="flex gap-3 flex-wrap">
                    <Button
                      size="lg"
                      onClick={handleParaphrase}
                      disabled={!originalText.trim() || paraphraseMutation.isPending}
                      className="gap-2"
                      data-testid="button-paraphrase"
                    >
                      <Sparkles className="w-4 h-4" />
                      {paraphraseMutation.isPending ? "Processing..." : "Paraphrase"}
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={handleGrammarCheck}
                      disabled={!originalText.trim() || grammarMutation.isPending}
                      className="gap-2"
                      data-testid="button-grammar-check"
                    >
                      <SpellCheck className="w-4 h-4" />
                      {grammarMutation.isPending ? "Checking..." : "Grammar Check"}
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={handlePlagiarismCheck}
                      disabled={!originalText.trim() || plagiarismMutation.isPending}
                      className="gap-2"
                      data-testid="button-plagiarism-check"
                    >
                      <Search className="w-4 h-4" />
                      {plagiarismMutation.isPending ? "Checking..." : "Plagiarism Check"}
                    </Button>
                    {(originalText || paraphrasedText) && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleClear}
                        disabled={paraphraseMutation.isPending || plagiarismMutation.isPending}
                        data-testid="button-clear"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  {paraphrasedText && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleExportTxt}
                        className="gap-2"
                        data-testid="button-export-txt"
                      >
                        <Download className="w-4 h-4" />
                        TXT
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleExportPdf}
                        className="gap-2"
                        data-testid="button-export-pdf"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </Button>
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={handleCopy}
                        className="gap-2"
                        data-testid="button-copy"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Grammar Check Results */}
                {grammarResult && (
                  <div className="mt-6 border rounded-md overflow-hidden" data-testid="card-grammar-results">
                    <div 
                      className="p-4 bg-card cursor-pointer flex items-center justify-between"
                      onClick={() => setShowGrammarDetails(!showGrammarDetails)}
                      data-testid="button-toggle-grammar-details"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <SpellCheck className="w-5 h-5 text-primary" />
                          <span className="font-semibold">Grammar Analysis</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={grammarResult.score >= 80 ? 'default' : grammarResult.score >= 50 ? 'secondary' : 'destructive'}>
                            Score: {grammarResult.score}%
                          </Badge>
                          <Badge variant="outline">
                            {grammarResult.issues.length} issue(s)
                          </Badge>
                        </div>
                      </div>
                      {showGrammarDetails ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    {showGrammarDetails && (
                      <div className="p-4 border-t space-y-4">
                        {grammarResult.issues.length > 0 ? (
                          <div className="space-y-2">
                            {grammarResult.issues.map((issue, index) => (
                              <div 
                                key={index}
                                className={`p-3 rounded-md border-l-4 ${
                                  issue.type === 'spelling' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/30' :
                                  issue.type === 'grammar' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30' :
                                  issue.type === 'punctuation' ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30' :
                                  'border-l-purple-500 bg-purple-50 dark:bg-purple-950/30'
                                }`}
                                data-testid={`grammar-issue-${index}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm"><strong>"{issue.text}"</strong> → <span className="text-green-600">{issue.suggestion}</span></p>
                                    <Badge variant="outline" className="mt-1 text-xs capitalize">{issue.type}</Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            No grammar issues found!
                          </p>
                        )}
                        {grammarResult.correctedText !== originalText && (
                          <div className="mt-4">
                            <Button
                              variant="outline"
                              onClick={() => setOriginalText(grammarResult.correctedText)}
                              className="gap-2"
                              data-testid="button-apply-corrections"
                            >
                              <Check className="w-4 h-4" />
                              Apply All Corrections
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Plagiarism Check Results */}
                {plagiarismResult && (
                  <div className="mt-6 border rounded-md overflow-hidden" data-testid="card-plagiarism-results">
                    <div 
                      className="p-4 bg-card cursor-pointer flex items-center justify-between"
                      onClick={() => setShowPlagiarismDetails(!showPlagiarismDetails)}
                      data-testid="button-toggle-plagiarism-details"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {plagiarismResult.riskLevel === 'low' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : plagiarismResult.riskLevel === 'medium' ? (
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <span className="font-semibold">Plagiarism Analysis</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={plagiarismResult.riskLevel === 'low' ? 'default' : plagiarismResult.riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                            {plagiarismResult.originalityScore}% Original
                          </Badge>
                          <Badge variant="outline">
                            {plagiarismResult.aiContentProbability}% AI Content
                          </Badge>
                        </div>
                      </div>
                      {showPlagiarismDetails ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    {showPlagiarismDetails && (
                      <div className="p-4 border-t space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Summary</h4>
                          <p className="text-sm text-muted-foreground">{plagiarismResult.summary}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-3 border rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Originality Score</span>
                              <span className={`text-sm font-semibold ${
                                plagiarismResult.originalityScore >= 70 ? 'text-green-600 dark:text-green-400' :
                                plagiarismResult.originalityScore >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {plagiarismResult.originalityScore}%
                              </span>
                            </div>
                            <Progress value={plagiarismResult.originalityScore} className="h-2" />
                          </div>
                          <div className="p-3 border rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">AI Content Probability</span>
                              <span className={`text-sm font-semibold ${
                                plagiarismResult.aiContentProbability <= 30 ? 'text-green-600 dark:text-green-400' :
                                plagiarismResult.aiContentProbability <= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {plagiarismResult.aiContentProbability}%
                              </span>
                            </div>
                            <Progress value={plagiarismResult.aiContentProbability} className="h-2" />
                          </div>
                        </div>

                        {plagiarismResult.flaggedPassages.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              Flagged Passages ({plagiarismResult.flaggedPassages.length})
                            </h4>
                            <div className="space-y-2">
                              {plagiarismResult.flaggedPassages.map((passage, index) => (
                                <div 
                                  key={index} 
                                  className={`p-3 rounded-md border-l-4 ${
                                    passage.severity === 'high' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/30' :
                                    passage.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30' :
                                    'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                  }`}
                                  data-testid={`flagged-passage-${index}`}
                                >
                                  <p className="text-sm font-medium mb-1 italic">"{passage.text}"</p>
                                  <p className="text-xs text-muted-foreground">{passage.reason}</p>
                                  <Badge 
                                    variant="outline" 
                                    className={`mt-2 text-xs ${
                                      passage.severity === 'high' ? 'border-red-500 text-red-600' :
                                      passage.severity === 'medium' ? 'border-yellow-500 text-yellow-600' :
                                      'border-blue-500 text-blue-600'
                                    }`}
                                  >
                                    {passage.severity.toUpperCase()}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {plagiarismResult.recommendations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-primary" />
                              Recommendations
                            </h4>
                            <ul className="space-y-2">
                              {plagiarismResult.recommendations.map((rec, index) => (
                                <li 
                                  key={index} 
                                  className="flex items-start gap-2 text-sm text-muted-foreground"
                                  data-testid={`recommendation-${index}`}
                                >
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Batch Mode Interface */}
            {batchMode && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Add up to 10 texts to paraphrase at once</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addBatchText}
                    disabled={batchTexts.length >= 10}
                    className="gap-2"
                    data-testid="button-add-batch-text"
                  >
                    <Plus className="w-4 h-4" />
                    Add Text
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {batchTexts.map((text, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Text {index + 1}</label>
                        {batchTexts.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBatchText(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        placeholder={`Enter text ${index + 1} to paraphrase...`}
                        className="min-h-32 resize-none"
                        value={text}
                        onChange={(e) => updateBatchText(index, e.target.value)}
                        data-testid={`textarea-batch-${index}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    size="lg"
                    onClick={handleBatchParaphrase}
                    disabled={batchTexts.every(t => !t.trim()) || batchMutation.isPending}
                    className="gap-2"
                    data-testid="button-batch-paraphrase"
                  >
                    <Layers className="w-4 h-4" />
                    {batchMutation.isPending ? "Processing..." : `Paraphrase All (${batchTexts.filter(t => t.trim()).length})`}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setBatchTexts([""]);
                      setBatchResults(null);
                    }}
                    data-testid="button-clear-batch"
                  >
                    Clear All
                  </Button>
                </div>

                {/* Batch Results */}
                {batchResults && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Results ({batchResults.results.length} texts)</h3>
                      <Badge variant="secondary">{batchResults.totalWordsProcessed} words processed</Badge>
                    </div>
                    {batchResults.results.map((result, index) => (
                      <Card key={index} className="p-4" data-testid={`batch-result-${index}`}>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Original</label>
                            <p className="text-sm bg-muted/50 p-2 rounded">{result.originalText}</p>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Paraphrased</label>
                            <p className="text-sm bg-green-50 dark:bg-green-950/30 p-2 rounded">{result.paraphrasedText}</p>
                          </div>
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              await navigator.clipboard.writeText(result.paraphrasedText);
                              toast({ title: "Copied!" });
                            }}
                            className="gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3" data-testid="text-features-title">
              Why Use Our AI Paraphraser?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-features-subtitle">
              Powerful features designed to help you create authentic, human-like content
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 hover-elevate" data-testid="card-feature-humanize">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Humanization</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Transform robotic AI text into natural, human-sounding content that passes detection tools.
              </p>
            </Card>
            <Card className="p-6 hover-elevate" data-testid="card-feature-modes">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <Wand2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multiple Modes</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Choose from Standard, Creative, Formal, or Casual tones to match your exact needs.
              </p>
            </Card>
            <Card className="p-6 hover-elevate" data-testid="card-feature-quality">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Plagiarism Check</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Built-in plagiarism and AI content detection to ensure your text is original.
              </p>
            </Card>
            <Card className="p-6 hover-elevate" data-testid="card-feature-grammar">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <SpellCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Grammar Check</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Detect and fix grammar, spelling, and punctuation issues automatically.
              </p>
            </Card>
            <Card className="p-6 hover-elevate" data-testid="card-feature-batch">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Process up to 10 texts at once for efficient bulk paraphrasing.
              </p>
            </Card>
            <Card className="p-6 hover-elevate" data-testid="card-feature-readability">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Readability Score</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                See the reading level of your text with Flesch-Kincaid grade analysis.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3" data-testid="text-how-it-works-title">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-how-it-works-subtitle">
              Transform your content in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Paste Your Text</h3>
              <p className="text-muted-foreground text-sm">
                Copy and paste your AI-generated or existing content into the editor.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Mode</h3>
              <p className="text-muted-foreground text-sm">
                Select the paraphrasing style that best fits your needs.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Get Human-Like Content</h3>
              <p className="text-muted-foreground text-sm">
                Receive naturally rewritten text that maintains your original meaning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold" data-testid="text-footer-logo">AI Paraphraser</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Transform AI-generated text into natural, human-like content with our advanced paraphrasing tool.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#tool" className="text-muted-foreground hover:text-foreground transition-colors">
                    Try Now
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="icon" asChild data-testid="link-github">
                  <a href="https://github.com/HorizonHnk/AI-Paraphraser.git" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                    <Github className="w-5 h-5" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild data-testid="link-discord">
                  <a href="https://discord.com/users/hnk0422_76455" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                    <SiDiscord className="w-5 h-5" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild data-testid="link-twitter">
                  <a href="https://twitter.com/HnkHorizon" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                    <Twitter className="w-5 h-5" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild data-testid="link-tiktok">
                  <a href="https://tiktok.com/@codingfever" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                    <SiTiktok className="w-5 h-5" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild data-testid="link-youtube">
                  <a href="https://youtube.com/@HNK2005" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                    <SiYoutube className="w-5 h-5" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild data-testid="link-instagram">
                  <a href="https://instagram.com/hhnk.3693" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <SiInstagram className="w-5 h-5" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild data-testid="link-email">
                  <a href="mailto:hhnk3693@gmail.com" aria-label="Email">
                    <Mail className="w-5 h-5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground" data-testid="text-footer-copyright">
              © 2025 AI Paraphraser. Powered by advanced AI technology.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Secure & Private
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Powered by GPT-5
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
