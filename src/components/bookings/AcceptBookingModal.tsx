import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Video } from "lucide-react";
import { format } from "date-fns";
import { sanitizeMeetingLink, type MeetingPlatform } from "@/lib/meetingUtils";

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
  onConfirm: (meetingLink: string, platform: MeetingPlatform, notes?: string) => Promise<void>;
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
  const [platform, setPlatform] = useState<MeetingPlatform>('google_meet');
  const [notes, setNotes] = useState("");
  const [urlError, setUrlError] = useState("");

  const handleSubmit = async () => {
    if (!meetingLink.trim()) {
      setUrlError("Meeting link is required");
      return;
    }
    
    // Sanitize and extract clean URL
    const { url, platform: detectedPlatform } = sanitizeMeetingLink(meetingLink.trim());
    
    if (!url) {
      setUrlError("Please enter a valid meeting URL");
      return;
    }
    
    // Use detected platform or fallback to selected platform
    const finalPlatform = detectedPlatform || platform;
    
    await onConfirm(url, finalPlatform, notes.trim() || undefined);
    
    // Reset form
    setMeetingLink("");
    setPlatform('google_meet');
    setNotes("");
    setUrlError("");
  };

  const getPlatformPlaceholder = () => {
    switch (platform) {
      case 'google_meet':
        return 'https://meet.google.com/xxx-xxxx-xxx';
      case 'zoom':
        return 'https://zoom.us/j/1234567890';
      case 'teams':
        return 'https://teams.microsoft.com/l/meetup-join/...';
      default:
        return 'Paste your meeting link here';
    }
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

          {/* Meeting Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">Meeting Platform *</Label>
            <Select value={platform || 'google_meet'} onValueChange={(val) => setPlatform(val as MeetingPlatform)}>
              <SelectTrigger id="platform">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google_meet">Google Meet</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="teams">Microsoft Teams</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Link */}
          <div className="space-y-2">
            <Label htmlFor="meeting-link" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Meeting Link *
            </Label>
            <Input
              id="meeting-link"
              type="text"
              value={meetingLink}
              onChange={(e) => {
                setMeetingLink(e.target.value);
                setUrlError("");
              }}
              placeholder={getPlatformPlaceholder()}
              required
              className={urlError ? "border-destructive" : ""}
            />
            {urlError && (
              <p className="text-xs text-destructive">{urlError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Paste the meeting link here. Extra text from calendar invites will be automatically cleaned.
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
