import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Send } from "lucide-react";

interface BookingCalendarProps {
  dormId: string;
  dormName: string;
  ownerId: string;
  onSuccess?: () => void;
}

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM"
];

export function BookingCalendar({ dormId, dormName, ownerId, onSuccess }: BookingCalendarProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!date || !time) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!student) throw new Error("Student profile not found");

      const { error } = await supabase.from("bookings").insert([
        {
          dorm_id: dormId,
          student_id: student.id,
          owner_id: ownerId,
          requested_date: format(date, "yyyy-MM-dd"),
          requested_time: time,
          message: message.trim() || null,
          status: "pending",
        },
      ]);

      if (error) throw error;

      // Call edge function to send email notification
      await supabase.functions.invoke("send-booking-notification", {
        body: {
          ownerId,
          dormId,
          dormName,
          studentName: user.email,
          requestedDate: format(date, "PPP"),
          requestedTime: time,
          message: message.trim() || "No message provided",
        },
      });

      toast({
        title: "Booking Requested!",
        description: "The owner will review your request and respond soon",
      });

      setDate(undefined);
      setTime("");
      setMessage("");
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Schedule a Viewing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-3 block">Select Date</Label>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(date) => date < new Date()}
            className="rounded-md border"
          />
        </div>

        <div>
          <Label htmlFor="time" className="mb-2 block">Select Time</Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger id="time">
              <SelectValue placeholder="Choose a time slot" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {slot}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="message" className="mb-2 block">
            Message (Optional)
          </Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Any specific questions or requirements?"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-foreground/60 mt-1">
            {message.length}/500 characters
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !date || !time}
          className="w-full gap-2"
        >
          <Send className="w-4 h-4" />
          {loading ? "Sending Request..." : "Request Viewing"}
        </Button>
      </CardContent>
    </Card>
  );
}
