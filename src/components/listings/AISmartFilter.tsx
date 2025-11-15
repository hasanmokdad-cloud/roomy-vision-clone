import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface AISmartFilterProps {
  onFiltersApplied: (filters: {
    priceRange?: [number, number];
    universities?: string[];
    areas?: string[];
    roomTypes?: string[];
    searchQuery?: string;
  }) => void;
  userId?: string | null;
}

export function AISmartFilter({ onFiltersApplied, userId }: AISmartFilterProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const { toast } = useToast();

  const handleAIFilter = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setSuggestion("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roomy-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: query,
            userId: userId || undefined,
            sessionId: `ai-filter-${Date.now()}`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process AI filter");
      }

      // Extract filter information from AI response
      const filters: any = {};
      const responseText = data.response.toLowerCase();

      // Extract budget
      const budgetMatch = responseText.match(/\$?(\d{2,4})/);
      if (budgetMatch) {
        const budget = parseInt(budgetMatch[1]);
        filters.priceRange = [0, budget];
      }

      // Extract universities
      const universities = ["lau", "aub", "usek", "usj", "balamand", "bau", "lu", "haigazian"];
      const foundUniversities = universities.filter(u => responseText.includes(u));
      if (foundUniversities.length > 0) {
        filters.universities = foundUniversities.map(u => u.toUpperCase());
      }

      // Extract areas
      const areas = ["hamra", "jbeil", "byblos", "verdun", "raoucheh", "hazmieh", "badaro", "dekowaneh", "manara", "blat", "fidar"];
      const foundAreas = areas.filter(a => responseText.includes(a));
      if (foundAreas.length > 0) {
        filters.areas = foundAreas;
      }

      // Extract room types
      const roomTypes = ["shared", "single", "private", "studio", "apartment"];
      const foundRoomTypes = roomTypes.filter(r => responseText.includes(r));
      if (foundRoomTypes.length > 0) {
        filters.roomTypes = foundRoomTypes;
      }

      // Set search query for additional filtering
      filters.searchQuery = query;

      onFiltersApplied(filters);
      setSuggestion(data.response);

      toast({
        title: "AI Filters Applied",
        description: "Smart filters have been applied based on your request.",
      });
    } catch (error) {
      console.error("AI Filter error:", error);
      toast({
        title: "Error",
        description: "Failed to process AI filter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Try: 'Find a quiet dorm near LAU with parking under $600'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAIFilter()}
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          onClick={handleAIFilter}
          disabled={isLoading || !query.trim()}
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-primary/10 border border-primary/20 rounded-lg"
          >
            <p className="text-sm text-foreground/80">
              <Sparkles className="w-4 h-4 inline mr-2 text-primary" />
              {suggestion}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
