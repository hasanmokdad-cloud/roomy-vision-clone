import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DormMatchCard } from "@/components/ai-match/DormMatchCard";
import { RoommateMatchCard } from "@/components/ai-match/RoommateMatchCard";
import { RoomMatchCard } from "@/components/ai-match/RoomMatchCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface StructuredSuggestions {
  dorms?: any[];
  rooms?: any[];
  roommates?: any[];
}

interface StructuredSuggestionsRendererProps {
  suggestions: StructuredSuggestions;
  maxCards?: number;
}

export function StructuredSuggestionsRenderer({
  suggestions,
  maxCards = 3,
}: StructuredSuggestionsRendererProps) {
  const navigate = useNavigate();
  const { dorms, rooms, roommates } = suggestions;

  const hasDorms = dorms && dorms.length > 0;
  const hasRooms = rooms && rooms.length > 0;
  const hasRoommates = roommates && roommates.length > 0;

  if (!hasDorms && !hasRooms && !hasRoommates) return null;

  const getNavigationMode = () => {
    if (hasDorms) return "dorm";
    if (hasRoommates) return "roommate";
    return "combined";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5 justify-start w-full"
    >
      {/* AI Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-2 ring-primary/20">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {/* Dorm Cards */}
        {hasDorms && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Here are {Math.min(dorms.length, maxCards)} dorm{dorms.length > 1 ? "s" : ""} that match:
            </p>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                {dorms.slice(0, maxCards).map((dorm, index) => (
                  <motion.div
                    key={dorm.id || index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-[280px] flex-shrink-0"
                  >
                    <DormMatchCard
                      dorm={dorm}
                      index={index}
                    />
                  </motion.div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Room Cards */}
        {hasRooms && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Found {Math.min(rooms.length, maxCards)} available room{rooms.length > 1 ? "s" : ""}:
            </p>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                {rooms.slice(0, maxCards).map((room, index) => (
                  <motion.div
                    key={room.id || index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-[280px] flex-shrink-0"
                  >
                    <RoomMatchCard
                      room={room}
                      index={index}
                    />
                  </motion.div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Roommate Cards */}
        {hasRoommates && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              {Math.min(roommates.length, maxCards)} compatible roommate{roommates.length > 1 ? "s" : ""}:
            </p>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                {roommates.slice(0, maxCards).map((roommate, index) => (
                  <motion.div
                    key={roommate.id || index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-[280px] flex-shrink-0"
                  >
                    <RoommateMatchCard
                      roommate={roommate}
                      index={index}
                      matchTier={roommate.matchTier || "basic"}
                    />
                  </motion.div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* View All Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/ai-match?mode=${getNavigationMode()}`)}
          className="mt-2"
        >
          View all matches in AI Match
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </motion.div>
  );
}
