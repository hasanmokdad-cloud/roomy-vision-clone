import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RoomyNavbar } from "@/components/RoomyNavbar";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, RefreshCw, Home, DollarSign, Users } from "lucide-react";
import { sanitizeInput } from "@/utils/inputValidation";
import { logAnalyticsEvent } from "@/utils/analytics";
import { useIsMobile } from "@/hooks/use-mobile";

// New AI Chat Components
import { AIAssistantHeader } from "@/components/ai-chat/AIAssistantHeader";
import { ContextPills } from "@/components/ai-chat/ContextPills";
import { ChatMessageBubble } from "@/components/ai-chat/ChatMessageBubble";
import { QuickActionChips, defaultQuickActions } from "@/components/ai-chat/QuickActionChips";
import { AITypingIndicator } from "@/components/ai-chat/AITypingIndicator";
import { ErrorRetryBubble } from "@/components/ai-chat/ErrorRetryBubble";
import { StructuredSuggestionsRenderer } from "@/components/ai-chat/StructuredSuggestionsRenderer";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  followUpActions?: Array<{ label: string; query: string }>;
  quickChips?: Array<{ label: string; query: string; icon?: string }>;
  structuredSuggestions?: {
    dorms?: any[];
    rooms?: any[];
    roommates?: any[];
  };
  isError?: boolean;
};

interface UserContext {
  budget?: number;
  university?: string;
  preferred_area?: string;
  need_dorm?: boolean;
  need_roommate?: boolean;
  gender?: string;
  personality_enabled?: boolean;
}

export default function AiChat() {
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [userPreferences, setUserPreferences] = useState<Record<string, any>>({});
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showContextPills, setShowContextPills] = useState(false);
  const [lastSentMessage, setLastSentMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Derive user context from profile
  const userContext: UserContext = {
    budget: userProfile?.budget,
    university: userProfile?.university,
    preferred_area: userProfile?.preferred_area,
    need_dorm: userProfile?.accommodation_status === "need_dorm",
    need_roommate: userProfile?.need_roommate,
    gender: userProfile?.gender,
    personality_enabled: userProfile?.personality_completed,
  };

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
          timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
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

  const sendMessage = async (messageText: string, isRetry = false) => {
    const trimmed = messageText.trim();
    
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
    setLastSentMessage(sanitized);
    
    if (!isRetry) {
      const userMsg: Message = { 
        role: "user", 
        content: sanitized, 
        timestamp: new Date() 
      };
      
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
      setRetryCount(0);
    }
    
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
          setRetryCount(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return sendMessage(sanitized, true);
        }
        throw new Error("Empty response from AI");
      }

      // Parse follow-up actions and quick chips from response
      const followUpActions = data.followUpActions || [];
      const quickChips = data.quickChips || determineQuickChips(data.response);
      const structuredSuggestions = data.structured_suggestions;

      const aiMsg: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        followUpActions,
        quickChips,
        structuredSuggestions,
      };

      setMessages(prev => [...prev, aiMsg]);
      setRetryCount(0);

    } catch (error: any) {
      console.error("Chat error:", error);
      
      let errorMessage = "Failed to get response. Please try again.";
      
      if (error.message?.includes("429") || error.message?.includes("Too many requests")) {
        errorMessage = "You're sending messages too quickly. Please wait a minute and try again.";
      } else if (error.message?.includes("402") || error.message?.includes("Payment required")) {
        errorMessage = "AI service temporarily unavailable. Please try again later.";
      } else if (error.message?.includes("Failed to fetch") || error.message?.includes("Network")) {
        errorMessage = "Network error. Please check your connection.";
      }

      // Add error message to chat
      const errorMsg: Message = {
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Determine quick chips based on response content
  const determineQuickChips = (response: string): Array<{ label: string; query: string; icon?: string }> => {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes("dorm") || lowerResponse.includes("room")) {
      return defaultQuickActions.afterDorm;
    }
    if (lowerResponse.includes("roommate") || lowerResponse.includes("compatible")) {
      return defaultQuickActions.afterRoommate;
    }
    if (lowerResponse.includes("not available") || lowerResponse.includes("mismatch") || lowerResponse.includes("doesn't match")) {
      return defaultQuickActions.afterMismatch;
    }
    return [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleChipClick = (query: string) => {
    sendMessage(query);
  };

  const handleFollowUpClick = (query: string, displayText: string) => {
    // Add visible user message
    const userMsg: Message = {
      role: "user",
      content: displayText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    
    // Send the actual query
    setLoading(true);
    sendMessage(query, true);
  };

  const handleRetry = () => {
    if (lastSentMessage) {
      // Remove the error message
      setMessages(prev => prev.filter(m => !m.isError));
      sendMessage(lastSentMessage, true);
    }
  };

  const handleReset = () => {
    setMessages([]);
    toast({
      title: "Chat reset",
      description: "Starting fresh conversation"
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-background via-muted/20 to-background w-full max-w-screen overflow-x-hidden">
      {!isMobile && <RoomyNavbar />}
      
      <main className={`flex-1 flex flex-col ${!isMobile ? 'mt-16' : ''}`}>
        {/* Fixed Container */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Header */}
          <AIAssistantHeader
            needDorm={userContext.need_dorm}
            needRoommate={userContext.need_roommate}
            showContextPills={showContextPills}
            onToggleContext={() => setShowContextPills(prev => !prev)}
            isMobile={isMobile}
          />

          {/* Context Pills */}
          <ContextPills context={userContext} isVisible={showContextPills} />

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden flex flex-col px-4 py-4">
            <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              <AnimatePresence mode="popLayout">
                {/* Welcome State */}
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="py-8 text-center"
                  >
                    <motion.div 
                      className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.3)]"
                      animate={{ 
                        boxShadow: [
                          "0 0 40px rgba(139,92,246,0.3)",
                          "0 0 60px rgba(139,92,246,0.4)",
                          "0 0 40px rgba(139,92,246,0.3)",
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="text-3xl">🏠</span>
                    </motion.div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      👋 Hi! I'm Roomy AI
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Ask me anything about finding your perfect dorm or roommate!
                    </p>

                    {/* Initial Quick Actions */}
                    <div className="flex flex-wrap justify-center gap-2">
                      <QuickActionChips
                        chips={defaultQuickActions.initial}
                        onChipClick={handleChipClick}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Messages */}
                {messages.map((msg, i) => (
                  <div key={i}>
                    {msg.isError ? (
                      <ErrorRetryBubble
                        errorMessage={msg.content}
                        onRetry={handleRetry}
                        isRetrying={loading}
                      />
                    ) : msg.structuredSuggestions && (msg.structuredSuggestions.dorms?.length || msg.structuredSuggestions.rooms?.length || msg.structuredSuggestions.roommates?.length) ? (
                      <>
                        <ChatMessageBubble
                          role={msg.role}
                          content={msg.content}
                          timestamp={msg.timestamp}
                        />
                        <div className="mt-3">
                          <StructuredSuggestionsRenderer
                            suggestions={msg.structuredSuggestions}
                          />
                        </div>
                        {msg.quickChips && msg.quickChips.length > 0 && (
                          <div className="mt-2 ml-10">
                            <QuickActionChips
                              chips={msg.quickChips}
                              onChipClick={handleChipClick}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <ChatMessageBubble
                        role={msg.role}
                        content={msg.content}
                        timestamp={msg.timestamp}
                        followUpActions={msg.followUpActions}
                        quickChips={msg.quickChips}
                        onChipClick={handleChipClick}
                        onFollowUpClick={handleFollowUpClick}
                      />
                    )}
                  </div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              <AnimatePresence>
                {loading && <AITypingIndicator />}
              </AnimatePresence>
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions Row (Above Input) */}
          {messages.length > 0 && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 border-t border-border/50 bg-background/50 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Quick:</span>
                <button 
                  onClick={() => handleChipClick("Show me dorms")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                >
                  <Home className="w-3 h-3" />
                  Dorms
                </button>
                <button 
                  onClick={() => handleChipClick("Show me dorms under $500")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors whitespace-nowrap"
                >
                  <DollarSign className="w-3 h-3" />
                  Under $500
                </button>
                <button 
                  onClick={() => handleChipClick("Find me compatible roommates")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors whitespace-nowrap"
                >
                  <Users className="w-3 h-3" />
                  Roommates
                </button>
              </div>
            </motion.div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl safe-area-bottom">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  const sanitized = sanitizeInput(e.target.value);
                  setInput(sanitized.substring(0, 500));
                }}
                placeholder="Ask about dorms, prices, areas..."
                disabled={loading}
                className="flex-1 bg-muted/50 border-border/50 focus:border-primary/50 rounded-xl px-4 py-3"
                aria-label="Chat message input"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all rounded-xl px-6"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>

            {messages.length > 0 && (
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="mt-2 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Chat
              </Button>
            )}
          </div>
        </div>
      </main>

      {!isMobile && <Footer />}
    </div>
  );
}
