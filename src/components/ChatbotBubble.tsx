import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // ✅ Load Supabase user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
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

  // ✅ Core send function (calls Edge Function)
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("https://ujdkllljyjekglagjiyc.functions.supabase.co/roomy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          userId,
          sessionId,
        }),
      });

      const data = await res.json();
      console.log("✅ Gemini response:", data);

      if (!res.ok || data.error) {
        throw new Error(data.error || "AI service unavailable.");
      }

      const responseText = data.response || "Sorry, I could not process that request.";

      // ✅ Update memory session data
      if (data.sessionId) setSessionId(data.sessionId);
      if (typeof data.hasContext === "boolean") setHasContext(data.hasContext);

      if (data.sessionReset) {
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

  // ✅ Clears all AI memory (calls Supabase to delete session context)
  const handleResetMemory = async () => {
    try {
      if (userId && sessionId) {
        await supabase.from("ai_chat_sessions").delete().eq("user_id", userId).eq("session_id", sessionId);
      }
      handleReset();
      toast({
        title: "AI Memory Cleared",
        description: "Roomy AI has forgotten your previous preferences.",
      });
    } catch (err) {
      console.error("Memory reset failed:", err);
      toast({
        title: "Error",
        description: "Could not clear memory. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] glass rounded-2xl shadow-2xl flex flex-col z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex flex-col">
                <h3 className="font-bold text-lg">Roomy AI Assistant</h3>
                {hasContext && <span className="text-xs text-muted-foreground">💭 Remembers your preferences</span>}
              </div>
              <div className="flex gap-2">
                {userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleResetMemory}
                    className="hover:bg-destructive hover:text-destructive-foreground"
                    title="Reset AI Memory (clears all learned preferences)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                )}
                {hasContext && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    className="hover:bg-muted"
                    title="Reset conversation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-muted">
                  <X className="w-5 h-5" />
                </Button>
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
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center z-50"
        aria-label="Open Roomy AI Chat"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </motion.button>
    </>
  );
};
