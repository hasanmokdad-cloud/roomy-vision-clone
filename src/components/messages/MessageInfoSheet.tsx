import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Check, CheckCheck, Mic, Clock, Image, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { VoiceWaveform } from './VoiceWaveform';

interface MessageInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageText?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  seenAt?: string | null;
  playedAt?: string | null;
  isSender: boolean;
  attachmentType?: string | null;
  attachmentUrl?: string | null;
  attachmentDuration?: number | null;
}

export function MessageInfoSheet({
  open,
  onOpenChange,
  messageText,
  createdAt,
  deliveredAt,
  seenAt,
  playedAt,
  isSender,
  attachmentType,
  attachmentUrl,
  attachmentDuration,
}: MessageInfoSheetProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  const isVoiceMessage = attachmentType === 'audio';
  const isImageMessage = attachmentType === 'image';
  const isVideoMessage = attachmentType === 'video';

  // Get preview content
  const renderMessagePreview = () => {
    if (isVoiceMessage && attachmentUrl) {
      return (
        <div className="bg-muted rounded-lg p-3">
          <VoiceWaveform
            audioUrl={attachmentUrl}
            duration={attachmentDuration}
            isSender={false}
          />
        </div>
      );
    }

    if (isImageMessage && attachmentUrl) {
      return (
        <div className="relative w-full max-w-[200px] mx-auto rounded-lg overflow-hidden">
          <img
            src={attachmentUrl}
            alt="Message attachment"
            className="w-full h-auto object-cover"
          />
        </div>
      );
    }

    if (isVideoMessage && attachmentUrl) {
      return (
        <div className="relative w-full max-w-[200px] mx-auto rounded-lg overflow-hidden bg-muted flex items-center justify-center p-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Video</span>
        </div>
      );
    }

    if (messageText) {
      return (
        <div className="bg-muted rounded-lg p-3 max-w-full">
          <p className="text-sm break-words line-clamp-4">{messageText}</p>
        </div>
      );
    }

    return null;
  };

  // Status timeline items
  const getTimelineItems = () => {
    const items = [
      {
        label: 'Sent',
        time: createdAt,
        icon: <Check className="h-4 w-4" />,
        active: true,
        color: 'text-muted-foreground',
      },
    ];

    if (isSender) {
      items.push({
        label: 'Delivered',
        time: deliveredAt || null,
        icon: <CheckCheck className="h-4 w-4" />,
        active: !!deliveredAt,
        color: deliveredAt ? 'text-muted-foreground' : 'text-muted-foreground/40',
      });

      items.push({
        label: 'Read',
        time: seenAt || null,
        icon: <CheckCheck className="h-4 w-4" />,
        active: !!seenAt,
        color: seenAt ? 'text-blue-500' : 'text-muted-foreground/40',
      });

      // Only show "Played" for voice messages
      if (isVoiceMessage) {
        items.push({
          label: 'Played',
          time: playedAt || null,
          icon: <Mic className="h-4 w-4" />,
          active: !!playedAt,
          color: playedAt ? 'text-blue-500' : 'text-muted-foreground/40',
        });
      }
    }

    return items;
  };

  const timelineItems = getTimelineItems();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center">Message Info</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Message Preview */}
          <div className="flex justify-center">
            {renderMessagePreview()}
          </div>

          {/* Status Timeline */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {isSender ? 'Delivery Status' : 'Message Details'}
            </h3>

            <div className="space-y-0">
              {timelineItems.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 py-3 relative"
                >
                  {/* Timeline line */}
                  {index < timelineItems.length - 1 && (
                    <div
                      className={`absolute left-[11px] top-[36px] w-0.5 h-6 ${
                        timelineItems[index + 1].active
                          ? 'bg-muted-foreground/30'
                          : 'bg-muted-foreground/10'
                      }`}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      item.active ? 'bg-muted' : 'bg-muted/50'
                    } ${item.color}`}
                  >
                    {item.icon}
                  </div>

                  {/* Label and Time */}
                  <div className="flex-1 flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        item.active ? 'text-foreground' : 'text-muted-foreground/50'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.time ? (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(item.time)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
