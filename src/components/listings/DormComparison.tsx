import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCompare, Sparkles, Loader2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Dorm {
  id: string;
  dorm_name: string;
  area: string;
  monthly_price: number;
  amenities: string[];
  university: string;
  room_types: string;
  description: string;
}

interface DormComparisonProps {
  dorms: Dorm[];
  userId?: string | null;
}

export function DormComparison({ dorms, userId }: DormComparisonProps) {
  const [selectedDorms, setSelectedDorms] = useState<string[]>([]);
  const [comparison, setComparison] = useState<string>("");
  const [isComparing, setIsComparing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const toggleDormSelection = (dormId: string) => {
    setSelectedDorms(prev => {
      if (prev.includes(dormId)) {
        return prev.filter(id => id !== dormId);
      }
      if (prev.length >= 3) {
        toast({
          title: "Maximum Reached",
          description: "You can compare up to 3 dorms at a time.",
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, dormId];
    });
  };

  const generateComparison = async () => {
    if (selectedDorms.length < 2) {
      toast({
        title: "Select More Dorms",
        description: "Please select at least 2 dorms to compare.",
        variant: "destructive",
      });
      return;
    }

    setIsComparing(true);
    setIsOpen(true);

    try {
      const selectedDormsData = dorms.filter(d => selectedDorms.includes(d.id));
      
      const comparisonPrompt = `Compare these ${selectedDorms.length} dorms and provide a detailed analysis with pros and cons for each:

${selectedDormsData.map((dorm, idx) => `
Dorm ${idx + 1}: ${dorm.dorm_name}
- Location: ${dorm.area}
- University: ${dorm.university}
- Price: $${dorm.monthly_price}/month
- Room Types: ${dorm.room_types}
- Amenities: ${dorm.amenities?.join(", ") || "Not specified"}
- Description: ${dorm.description || "N/A"}
`).join("\n")}

Provide:
1. Side-by-side comparison of key features
2. Pros and cons for each dorm
3. Best fit recommendations based on different priorities (budget, location, amenities)
4. Overall recommendation`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roomy-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: comparisonPrompt,
            userId: userId || undefined,
            sessionId: `comparison-${Date.now()}`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate comparison");
      }

      setComparison(data.response);
    } catch (error) {
      console.error("Comparison error:", error);
      toast({
        title: "Error",
        description: "Failed to generate comparison. Please try again.",
        variant: "destructive",
      });
      setIsOpen(false);
    } finally {
      setIsComparing(false);
    }
  };

  const getFeatureValue = (dorm: Dorm, feature: string): boolean => {
    return dorm.amenities?.some(a => a.toLowerCase().includes(feature.toLowerCase())) || false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-primary" />
          <span className="font-semibold">Compare Dorms</span>
          {selectedDorms.length > 0 && (
            <Badge variant="secondary">{selectedDorms.length} selected</Badge>
          )}
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={generateComparison}
              disabled={selectedDorms.length < 2}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Compare
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Dorm Comparison Report
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              {isComparing ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Analyzing dorms with AI...</p>
                </div>
              ) : comparison ? (
                <div className="space-y-6">
                  {/* Quick Comparison Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 font-semibold">Feature</th>
                          {dorms.filter(d => selectedDorms.includes(d.id)).map(dorm => (
                            <th key={dorm.id} className="text-left p-2 font-semibold">
                              {dorm.dorm_name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="p-2 text-muted-foreground">Price</td>
                          {dorms.filter(d => selectedDorms.includes(d.id)).map(dorm => (
                            <td key={dorm.id} className="p-2">${dorm.monthly_price}/mo</td>
                          ))}
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-2 text-muted-foreground">Location</td>
                          {dorms.filter(d => selectedDorms.includes(d.id)).map(dorm => (
                            <td key={dorm.id} className="p-2">{dorm.area}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-2 text-muted-foreground">WiFi</td>
                          {dorms.filter(d => selectedDorms.includes(d.id)).map(dorm => (
                            <td key={dorm.id} className="p-2">
                              {getFeatureValue(dorm, "wifi") ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <X className="w-4 h-4 text-red-500" />
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-2 text-muted-foreground">Parking</td>
                          {dorms.filter(d => selectedDorms.includes(d.id)).map(dorm => (
                            <td key={dorm.id} className="p-2">
                              {getFeatureValue(dorm, "parking") ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <X className="w-4 h-4 text-red-500" />
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* AI Recommendation (before full analysis) */}
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-primary mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">AI Quick Recommendation</h4>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            const selectedDormsData = dorms.filter(d => selectedDorms.includes(d.id));
                            if (selectedDormsData.length === 0) return null;
                            
                            // Find best dorm based on price and amenities count
                            const bestDorm = selectedDormsData.reduce((best, current) => {
                              const currentScore = (current.amenities?.length || 0) - (current.monthly_price / 100);
                              const bestScore = (best.amenities?.length || 0) - (best.monthly_price / 100);
                              return currentScore > bestScore ? current : best;
                            }, selectedDormsData[0]);
                            
                            return (
                              <>
                                Based on value and amenities, <span className="font-semibold text-foreground">{bestDorm.dorm_name}</span> is the best overall option at ${bestDorm.monthly_price}/month with {bestDorm.amenities?.length || 0} amenities.
                              </>
                            );
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="prose prose-sm max-w-none">
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <div className="whitespace-pre-wrap">{comparison}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selection Chips */}
      <AnimatePresence>
        {selectedDorms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {dorms
              .filter(d => selectedDorms.includes(d.id))
              .map(dorm => (
                <Badge
                  key={dorm.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/20"
                  onClick={() => toggleDormSelection(dorm.id)}
                >
                  {dorm.dorm_name}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden checkboxes for selection */}
      <input type="hidden" data-comparison-selected={selectedDorms.join(",")} />
    </div>
  );
}

export function DormComparisonCheckbox({
  dormId,
  isSelected,
  onToggle,
}: {
  dormId: string;
  isSelected: boolean;
  onToggle: (dormId: string) => void;
}) {
  return (
    <div className="absolute top-4 right-4 z-10">
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(dormId)}
        className="bg-background/80 backdrop-blur-sm border-2"
      />
    </div>
  );
}
