import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Sparkles, MapPin, DollarSign, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Dorm {
  id: string;
  dorm_name: string;
  area: string;
  monthly_price: number;
  amenities: string[];
  university: string;
}

interface FavoritesRecommendationsProps {
  userId: string;
}

export function FavoritesRecommendations({ userId }: FavoritesRecommendationsProps) {
  const [favorites, setFavorites] = useState<Dorm[]>([]);
  const [recommendations, setRecommendations] = useState<Dorm[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadFavoritesAndRecommendations();
  }, [userId]);

  const loadFavoritesAndRecommendations = async () => {
    try {
      // Load saved dorms
      const { data: savedItems } = await supabase
        .from("saved_items")
        .select("item_id")
        .eq("user_id", userId)
        .eq("item_type", "dorm");

      if (savedItems && savedItems.length > 0) {
        const dormIds = savedItems.map(item => item.item_id);
        const { data: favDorms } = await supabase
          .from("dorms")
          .select("id, dorm_name, area, monthly_price, amenities, university")
          .in("id", dormIds)
          .limit(3);

        setFavorites(favDorms || []);
      }

      // Get AI recommendations based on profile
      const { data: profile } = await supabase
        .from("students")
        .select("budget, preferred_university, favorite_areas, preferred_amenities")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile) {
        let query = supabase
          .from("dorms")
          .select("id, dorm_name, area, monthly_price, amenities, university")
          .eq("verification_status", "Verified")
          .limit(3);

        if (profile.budget) {
          query = query.lte("monthly_price", profile.budget);
        }

        if (profile.preferred_university) {
          query = query.eq("university", profile.preferred_university);
        }

        const { data: recDorms } = await query;
        setRecommendations(recDorms || []);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
      toast({
        title: "Error",
        description: "Failed to load favorites and recommendations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (dormId: string) => {
    try {
      await supabase
        .from("saved_items")
        .delete()
        .eq("user_id", userId)
        .eq("item_id", dormId);

      setFavorites(prev => prev.filter(d => d.id !== dormId));
      
      toast({
        title: "Removed",
        description: "Dorm removed from favorites.",
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-md border-border/40">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-md border-border/40 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          Favorites & AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Saved Favorites */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            Your Saved Dorms
          </h3>
          {favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved dorms yet. Start exploring!
            </p>
          ) : (
            <div className="space-y-3">
              {favorites.map((dorm) => (
                <motion.div
                  key={dorm.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-muted/20 rounded-lg border border-border/40 hover:border-primary/40 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{dorm.dorm_name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {dorm.area}
                        <span>•</span>
                        <DollarSign className="w-3 h-3" />
                        ${dorm.monthly_price}/mo
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/dorm/${dorm.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFavorite(dorm.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Recommended for You
          </h3>
          {recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Complete your profile to get personalized recommendations.
            </p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((dorm, idx) => (
                <motion.div
                  key={dorm.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-3 bg-primary/5 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{dorm.dorm_name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Match
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {dorm.area}
                        <span>•</span>
                        <DollarSign className="w-3 h-3" />
                        ${dorm.monthly_price}/mo
                      </div>
                      <p className="text-xs text-primary mt-1">
                        ✨ Similar price, great amenities, near {dorm.university}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/dorm/${dorm.id}`)}
                      className="bg-gradient-to-r from-primary to-secondary"
                    >
                      View
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={() => navigate("/listings")}
          variant="outline"
          className="w-full"
        >
          Explore All Dorms
        </Button>
      </CardContent>
    </Card>
  );
}
