import { useState } from 'react';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, MapPin, Instagram, Linkedin, Youtube, Facebook, Music, Pin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateEmail, sanitizeInput, validateMessage } from '@/utils/inputValidation';
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

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
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

      let conversationId = null;
      if (user?.id) {
        const { createSupportConversation } = await import('@/lib/conversationUtils');
        conversationId = await createSupportConversation(user.id, sanitizeInput(formData.message));
      }

      await triggerContactEmailNotification({
        first_name: sanitizeInput(firstName),
        last_name: sanitizeInput(lastName),
        email: formData.email,
        university: `[${formData.category}] ${sanitizeInput(formData.subject)}`,
        message: sanitizeInput(formData.message),
      });

      toast({
        title: 'Message Sent Successfully!',
        description: user?.id && conversationId
          ? "We've received your message! Redirecting to chat with Roomy Support..."
          : "Thank you for contacting Roomy! We'll get back to you within 24 hours.",
      });

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
    <div className="min-h-screen flex flex-col bg-background">
      {!isMobile && <RoomyNavbar />}
      
      <main className="flex-1 container mx-auto px-4 py-12 mt-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions or need assistance? We're here to help you find your perfect accommodation.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Contact Form - Takes 3 columns */}
            <div className="lg:col-span-3">
              <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-foreground mb-2">Send us a Message</h2>
                <p className="text-muted-foreground mb-6">Fill out the form below and we'll get back to you as soon as possible.</p>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className={errors.fullName ? 'border-destructive' : ''}
                        placeholder="Your full name"
                      />
                      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={errors.email ? 'border-destructive' : ''}
                        placeholder="your.email@example.com"
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTACT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className={errors.subject ? 'border-destructive' : ''}
                        placeholder="Brief subject of your message"
                      />
                      {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                      className={`resize-none ${errors.message ? 'border-destructive' : ''}`}
                      maxLength={500}
                      placeholder="Tell us more about your inquiry..."
                    />
                    <div className="flex justify-between items-center">
                      {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                      <p className="text-xs text-muted-foreground ml-auto">{formData.message.length}/500</p>
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </div>
            </div>

            {/* Right Column - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-foreground mb-5">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p className="text-sm text-muted-foreground">info@roomylb.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <p className="text-sm text-muted-foreground italic">Coming Soon</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Location</p>
                      <p className="text-sm text-muted-foreground">Beirut, Lebanon</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Support */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-foreground mb-2">WhatsApp Support</h3>
                <p className="text-sm text-muted-foreground mb-4">Get instant help via WhatsApp</p>
                <WhatsAppDropdown />
              </div>

              {/* Follow Us */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-foreground mb-2">Follow Us</h3>
                <p className="text-sm text-muted-foreground mb-4">Stay connected on social media</p>
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href="https://www.instagram.com/roomy.lebanon/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-foreground text-sm font-medium"
                  >
                    <Instagram className="w-4 h-4 text-primary" /> Instagram
                  </a>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted text-muted-foreground text-sm cursor-not-allowed">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted text-muted-foreground text-sm cursor-not-allowed">
                    <Youtube className="w-4 h-4" /> YouTube
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted text-muted-foreground text-sm cursor-not-allowed">
                    <Music className="w-4 h-4" /> TikTok
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted text-muted-foreground text-sm cursor-not-allowed">
                    <Facebook className="w-4 h-4" /> Facebook
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted text-muted-foreground text-sm cursor-not-allowed">
                    <Pin className="w-4 h-4" /> Pinterest
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
