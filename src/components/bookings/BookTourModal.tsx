import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { sendNotification, NotificationTemplates } from "@/lib/sendNotification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";

interface BookTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dormId: string;
  dormName: string;
  ownerId: string;
}

export const BookTourModal = ({
  open,
  onOpenChange,
  dormId,
  dormName,
  ownerId,
}: BookTourModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time for your tour.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to book a tour.",
          variant: "destructive",
        });
        onOpenChange(false);
        return;
      }

      // Get student ID
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!student) {
        toast({
          title: "Profile Required",
          description: "Please complete your student profile first.",
          variant: "destructive",
        });
        return;
      }

      // Generate AI suggested questions
      const aiQuestionsResponse = await supabase.functions.invoke("generate-tour-questions", {
        body: { dormId, dormName }
      });

      const aiQuestions = aiQuestionsResponse.data?.questions || [
        "What is the WiFi speed like?",
        "Are utilities included in the rent?",
        "What are the quiet hours?",
        "Is there a security deposit required?",
        "How is the water pressure?",
      ];

      // Combine date and time
      const scheduledTime = new Date(`${selectedDate}T${selectedTime}`);

      // Insert tour booking
      const { error } = await supabase.from("tour_bookings").insert({
        student_id: student.id,
        owner_id: ownerId,
        dorm_id: dormId,
        scheduled_time: scheduledTime.toISOString(),
        student_message: message || null,
        ai_suggested_questions: aiQuestions,
      });

      if (error) throw error;

      // Send notification to owner
      const { data: owner } = await supabase
        .from('owners')
        .select('whatsapp_language, user_id')
        .eq('id', ownerId)
        .single();

      if (owner) {
        const ownerLang = owner.whatsapp_language?.toLowerCase() === 'ar' ? 'ar' : 'en';
        await sendNotification(
          owner.user_id,
          NotificationTemplates.TOUR_BOOKED,
          ownerLang,
          { dormId, dormName, scheduledTime: scheduledTime.toISOString() }
        );
      }

      setSuccess(true);
      toast({
        title: "Tour Booked Successfully! 🎉",
        description: `Your tour for ${dormName} is scheduled for ${selectedDate} at ${selectedTime}`,
      });

      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
        setSelectedDate("");
        setSelectedTime("");
        setMessage("");
      }, 3000);
    } catch (error: any) {
      console.error("Error booking tour:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book tour. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-center mb-2">Tour Booked!</h3>
            <p className="text-center text-muted-foreground">
              You'll receive a confirmation and reminders before your tour.
            </p>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Virtual Tour</DialogTitle>
          <DialogDescription>
            Schedule a video tour with the owner of {dormName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select Date
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Time
            </Label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Any specific questions or requirements..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500"
              disabled={loading}
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
