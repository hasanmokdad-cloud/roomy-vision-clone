import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Sparkles, RefreshCw } from "lucide-react";
import { sanitizeInput } from "@/utils/inputValidation";
import { logAnalyticsEvent } from "@/utils/analytics";
import { useIsMobile } from "@/hooks/use-mobile";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

export default function AiChat() {
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [userPreferences, setUserPreferences] = useState<Record<string, any>>({});
  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || `guest_${Date.now()}`;
      setUserId(uid);
      setSessionId(uid);

      // Load chat history from Supabase
      const { data: chatSession } = await supabase
        .from("chat_sessions")
        .select("history")
        .eq("session_id", uid)
        .maybeSingle();

      if (chatSession?.history && Array.isArray(chatSession.history)) {
        const parsedHistory = (chatSession.history as any[]).map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: String(msg.content || ""),
          timestamp: msg.timestamp
        }));
        setMessages(parsedHistory.slice(-10));
      }

      // Load user preferences
      if (session) {
        const { data: pref } = await supabase
          .from("user_preferences")
          .select("preferences")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (pref?.preferences) {
          setUserPreferences(pref.preferences as Record<string, any>);
        }

        // Load user profile
        const { data: profile } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profile) {
          setUserProfile(profile);
        }
      }
    };

    loadSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (retryCount = 0) => {
    const trimmed = input.trim();
    
    if (!trimmed) {
      toast({
        title: "Empty message",
        description: "Please type a message first",
        variant: "destructive"
      });
      return;
    }

    if (trimmed.length > 500) {
      toast({
        title: "Message too long",
        description: "Please keep messages under 500 characters",
        variant: "destructive"
      });
      return;
    }

    const sanitized = sanitizeInput(trimmed);
    const userMsg: Message = { role: "user", content: sanitized, timestamp: new Date().toISOString() };
    
    // Log AI chat start if this is the first message
    if (messages.length === 0 && userId) {
      await logAnalyticsEvent({
        eventType: 'ai_chat_start',
        userId,
        metadata: { session_id: sessionId }
      });
    }
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const enrichedInput = {
        message: sanitized,
        userId: userId,
        sessionId: sessionId,
        preferences: userPreferences,
        student_profile: userProfile
      };

      const { data, error } = await supabase.functions.invoke("roomy-chat", {
        body: enrichedInput
      });

      if (error) throw error;

      if (!data || !data.response) {
        // Retry once if response is empty
        if (retryCount < 1) {
          console.log("Empty response, retrying...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          return sendMessage(retryCount + 1);
        }
        throw new Error("Empty response from AI");
      }

      const aiMsg: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (error: any) {
      console.error("Chat error:", error);
      
      let errorMessage = "Failed to get response. Please try again.";
      let shouldRetry = false;
      
      if (error.message?.includes("429") || error.message?.includes("Too many requests")) {
        errorMessage = "You're sending messages too quickly. Please wait a minute and try again.";
      } else if (error.message?.includes("402") || error.message?.includes("Payment required")) {
        errorMessage = "AI service temporarily unavailable. Please try again later.";
      } else if (error.message?.includes("Failed to fetch") || error.message?.includes("Network")) {
        errorMessage = "Network error. Retrying...";
        shouldRetry = true;
      }

      if (shouldRetry && retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return sendMessage(retryCount + 1);
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleReset = () => {
    setMessages([]);
    toast({
      title: "Chat reset",
      description: "Starting fresh conversation"
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0F1624] via-[#15203B] to-[#1a2847] w-full max-w-screen overflow-x-hidden">
      {!isMobile && <Navbar />}
      
      <main className="flex-1 container max-w-4xl mx-auto px-2 md:px-4 py-8 mt-20 flex flex-col overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white">AI-Powered Assistant</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 gradient-text">
            Chat with Roomy AI
          </h1>
          <p className="text-lg text-gray-300">
            Ask anything about dorms, roommates, or student living
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-6 overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        >
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <AnimatePresence>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-300 mb-2">👋 Hi! I'm Roomy AI</p>
                  <p className="text-gray-400 text-sm">Ask me anything about finding your perfect dorm!</p>
                </motion.div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-lg ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-primary to-secondary text-white"
                        : "bg-white/20 backdrop-blur-sm border border-white/30 text-gray-100"
                    }`}
                  >
                    <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 px-5 py-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-gray-300">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value);
                setInput(sanitized.substring(0, 500));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(0);
                }
              }}
              placeholder="Ask about dorms, prices, areas, amenities..."
              disabled={loading}
              className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400 focus:border-primary/50 rounded-xl px-4 py-3"
            />
            <Button
              onClick={() => sendMessage(0)}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all rounded-xl px-6"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          {messages.length > 0 && (
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
              className="mt-3 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Chat
            </Button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-gray-400"
        >
          💡 Try: "Show me private rooms near LAU under $600" or "What amenities are available?"
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
