import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
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
  ChevronUp
} from "lucide-react";
import { SiDiscord, SiTiktok, SiYoutube, SiInstagram } from "react-icons/si";
import type { ParaphraseMode, ParaphraseResponse, PlagiarismCheckResponse, FlaggedPassage } from "@shared/schema";

export default function Home() {
  const [originalText, setOriginalText] = useState("");
  const [paraphrasedText, setParaphrasedText] = useState("");
  const [selectedMode, setSelectedMode] = useState<ParaphraseMode>("standard");
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismCheckResponse | null>(null);
  const [showPlagiarismDetails, setShowPlagiarismDetails] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const { toast } = useToast();
  
  const originalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const paraphrasedTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isSyncingScroll = useRef(false);
  const lastScrollY = useRef(0);

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

  const handleCopy = async () => {
    if (!paraphrasedText) return;
    
    try {
      await navigator.clipboard.writeText(paraphrasedText);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
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

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Thanks for subscribing!",
        description: "We'll keep you updated with the latest features.",
      });
      setEmail("");
    }
  };

  const originalWordCount = originalText?.trim() ? originalText.trim().split(/\s+/).length : 0;
  const paraphrasedWordCount = paraphrasedText?.trim() ? paraphrasedText.trim().split(/\s+/).length : 0;

  // Compute text differences and AI detection risk
  const textDiff = useMemo(() => {
    if (!originalText || !paraphrasedText) return [];
    return computeTextDiff(originalText, paraphrasedText);
  }, [originalText, paraphrasedText]);

  const changePercentage = useMemo(() => {
    if (!originalText || !paraphrasedText) return 0;
    return calculateChangePercentage(originalText, paraphrasedText);
  }, [originalText, paraphrasedText]);

  // AI detection risk (inverse of change percentage - higher changes = lower AI detection risk)
  const detectionRisk = paraphrasedText ? Math.max(10, 100 - changePercentage) : 0;
  const riskLevel = detectionRisk < 30 ? 'low' : detectionRisk < 60 ? 'medium' : 'high';
  const riskColor = riskLevel === 'low' ? 'text-green-600 dark:text-green-400' : 
                    riskLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-red-600 dark:text-red-400';

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
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">
                Pricing
              </a>
              <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-about">
                About
              </a>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

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
                  className="min-h-96 resize-none font-sans text-base leading-relaxed"
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  onScroll={() => handleScroll('original')}
                  disabled={paraphraseMutation.isPending}
                  data-testid="textarea-original"
                />
              </div>

              {/* Paraphrased Text with Highlighting */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" data-testid="label-paraphrased-text">
                    Paraphrased Text
                  </label>
                  <div className="flex items-center gap-2">
                    {paraphrasedText && (
                      <>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {changePercentage}% changed
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono" data-testid="text-paraphrased-stats">
                          {paraphrasedWordCount} words · {paraphrasedText.length} chars
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {paraphraseMutation.isPending ? (
                  <div className="min-h-96 border rounded-md p-4 space-y-3 bg-muted/30" data-testid="skeleton-paraphrasing">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                      <span className="ml-2 text-sm text-muted-foreground">Paraphrasing your text...</span>
                    </div>
                  </div>
                ) : paraphrasedText ? (
                  <div 
                    className="min-h-96 border rounded-md p-3 overflow-auto bg-background font-sans text-base leading-relaxed"
                    data-testid="div-paraphrased-highlighted"
                  >
                    {textDiff.map((segment, index) => (
                      <span
                        key={index}
                        className={segment.type === 'changed' ? 'bg-primary/20 border-b-2 border-primary/40' : ''}
                      >
                        {segment.text}
                        {index < textDiff.length - 1 ? ' ' : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-96 border rounded-md p-3 text-muted-foreground text-base flex items-center justify-center">
                    Your paraphrased text will appear here...
                  </div>
                )}
              </div>
            </div>

            {/* AI Detection Risk Meter */}
            {paraphrasedText && (
              <div className="mb-6 p-4 border rounded-md bg-card" data-testid="card-detection-meter">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    AI Detection Risk
                  </label>
                  <Badge variant={riskLevel === 'low' ? 'default' : riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                    {riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <Progress value={detectionRisk} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {riskLevel === 'low' ? 'Excellent! Very low chance of AI detection.' :
                   riskLevel === 'medium' ? 'Good. Moderate chance of passing as human-written.' :
                   'High risk. Consider paraphrasing again with a different mode.'}
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
                  Paraphrase
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
                  {plagiarismMutation.isPending ? "Checking..." : "Check Plagiarism"}
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
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              )}
            </div>

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
                    {/* Summary */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{plagiarismResult.summary}</p>
                    </div>

                    {/* Originality & AI Content Scores */}
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

                    {/* Flagged Passages */}
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

                    {/* Recommendations */}
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
              <h3 className="text-lg font-semibold mb-2">Quality Guaranteed</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Maintain original meaning while improving readability and removing AI detection patterns.
              </p>
            </Card>
            <Card className="p-6 hover-elevate" data-testid="card-feature-fast">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Get instant results powered by advanced AI models for quick content transformation.
              </p>
            </Card>
            <Card className="p-6 hover-elevate" data-testid="card-feature-privacy">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your content is processed securely and never stored or shared with third parties.
              </p>
            </Card>
            <Card className="p-6 hover-elevate" data-testid="card-feature-free">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Free to Use</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                No registration required. Start paraphrasing immediately with our powerful AI tool.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3" data-testid="text-how-it-works-title">
              How It Works
            </h2>
            <p className="text-muted-foreground" data-testid="text-how-it-works-subtitle">
              Three simple steps to humanize your content
            </p>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4" data-testid="step-1">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Paste Your Text</h3>
                <p className="text-muted-foreground text-sm">
                  Copy and paste the AI-generated content you want to humanize into the input field.
                </p>
              </div>
            </div>
            <div className="flex gap-4" data-testid="step-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Choose Your Style</h3>
                <p className="text-muted-foreground text-sm">
                  Select from Standard, Creative, Formal, or Casual modes based on your target audience.
                </p>
              </div>
            </div>
            <div className="flex gap-4" data-testid="step-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Get Human-Like Results</h3>
                <p className="text-muted-foreground text-sm">
                  Click paraphrase and receive natural, authentic content that bypasses AI detection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-semibold mb-3" data-testid="text-newsletter-title">
            Stay Updated
          </h2>
          <p className="text-muted-foreground mb-6">
            Get notified about new features and improvements to our AI paraphrasing tool.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-newsletter-email"
            />
            <Button type="submit" data-testid="button-newsletter-submit">
              <Mail className="w-4 h-4 mr-2" />
              Subscribe
            </Button>
          </form>
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
