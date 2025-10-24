import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DormCard } from './DormCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const quickReplies = [
  { emoji: '🏠', text: 'Show dorms near LAU' },
  { emoji: '💰', text: 'Dorms under $500/month' },
  { emoji: '🧍‍♀️', text: 'Find female-only dorms' },
];

export const ChatModal = ({ isOpen, onClose, userId }: ChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi 👋 I'm Roomy AI! I can help you find dorms that fit your budget, university, and preferences.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dorms, setDorms] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchDorms = async (query: string) => {
    const { data, error } = await supabase
      .from('dorms')
      .select('*')
      .eq('available', true)
      .limit(3);

    if (!error && data) {
      setDorms(data);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Fetch dorms for context
      await fetchDorms(messageText);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roomy-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userId,
        }),
      });

      if (response.status === 429 || response.status === 402) {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let textBuffer = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;

        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantMessage;
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save to database
      await supabase.from('ai_sessions').insert({
        user_id: userId,
        query: messageText,
        response: assistantMessage,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  const logDormInteraction = async (dormId: string, action: string) => {
    await supabase.from('ai_recommendations_log').insert({
      user_id: userId,
      dorm_id: dormId,
      action,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-hover rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold gradient-text">Roomy AI Assistant</h2>
                <p className="text-xs text-foreground/60 mt-1">powered by AI ✨</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-primary to-secondary text-white'
                        : 'glass'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-foreground/60">Typing...</span>
                  </div>
                </div>
              )}

              {dorms.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground/80">Found these dorms for you:</p>
                  {dorms.map((dorm) => (
                    <DormCard
                      key={dorm.id}
                      dorm={dorm}
                      onViewDetails={() => logDormInteraction(dorm.id, 'viewed')}
                    />
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length === 1 && (
              <div className="px-6 pb-4 flex gap-2 flex-wrap">
                {quickReplies.map((reply, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReply(reply.text)}
                    className="glass border-white/10 hover:bg-white/10"
                  >
                    <span className="mr-2">{reply.emoji}</span>
                    {reply.text}
                  </Button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-6 border-t border-white/10">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask me anything about dorms..."
                  className="bg-black/20 border-white/10 text-foreground placeholder:text-foreground/40"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};