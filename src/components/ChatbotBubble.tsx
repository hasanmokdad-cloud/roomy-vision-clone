import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const ChatbotBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi 👋 I'm Roomy AI! I can help you find dorms by budget, area, university, and room type. I'll remember our conversation to help you better!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasContext, setHasContext] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [shouldShow, setShouldShow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();
  const isMobile = useIsMobile();

  // ✅ Load Supabase user session and chat history + check user role
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      
      // Check user role for visibility rules
      if (uid) {
        const { data: ownerData } = await supabase
          .from('owners')
          .select('id')
          .eq('user_id', uid)
          .maybeSingle();
        
        if (ownerData) {
          setUserRole('owner');
        } else {
          const { data: studentData } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', uid)
            .maybeSingle();
          
          if (studentData) {
            setUserRole('student');
          } else {
            const { data: adminData } = await supabase
              .from('admins')
              .select('id')
              .eq('user_id', uid)
              .maybeSingle();
            
            if (adminData) {
              setUserRole('admin');
            }
          }
        }
        
        const tempSessionId = `session_${uid}_${Date.now()}`;
        setSessionId(tempSessionId);
        
        const { data: previousMessages } = await supabase
          .from("ai_chat_sessions")
          .select("role, message")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (previousMessages && previousMessages.length > 0) {
          const formattedMessages = previousMessages
            .reverse()
            .map((msg: any) => ({
              role: msg.role as "user" | "assistant",
              content: msg.message
            }));
          
          setMessages([
            {
              role: "assistant",
              content: "Hi 👋 I'm Roomy AI! I can help you find dorms by budget, area, university, and room type. I'll remember our conversation to help you better!",
            },
            ...formattedMessages
          ]);
          setHasContext(true);
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ Always scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ✅ Visibility rules based on role and route
  useEffect(() => {
    // Owners never see the chatbot
    if (userRole === 'owner') {
      setShouldShow(false);
      return;
    }
    
    // Students on mobile: show everywhere EXCEPT /messages and /ai-match
    if (userRole === 'student' && isMobile) {
      const hiddenRoutes = ['/messages', '/ai-match'];
      setShouldShow(!hiddenRoutes.includes(location.pathname));
      return;
    }
    
    // Students on desktop: show everywhere (existing behavior)
    // Admins: show everywhere (existing behavior)
    if (userRole === 'student' || userRole === 'admin') {
      setShouldShow(true);
      return;
    }
    
    // Default: hide if no role determined yet
    setShouldShow(false);
  }, [userRole, location.pathname, isMobile]);

  // ✅ Listen for programmatic open events
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsOpen(true);
      if (customEvent.detail?.dormContext?.initialPrompt) {
        setInput(customEvent.detail.dormContext.initialPrompt);
      }
    };
    window.addEventListener('openRoomyChatbot', handleOpenChat);
    return () => window.removeEventListener('openRoomyChatbot', handleOpenChat);
  }, []);

  // ✅ Core send function (calls Edge Function)
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('roomy-chat', {
        body: {
          message: userMessage,
          userId,
          sessionId,
        }
      });

      // Check for edge function error
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "AI service unavailable");
      }

      // Check if data exists
      if (!data) {
        throw new Error("No response from AI service");
      }

      // Check if data is a Response object or has streaming body (shouldn't happen with invoke)
      if (data instanceof Response || (data as any)?.body instanceof ReadableStream) {
        console.error("Received streaming response instead of JSON");
        throw new Error("AI service returned unexpected format");
      }

      // Check for explicit error in response
      if (data.error) {
        console.error("AI response error:", data.error);
        throw new Error(data.error);
      }

      // Safely get response text with validation
      const responseText = data.response;
      if (!responseText || typeof responseText !== 'string') {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response from AI service");
      }

      // ✅ Update memory session data
      if (data?.sessionId) setSessionId(data.sessionId);
      if (typeof data?.hasContext === "boolean") setHasContext(data.hasContext);

      if (data?.sessionReset) {
        setMessages([
          {
            role: "assistant",
            content:
              "Hi 👋 I'm Roomy AI! I can help you find dorms by budget, area, university, and room type. I'll remember our conversation to help you better!",
          },
          { role: "assistant", content: responseText },
        ]);
        setSessionId(null);
        setHasContext(false);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
      }
    } catch (err) {
      console.error("❌ Chat error:", err);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error while connecting to Roomy AI. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Resets only conversation (not memory)
  const handleReset = async () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi 👋 I'm Roomy AI! I can help you find dorms by budget, area, university, and room type. I'll remember our conversation to help you better!",
      },
    ]);
    setSessionId(null);
    setHasContext(false);
  };

  // ✅ Clear AI Memory (deletes session from DB)
  const handleResetMemory = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please sign in to reset memory.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete all chat sessions for this user
      const { error: chatError } = await supabase
        .from("ai_chat_sessions")
        .delete()
        .eq("user_id", userId);
      
      // Delete chat session context
      if (sessionId) {
        await supabase
          .from("chat_sessions")
          .delete()
          .eq("session_id", sessionId);
      }

      if (chatError) throw chatError;

      setMessages([
        {
          role: "assistant",
          content: "✨ AI memory reset! I've forgotten all your preferences. Let's start fresh!",
        },
      ]);
      setSessionId(`session_${userId}_${Date.now()}`);
      setHasContext(false);

      toast({
        title: "Memory Reset",
        description: "AI memory has been cleared successfully.",
      });
    } catch (err) {
      console.error("❌ Error resetting memory:", err);
      toast({
        title: "Error",
        description: "Failed to reset AI memory. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Don't render if shouldn't show
  if (!shouldShow) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-28 md:bottom-6 right-4 w-[calc(100vw-2rem)] max-w-96 h-[500px] glass rounded-2xl shadow-2xl flex flex-col z-50"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex flex-col">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  💬 Roomy AI
                  {hasContext && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                      Memory Active
                    </span>
                  )}
                </h3>
                {hasContext && <span className="text-xs text-muted-foreground">💭 Remembers your preferences</span>}
              </div>
              <div className="flex items-center gap-2">
                {userId && (
                  <button
                    onClick={handleResetMemory}
                    className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
                    aria-label="Reset AI Memory"
                    title="Reset AI Memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-100" />
                        <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about dorms..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-28 md:bottom-6 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center z-50"
        style={{
          marginBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label="Open Roomy AI Chat"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </motion.button>
    </>
  );
};
