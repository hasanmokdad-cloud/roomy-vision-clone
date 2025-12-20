import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Languages, Copy, Check, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية", rtl: true },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "he", name: "Hebrew", nativeName: "עברית", rtl: true },
];

interface TranslateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageText: string | null;
}

export function TranslateModal({
  open,
  onOpenChange,
  messageText,
}: TranslateModalProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [targetLanguage, setTargetLanguage] = useState(() => 
    localStorage.getItem('preferredTranslateLanguage') || 'en'
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<{
    detectedLanguage: string;
    detectedLanguageCode: string;
    translatedText: string;
    isRTL: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-translate when modal opens or language changes
  useEffect(() => {
    if (open && messageText && targetLanguage) {
      translateMessage();
    }
  }, [open, targetLanguage]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTranslationResult(null);
      setError(null);
      setCopied(false);
    }
  }, [open]);

  const translateMessage = async () => {
    if (!messageText) return;

    setIsTranslating(true);
    setError(null);

    try {
      const selectedLang = LANGUAGES.find(l => l.code === targetLanguage);
      
      const { data, error: fnError } = await supabase.functions.invoke('translate-message', {
        body: { 
          text: messageText, 
          targetLanguage: selectedLang?.name || 'English' 
        }
      });

      if (fnError) throw fnError;
      
      if (data.error) {
        throw new Error(data.error);
      }

      setTranslationResult(data);
      
      // Save preference
      localStorage.setItem('preferredTranslateLanguage', targetLanguage);
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err.message || 'Translation failed');
      toast({
        title: "Translation failed",
        description: err.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    if (translationResult?.translatedText) {
      navigator.clipboard.writeText(translationResult.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard" });
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Language Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Translate to</label>
        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <span className="flex items-center gap-2">
                  <span>{lang.name}</span>
                  <span className="text-muted-foreground text-xs">({lang.nativeName})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Original Message */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">Original</p>
          {translationResult?.detectedLanguage && (
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {translationResult.detectedLanguage}
            </span>
          )}
        </div>
        <p className="text-sm">{messageText || "(No text)"}</p>
      </div>

      {/* Translation Result */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 min-h-[80px]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">Translation</p>
          {translationResult && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>

        {isTranslating ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Translating...</span>
          </div>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={translateMessage}
              className="gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          </div>
        ) : translationResult ? (
          <p 
            className="text-sm"
            dir={translationResult.isRTL ? 'rtl' : 'ltr'}
            style={{ textAlign: translationResult.isRTL ? 'right' : 'left' }}
          >
            {translationResult.translatedText}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a language to translate
          </p>
        )}
      </div>

      {/* Powered by badge */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Languages className="w-3 h-3" />
        <span>Powered by AI</span>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-[20px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              Translate Message
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Translate Message
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
