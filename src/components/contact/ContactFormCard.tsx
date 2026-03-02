import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput } from "@/utils/inputValidation";
import { triggerContactEmailNotification } from "@/lib/contactNotifications";
import { contactSchema, contactCategories, type ContactFormData } from "@/lib/contactSchema";

const cardStyle: React.CSSProperties = { backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E5E7EB", padding: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };
const inputStyle: React.CSSProperties = { backgroundColor: "#F9FAFB", height: "44px" };

const ContactFormCard = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm<ContactFormData>({ resolver: zodResolver(contactSchema), defaultValues: { fullName: "", email: "", category: undefined, subject: "", message: "" } });
  const messageLength = (form.watch("message") || "").length;

  const onSubmit = async (data: ContactFormData) => {
    const rateLimitKey = 'contact_form_limit';
    const rateLimitData = localStorage.getItem(rateLimitKey);
    if (rateLimitData) {
      const { timestamp, count } = JSON.parse(rateLimitData);
      const hoursSinceFirst = (Date.now() - timestamp) / (1000 * 60 * 60);
      if (hoursSinceFirst < 1 && count >= 3) {
        toast({ title: 'Submission limit reached', description: `Try again in ${Math.ceil(60 - hoursSinceFirst * 60)} minutes.`, variant: 'destructive' });
        return;
      }
      localStorage.setItem(rateLimitKey, JSON.stringify(hoursSinceFirst >= 1 ? { timestamp: Date.now(), count: 1 } : { timestamp, count: count + 1 }));
    } else {
      localStorage.setItem(rateLimitKey, JSON.stringify({ timestamp: Date.now(), count: 1 }));
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const nameParts = data.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: contactError } = await supabase.from('contact_messages').insert({
        user_id: user?.id || null,
        first_name: sanitizeInput(firstName),
        last_name: sanitizeInput(lastName),
        email: data.email,
        university: `[${data.category}] ${sanitizeInput(data.subject)}`,
        message: sanitizeInput(data.message),
        status: 'new'
      });
      if (contactError) throw contactError;

      await triggerContactEmailNotification({
        full_name: sanitizeInput(data.fullName.trim()),
        email: data.email,
        category: data.category,
        subject: sanitizeInput(data.subject),
        message: sanitizeInput(data.message),
      });

      toast({ title: 'Message Sent!', description: "We'll get back to you within 24 hours." });
      form.reset();
    } catch {
      toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1D4ED8", marginBottom: "4px" }}>Send us a Message</h2>
      <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>Fill out the form below and we'll get back to you as soon as possible.</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem><FormLabel style={{ fontWeight: 600, color: "#374151" }}>Full Name</FormLabel><FormControl><Input placeholder="Your full name" style={inputStyle} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel style={{ fontWeight: 600, color: "#374151" }}>Email Address</FormLabel><FormControl><Input placeholder="your.email@example.com" style={inputStyle} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem><FormLabel style={{ fontWeight: 600, color: "#374151" }}>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger style={inputStyle}><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                  <SelectContent>{contactCategories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="subject" render={({ field }) => (
              <FormItem><FormLabel style={{ fontWeight: 600, color: "#374151" }}>Subject</FormLabel><FormControl><Input placeholder="Brief subject of your message" style={inputStyle} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="message" render={({ field }) => (
            <FormItem>
              <FormLabel style={{ fontWeight: 600, color: "#374151" }}>Message</FormLabel>
              <FormControl><Textarea placeholder="Tell us more about your inquiry..." style={{ minHeight: "140px", resize: "none", backgroundColor: "#F9FAFB" }} maxLength={500} {...field} /></FormControl>
              <div style={{ textAlign: "right" }}><span style={{ fontSize: "12px", color: "#9CA3AF" }}>{messageLength}/500</span></div>
              <FormMessage />
            </FormItem>
          )} />
          <button type="submit" disabled={isSubmitting} style={{ width: "100%", height: "48px", backgroundColor: "#1D4ED8", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? <><Loader2 size={18} className="animate-spin" />Sending...</> : "Send Message"}
          </button>
        </form>
      </Form>
    </div>
  );
};
export default ContactFormCard;
