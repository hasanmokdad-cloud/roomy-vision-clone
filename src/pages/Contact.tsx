import { useState, useEffect } from 'react';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { UnderwaterScene } from '@/components/UnderwaterScene';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateName, validateEmail, sanitizeInput, validateMessage } from '@/utils/inputValidation';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppDropdown } from '@/components/shared/WhatsAppDropdown';
import { triggerContactEmailNotification } from '@/lib/contactNotifications';
import { useIsMobile } from '@/hooks/use-mobile';

// Dynamic field component that shows "University" for students or "Dorm Name" for owners
function UniversityOrDormField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [label, setLabel] = useState('University / Dorm Name');

  useEffect(() => {
    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: roleData } = await supabase.rpc('get_user_role', { p_user_id: user.id });
        setLabel(roleData === 'owner' ? 'Dorm Name' : 'University');
      }
    };
    getUserRole();
  }, []);

  return (
    <div>
      <Label>{label}</Label>
      <Input
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-black/20 border-white/10 ${error ? 'border-destructive' : ''}`}
        placeholder={label === 'Dorm Name' ? 'Enter your dorm name' : 'Enter your university'}
      />
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}

export default function Contact() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    university: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    if (!validateName(formData.firstName)) {
      newErrors.firstName = 'Please enter a valid first name (2-100 characters, letters only)';
    }
    if (!validateName(formData.lastName)) {
      newErrors.lastName = 'Please enter a valid last name (2-100 characters, letters only)';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.university.trim()) {
      newErrors.university = 'University or Dorm Name is required';
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
      
      // Get user role to determine field label
      let userRole = null;
      if (user?.id) {
        const { data: roleData } = await supabase.rpc('get_user_role', { p_user_id: user.id });
        userRole = roleData;
      }
      
      // 1. Insert into contact_messages
      const { error: contactError } = await supabase.from('contact_messages').insert({
        user_id: user?.id || null,
        first_name: sanitizeInput(formData.firstName),
        last_name: sanitizeInput(formData.lastName),
        email: formData.email,
        university: sanitizeInput(formData.university),
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
        first_name: sanitizeInput(formData.firstName),
        last_name: sanitizeInput(formData.lastName),
        email: formData.email,
        university: sanitizeInput(formData.university) || null,
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
        firstName: '',
        lastName: '',
        email: '',
        university: '',
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
      <RoomyNavbar />
      
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
                    <Label>First Name</Label>
                    <Input
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={`bg-black/20 border-white/10 ${errors.firstName ? 'border-destructive' : ''}`}
                    />
                    {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={`bg-black/20 border-white/10 ${errors.lastName ? 'border-destructive' : ''}`}
                    />
                    {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`bg-black/20 border-white/10 ${errors.email ? 'border-destructive' : ''}`}
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>
                <UniversityOrDormField
                  value={formData.university}
                  onChange={(value) => setFormData({ ...formData, university: value })}
                  error={errors.university}
                />
                <div>
                  <Label>Message</Label>
                  <Textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className={`bg-black/20 border-white/10 resize-none ${errors.message ? 'border-destructive' : ''}`}
                    maxLength={500}
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
                      <p className="text-sm text-foreground/70">+961 81 858 026</p>
                      <p className="text-sm text-foreground/70">+961 76 977 539</p>
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
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
