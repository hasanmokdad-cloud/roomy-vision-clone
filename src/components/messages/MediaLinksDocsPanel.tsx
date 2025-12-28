import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Link as LinkIcon, Image as ImageIcon, Video, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface MediaItem {
  id: string;
  attachment_url: string;
  attachment_type: string;
  body: string | null;
  created_at: string;
}

interface MediaLinkDocsPanelProps {
  conversationId: string;
  onBack: () => void;
}

// Extract URLs from message body
const extractUrls = (text: string | null): string[] => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

export function MediaLinksDocsPanel({
  conversationId,
  onBack,
}: MediaLinkDocsPanelProps) {
  const isMobile = useIsMobile();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [allMessages, setAllMessages] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, [conversationId]);

  const loadMedia = async () => {
    try {
      // Fetch all messages to extract links from body
      const { data: allData, error: allError } = await supabase
        .from("messages")
        .select("id, attachment_url, attachment_type, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false });

      if (allError) throw allError;
      
      setAllMessages(allData || []);
      setMediaItems((allData || []).filter(item => item.attachment_url));
    } catch (error) {
      console.error("Error loading media:", error);
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  // Filter images (including image/* types and 'image' string)
  const images = mediaItems.filter(item => 
    item.attachment_type?.startsWith("image/") || 
    item.attachment_type === "image"
  );

  // Filter videos (including video/* types and 'video' string)
  const videos = mediaItems.filter(item => 
    item.attachment_type?.startsWith("video/") || 
    item.attachment_type === "video"
  );

  // Combined media (images + videos)
  const media = [...images, ...videos].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Filter documents (PDFs, Word, Excel, etc.)
  const documents = mediaItems.filter(item => 
    item.attachment_type?.includes("pdf") || 
    item.attachment_type?.includes("document") ||
    item.attachment_type?.includes("word") ||
    item.attachment_type?.includes("excel") ||
    item.attachment_type?.includes("spreadsheet") ||
    item.attachment_type?.includes("text/") ||
    (item.attachment_type?.includes("application/") && 
      !item.attachment_type?.includes("image") && 
      !item.attachment_type?.includes("video") &&
      !item.attachment_type?.includes("audio"))
  );

  // Extract links from message bodies
  const links = allMessages
    .map(msg => ({
      ...msg,
      urls: extractUrls(msg.body)
    }))
    .filter(msg => msg.urls.length > 0)
    .flatMap(msg => msg.urls.map(url => ({
      id: `${msg.id}-${url}`,
      url,
      created_at: msg.created_at
    })));

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">Media, links and docs</h2>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="media" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="media" className="flex-1">
            Media ({media.length})
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex-1">
            Docs ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="links" className="flex-1">
            Links ({links.length})
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="media" className="m-0 h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : media.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No photos or videos shared yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 p-1">
                {media.map((item) => {
                  const isVideo = item.attachment_type?.startsWith("video/") || item.attachment_type === "video";
                  return (
                    <div
                      key={item.id}
                      className="aspect-square bg-muted rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                      onClick={() => window.open(item.attachment_url, '_blank')}
                    >
                      {isVideo ? (
                        <>
                          <video
                            src={item.attachment_url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <img
                          src={item.attachment_url}
                          alt="Media"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="docs" className="m-0 h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No documents shared yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {documents.map((item) => {
                  const fileName = item.attachment_url.split("/").pop() || "Document";
                  return (
                    <a
                      key={item.id}
                      href={item.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
                    >
                      <FileText className="h-10 w-10 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {decodeURIComponent(fileName)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="links" className="m-0 h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : links.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <LinkIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No links shared yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {links.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
                  >
                    <LinkIcon className="h-10 w-10 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-primary">
                        {item.url}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </>
  );

  // Mobile: Full screen view
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-slide-in-right">
        {content}
      </div>
    );
  }

  // Desktop: Side panel
  return (
    <div className="w-96 border-l border-border bg-background h-full flex flex-col">
      {content}
    </div>
  );
}
