import { z } from "zod";

export const contactCategories = [
  { value: "general", label: "General Inquiry", email: "info@tenanters.com" },
  { value: "support", label: "Customer Support", email: "support@tenanters.com" },
  { value: "partnership", label: "Business Partnership", email: "partnerships@tenanters.com" },
  { value: "press", label: "Press & Media", email: "press@tenanters.com" },
  { value: "careers", label: "Careers", email: "hr@tenanters.com" },
  { value: "feedback", label: "Feedback", email: "support@tenanters.com" },
  { value: "technical", label: "Technical Issue", email: "security@tenanters.com" },
] as const;

export type ContactCategory = typeof contactCategories[number]["value"];

export const contactSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address").max(255),
  category: z.enum(["general","support","partnership","press","careers","feedback","technical"], { required_error: "Please select a category" }),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(500, "Message must be 500 characters or less"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export function getEmailForCategory(category: ContactCategory): string {
  return contactCategories.find((c) => c.value === category)?.email ?? "info@tenanters.com";
}
