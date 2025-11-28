import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video } from 'lucide-react';
import { MeetingLinkButton } from '@/components/bookings/MeetingLinkButton';
import { AddToCalendarDropdown } from '@/components/bookings/AddToCalendarDropdown';
import { type MeetingPlatform } from '@/lib/meetingUtils';

interface TourBookingMetadata {
  type: 'tour_booking' | 'tour_reminder';
  status: 'requested' | 'accepted' | 'declined' | 'cancelled';
  booking_id?: string;
  dorm_name: string;
  requested_date: string;
  requested_time: string;
  meeting_link?: string;
  meeting_platform?: MeetingPlatform;
  reminder_type?: '24h' | '1h' | '10min' | 'start';
}

interface TourMessageCardProps {
  metadata: TourBookingMetadata;
  message: {
    id: string;
    body: string;
    created_at: string;
    sender_id: string;
  };
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    requested: { variant: 'secondary', label: 'Pending' },
    accepted: { variant: 'default', label: 'Confirmed' },
    declined: { variant: 'destructive', label: 'Declined' },
    cancelled: { variant: 'outline', label: 'Cancelled' }
  };
  
  const config = variants[status] || { variant: 'secondary', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getReminderLabel = (type?: string) => {
  const labels: Record<string, string> = {
    '24h': 'in 24 hours',
    '1h': 'in 1 hour',
    '10min': 'in 10 minutes',
    'start': 'now'
  };
  return labels[type || ''] || '';
};

export function TourMessageCard({ metadata, message }: TourMessageCardProps) {
  const isReminder = metadata.type === 'tour_reminder';
  const showActions = metadata.status === 'accepted' && metadata.meeting_link;

  return (
    <Card className="max-w-md bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isReminder ? (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-sm">
                {isReminder ? '⏰ Tour Reminder' : '🎯 Tour Request'}
              </h4>
              {isReminder && metadata.reminder_type && (
                <p className="text-xs text-muted-foreground">
                  Starting {getReminderLabel(metadata.reminder_type)}
                </p>
              )}
            </div>
          </div>
          {!isReminder && getStatusBadge(metadata.status)}
        </div>

        {/* Dorm Info */}
        <div className="space-y-1">
          <p className="font-medium text-sm">{metadata.dorm_name}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {metadata.requested_date}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {metadata.requested_time}
            </div>
          </div>
        </div>

        {/* Meeting Platform */}
        {metadata.meeting_platform && (
          <div className="flex items-center gap-2 text-xs">
            <Video className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              Platform: <span className="font-medium">{
                metadata.meeting_platform === 'google_meet' ? 'Google Meet' :
                metadata.meeting_platform === 'zoom' ? 'Zoom' :
                metadata.meeting_platform === 'teams' ? 'Microsoft Teams' :
                'Video Call'
              }</span>
            </span>
          </div>
        )}

        {/* Message Body */}
        {message.body && (
          <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
            {message.body}
          </p>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-2">
            <MeetingLinkButton
              meetingLink={metadata.meeting_link}
              platform={metadata.meeting_platform}
              size="sm"
              className="flex-1 min-w-[140px] bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
            />
            <AddToCalendarDropdown
              booking={{
                id: metadata.booking_id || '',
                dorm_name: metadata.dorm_name,
                requested_date: metadata.requested_date,
                requested_time: metadata.requested_time,
                meeting_link: metadata.meeting_link,
                meeting_platform: metadata.meeting_platform
              }}
              size="sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}