import { useState } from 'react';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { UnderwaterScene } from '@/components/UnderwaterScene';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, MapPin, Instagram, Linkedin, Youtube, Facebook, Music, Pin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateName, validateEmail, sanitizeInput, validateMessage } from '@/utils/inputValidation';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppDropdown } from '@/components/shared/WhatsAppDropdown';
import { triggerContactEmailNotification } from '@/lib/contactNotifications';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

const CONTACT_CATEGORIES = [
  'General Inquiry',
  'Customer Support',
  'Business Partnership',
  'Press & Media',
  'Careers',
  'Feedback',
  'Technical Issue'
];

export default function Contact() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    category: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication first
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    // Check rate limiting
    const rateLimitKey = 'contact_form_limit';
    const rateLimitData = localStorage.getItem(rateLimitKey);
    
    if (rateLimitData) {
      const { timestamp, count } = JSON.parse(rateLimitData);
      const hoursSinceFirst = (Date.now() - timestamp) / (1000 * 60 * 60);
      
      if (hoursSinceFirst < 1 && count >= 3) {
        const minutesRemaining = Math.ceil((60 - (hoursSinceFirst * 60)));
        toast({
          title: 'Submission limit reached',
          description: `You've reached the limit of 3 submissions per hour. Try again in ${minutesRemaining} minutes.`,
          variant: 'destructive'
        });
        return;
      }
      
      // Reset counter if more than 1 hour has passed
      if (hoursSinceFirst >= 1) {
        localStorage.setItem(rateLimitKey, JSON.stringify({ timestamp: Date.now(), count: 1 }));
      } else {
        localStorage.setItem(rateLimitKey, JSON.stringify({ timestamp, count: count + 1 }));
      }
    } else {
      localStorage.setItem(rateLimitKey, JSON.stringify({ timestamp: Date.now(), count: 1 }));
    }

    setIsSubmitting(true);
    
    const newErrors: Record<string, string> = {};
    
    // Validate fields
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name (at least 2 characters)';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 3) {
      newErrors.subject = 'Please enter a subject (at least 3 characters)';
    }
    
    const messageValidation = validateMessage(formData.message);
    if (!messageValidation.valid) {
      newErrors.message = messageValidation.error || 'Invalid message';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }
    
    setErrors({});

    // Submit to database with sanitized input
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Parse full name into first and last name for database
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // 1. Insert into contact_messages
      const { error: contactError } = await supabase.from('contact_messages').insert({
        user_id: user?.id || null,
        first_name: sanitizeInput(firstName),
        last_name: sanitizeInput(lastName),
        email: formData.email,
        university: `[${formData.category}] ${sanitizeInput(formData.subject)}`,
        message: sanitizeInput(formData.message),
        status: 'new'
      });

      if (contactError) throw contactError;

      // 2. Create support conversation with admin (only for logged-in users)
      let conversationId = null;
      if (user?.id) {
        const { createSupportConversation } = await import('@/lib/conversationUtils');
        
        // Send only the message text, not formatted data
        conversationId = await createSupportConversation(user.id, sanitizeInput(formData.message));
        
        if (conversationId) {
          console.log("[Contact] ✅ Support conversation created:", conversationId);
        }
      }

      // 3. Send email notification
      await triggerContactEmailNotification({
        first_name: sanitizeInput(firstName),
        last_name: sanitizeInput(lastName),
        email: formData.email,
        university: `[${formData.category}] ${sanitizeInput(formData.subject)}`,
        message: sanitizeInput(formData.message),
      });

      toast({
        title: 'Message Sent Successfully! ✉️',
        description: user?.id && conversationId
          ? "We've received your message! Redirecting to chat with Roomy Support..."
          : "Thank you for contacting Roomy! We'll get back to you within 24 hours.",
      });

      // Redirect to messages if conversation was created
      if (user?.id && conversationId) {
        setTimeout(() => {
          window.location.href = '/messages';
        }, 1500);
      }

      setFormData({
        fullName: '',
        email: '',
        category: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <UnderwaterScene />
      {!isMobile && <RoomyNavbar />}
      
      <main className="flex-1 container mx-auto px-4 py-16 mt-20">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4 neon-glow">We're Here to Help</Badge>
            <h1 className="text-5xl md:text-6xl font-black gradient-text mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-foreground/80">
              Have questions? We'd love to hear from you!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-hover rounded-3xl p-10 neon-border"
            >
              <h2 className="text-3xl font-black mb-8 gradient-text">Contact Form</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={`bg-black/20 border-white/10 ${errors.fullName ? 'border-destructive' : ''}`}
                      placeholder="Your full name"
                    />
                    {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`bg-black/20 border-white/10 ${errors.email ? 'border-destructive' : ''}`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className={`bg-black/20 border-white/10 ${errors.category ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Input
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className={`bg-black/20 border-white/10 ${errors.subject ? 'border-destructive' : ''}`}
                      placeholder="Brief subject of your message"
                    />
                    {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject}</p>}
                  </div>
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className={`bg-black/20 border-white/10 resize-none ${errors.message ? 'border-destructive' : ''}`}
                    maxLength={500}
                    placeholder="Tell us more about your inquiry..."
                  />
                  {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{formData.message.length}/500</p>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-primary to-secondary">
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </motion.div>

            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="glass-hover rounded-3xl p-10 neon-border"
              >
                <h2 className="text-3xl font-black mb-8 gradient-text">Contact Info</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-sm text-foreground/70">info@roomylb.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Phone</p>
                      <p className="text-sm text-foreground/70 italic">Coming Soon</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Location</p>
                      <p className="text-sm text-foreground/70">Beirut, Lebanon</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="glass-hover rounded-3xl p-10 neon-border neon-glow"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2">WhatsApp Support</h3>
                  <p className="text-foreground/70">
                    Get instant help via WhatsApp
                  </p>
                </div>
                <WhatsAppDropdown />
              </motion.div>

              {/* Follow Us Section */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="glass-hover rounded-3xl p-10 neon-border"
              >
                <h3 className="text-xl font-bold mb-2">Follow Us</h3>
                <p className="text-foreground/70 mb-4">We're more fun on social media!</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Instagram - FUNCTIONAL */}
                  <a 
                    href="https://www.instagram.com/roomy.lebanon/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-foreground"
                  >
                    <Instagram className="w-5 h-5 text-primary" /> Instagram
                  </a>
                  {/* LinkedIn - placeholder */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60">
                    <Linkedin className="w-5 h-5" /> LinkedIn
                  </div>
                  {/* YouTube - placeholder */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60">
                    <Youtube className="w-5 h-5" /> YouTube
                  </div>
                  {/* TikTok - placeholder */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60">
                    <Music className="w-5 h-5" /> TikTok
                  </div>
                  {/* Facebook - placeholder */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60">
                    <Facebook className="w-5 h-5" /> Facebook
                  </div>
                  {/* Pinterest - placeholder */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60">
                    <Pin className="w-5 h-5" /> Pinterest
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
