import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface MediaItem {
  id: string;
  attachment_url: string;
  attachment_type: string;
  created_at: string;
}

interface MediaLinkDocsPanelProps {
  conversationId: string;
  onBack: () => void;
}

export function MediaLinksDocsPanel({
  conversationId,
  onBack,
}: MediaLinkDocsPanelProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, [conversationId]);

  const loadMedia = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, attachment_url, attachment_type, created_at")
        .eq("conversation_id", conversationId)
        .not("attachment_url", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMediaItems(data || []);
    } catch (error) {
      console.error("Error loading media:", error);
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  const images = mediaItems.filter(item => 
    item.attachment_type?.startsWith("image/")
  );

  const documents = mediaItems.filter(item => 
    item.attachment_type?.includes("pdf") || 
    item.attachment_type?.includes("document") ||
    item.attachment_type?.includes("application/")
  );

  const links = mediaItems.filter(item => 
    item.attachment_type === "link"
  );

  return (
    <div className="w-96 border-l border-border bg-background h-full flex flex-col">
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
            Media
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex-1">
            Docs
          </TabsTrigger>
          <TabsTrigger value="links" className="flex-1">
            Links
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="media" className="m-0 h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No photos or videos shared yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 p-1">
                {images.map((item) => (
                  <div
                    key={item.id}
                    className="aspect-square bg-muted rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={item.attachment_url}
                      alt="Media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
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
                {documents.map((item) => (
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
                        {item.attachment_url.split("/").pop() || "Document"}
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
                    href={item.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
                  >
                    <LinkIcon className="h-10 w-10 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.attachment_url}
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
    </div>
  );
}
