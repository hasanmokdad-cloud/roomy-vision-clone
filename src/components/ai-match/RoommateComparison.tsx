import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { GitCompare, Sparkles, X, Check, GraduationCap, DollarSign, MapPin, Home, Brain, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Roommate {
  id: string;
  full_name: string;
  gender: string;
  age?: number;
  university?: string;
  major?: string;
  year_of_study?: string;
  budget?: number;
  preferred_housing_area?: string;
  needs_dorm?: boolean;
  needs_roommate_current_place?: boolean;
  personality_test_completed?: boolean;
  personality_traits?: any;
  current_dorm?: { name: string };
  current_room?: { capacity: number; capacity_occupied: number };
}

interface RoommateComparisonProps {
  roommates: Roommate[];
  matchTier?: 'basic' | 'advanced' | 'vip';
}

export function RoommateComparison({ roommates, matchTier = 'basic' }: RoommateComparisonProps) {
  const [selectedRoommates, setSelectedRoommates] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const toggleRoommateSelection = (roommateId: string) => {
    setSelectedRoommates(prev => {
      if (prev.includes(roommateId)) {
        return prev.filter(id => id !== roommateId);
      }
      if (prev.length >= 3) {
        toast({
          title: "Maximum Reached",
          description: "You can compare up to 3 roommates at a time.",
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, roommateId];
    });
  };

  const selectedRoommatesData = roommates.filter(r => selectedRoommates.includes(r.id));

  const handleCompare = () => {
    if (selectedRoommates.length < 2) {
      toast({
        title: "Select More Roommates",
        description: "Please select at least 2 roommates to compare.",
        variant: "destructive",
      });
      return;
    }
    setIsOpen(true);
  };

  const getFeatureValue = (roommate: Roommate, feature: string): string => {
    switch (feature) {
      case 'gender': return roommate.gender || 'Not specified';
      case 'age': return roommate.age ? `${roommate.age} years` : 'Not specified';
      case 'university': return roommate.university || 'Not specified';
      case 'major': return roommate.major || 'Not specified';
      case 'year': return roommate.year_of_study || 'Not specified';
      case 'budget': return roommate.budget ? `$${roommate.budget}/month` : 'Not specified';
      case 'area': return roommate.preferred_housing_area || 'Not specified';
      case 'needs': {
        if (roommate.needs_dorm) return 'Looking for dorm';
        if (roommate.needs_roommate_current_place && roommate.current_dorm) {
          return `Has dorm (${roommate.current_dorm.name})`;
        }
        return 'Not specified';
      }
      case 'personality': {
        if (matchTier === 'basic') return '🔒 Locked';
        return roommate.personality_test_completed ? '✅ Completed' : '❌ Not completed';
      }
      default: return '';
    }
  };

  const features = [
    { key: 'gender', label: 'Gender', icon: User },
    { key: 'age', label: 'Age', icon: User },
    { key: 'university', label: 'University', icon: GraduationCap },
    { key: 'major', label: 'Major', icon: GraduationCap },
    { key: 'year', label: 'Year of Study', icon: GraduationCap },
    { key: 'budget', label: 'Budget', icon: DollarSign },
    { key: 'area', label: 'Preferred Area', icon: MapPin },
    { key: 'needs', label: 'Housing Status', icon: Home },
    ...(matchTier !== 'basic' ? [{ key: 'personality', label: 'Personality Match', icon: Brain }] : [])
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <GitCompare className="w-5 h-5" />
          Compare Roommates
        </h3>
        <Button
          onClick={handleCompare}
          disabled={selectedRoommates.length < 2}
          variant="default"
          size="sm"
        >
          <Sparkles className="mr-2 w-4 h-4" />
          Compare {selectedRoommates.length > 0 && `(${selectedRoommates.length})`}
        </Button>
      </div>

      {/* Selected Badges */}
      <AnimatePresence>
        {selectedRoommates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {selectedRoommatesData.map(roommate => (
              <Badge
                key={roommate.id}
                variant="secondary"
                className="pl-3 pr-2 py-1.5 gap-2 cursor-pointer hover:bg-secondary/80"
                onClick={() => toggleRoommateSelection(roommate.id)}
              >
                {roommate.full_name}
                <X className="w-3 h-3" />
              </Badge>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              Roommate Comparison
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              {/* Comparison Table */}
              <Card className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Feature</th>
                        {selectedRoommatesData.map(roommate => (
                          <th key={roommate.id} className="text-left p-3 font-semibold">
                            {roommate.full_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {features.map(({ key, label, icon: Icon }) => (
                        <tr key={key} className="border-b hover:bg-muted/50">
                          <td className="p-3 flex items-center gap-2 font-medium">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            {label}
                          </td>
                          {selectedRoommatesData.map(roommate => (
                            <td key={roommate.id} className="p-3">
                              {getFeatureValue(roommate, key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* AI Recommendation */}
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">AI Recommendation</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedRoommatesData.length > 0 && (
                        <>
                          Based on your profile, <span className="font-semibold text-foreground">{selectedRoommatesData[0].full_name}</span> appears to be the most compatible match
                          {matchTier !== 'basic' ? ' according to personality and lifestyle preferences' : ' based on basic preferences'}.
                        </>
                      )}
                    </p>
                    {matchTier === 'basic' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Upgrade to Advanced or VIP for detailed personality compatibility analysis
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Hidden checkboxes for selection */}
      <input type="hidden" value={selectedRoommates.join(',')} />
    </div>
  );
}

// Checkbox overlay component for roommate cards
export function RoommateComparisonCheckbox({ 
  roommateId, 
  isSelected, 
  onToggle 
}: { 
  roommateId: string; 
  isSelected: boolean; 
  onToggle: (id: string) => void;
}) {
  return (
    <div 
      className="absolute top-3 left-3 z-10 cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onToggle(roommateId);
      }}
    >
      <div className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-all ${
        isSelected 
          ? 'bg-primary border-primary' 
          : 'bg-background/80 border-border hover:border-primary'
      }`}>
        {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
      </div>
    </div>
  );
}
