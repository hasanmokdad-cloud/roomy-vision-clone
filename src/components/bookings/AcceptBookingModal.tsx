import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, Video } from "lucide-react";
import { format } from "date-fns";

interface AcceptBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    student_name?: string;
    dorm_name?: string;
    requested_date: string;
    requested_time: string;
    message?: string | null;
  };
  onConfirm: (meetingLink: string, notes?: string) => Promise<void>;
  loading?: boolean;
}

export function AcceptBookingModal({
  open,
  onOpenChange,
  booking,
  onConfirm,
  loading = false
}: AcceptBookingModalProps) {
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!meetingLink.trim()) return;
    
    await onConfirm(meetingLink.trim(), notes.trim() || undefined);
    setMeetingLink("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Accept Tour Request</DialogTitle>
          <DialogDescription>
            Provide a Google Meet link for the virtual tour
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Details */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="font-semibold">{booking.student_name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {format(new Date(booking.requested_date), 'PPP')}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {booking.requested_time}
            </div>
            {booking.message && (
              <p className="text-muted-foreground italic mt-2">
                "{booking.message}"
              </p>
            )}
          </div>

          {/* Google Meet Link */}
          <div className="space-y-2">
            <Label htmlFor="meeting-link" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Google Meet Link *
            </Label>
            <Input
              id="meeting-link"
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              required
            />
            <p className="text-xs text-muted-foreground">
              Create a meeting on Google Meet and paste the link here
            </p>
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information for the student..."
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Actions */}
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
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500"
              disabled={loading || !meetingLink.trim()}
            >
              {loading ? "Accepting..." : "Confirm & Accept"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
