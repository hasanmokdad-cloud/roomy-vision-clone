export interface FAQItem {
  q: string;
  a: string;
}

export interface FAQCategory {
  id: string;
  category: string;
  items: FAQItem[];
}

export const faqData: FAQCategory[] = [
  {
    id: 'general',
    category: 'General',
    items: [
      {
        q: "What is Roomy?",
        a: "Roomy is an AI-powered student housing platform that connects university students in Lebanon with verified dorm listings and compatible roommates. Our platform uses advanced matching algorithms to help you find the perfect living situation near your university."
      },
      {
        q: "Who can use Roomy?",
        a: "Any university student in Lebanon can use Roomy to search for dorms and find roommates. Property owners can also register to list their dorms on our platform after agreeing to our Owner Agreement."
      },
      {
        q: "Where is Roomy available?",
        a: "Roomy is currently available near major universities in Lebanon, including areas around Beirut, Byblos, Jounieh, and other university towns. We're continuously expanding our coverage."
      },
      {
        q: "Is Roomy free to use?",
        a: "Yes, browsing dorm listings and basic searching is completely free. Some premium features like advanced AI matching and priority access may require a subscription or one-time payment."
      },
      {
        q: "How do I get started?",
        a: "Create an account with your email, complete your student profile with your university information and preferences, then start browsing dorms or use our AI matching to find compatible roommates."
      }
    ]
  },
  {
    id: 'ai-matching',
    category: 'AI Matching',
    items: [
      {
        q: "How does AI roommate matching work?",
        a: "Our AI analyzes your profile information, housing preferences, lifestyle habits, and personality traits from the compatibility test to find students with similar or complementary living styles. The more complete your profile, the better your matches."
      },
      {
        q: "What is a compatibility score?",
        a: "The compatibility score (shown as a percentage) indicates how well you might get along with a potential roommate. It considers housing preferences (40%), lifestyle compatibility (30%), academic alignment (20%), and personal values (10%). Scores above 75% indicate great compatibility."
      },
      {
        q: "What are the Match Plan tiers?",
        a: "We offer three tiers: Basic (Free) with up to 3 matches per day, Advanced with up to 10 matches and detailed insights, and VIP with unlimited matches and priority placement in the matching queue."
      },
      {
        q: "How can I improve my match quality?",
        a: "Complete all sections of your profile, take the personality/compatibility test, keep your preferences updated, and add a clear profile photo. The more information you provide, the better our AI can match you."
      },
      {
        q: "What information do matched roommates see?",
        a: "Matched roommates can see your name, age, gender, home location, university, major, year of study, and housing preferences. Your email, phone number, exact address, and private messages are never shared."
      }
    ]
  },
  {
    id: 'payments',
    category: 'Payments',
    items: [
      {
        q: "How do payments work?",
        a: "All payments, including deposits and rent, are made directly to the dorm owner through our secure payment partner Whish. Roomy facilitates the transaction but does not hold or manage the funds."
      },
      {
        q: "Are deposits refundable?",
        a: "No, deposits are non-refundable and are paid directly to the dorm owner. Make sure to review all terms with the owner before making a deposit. Any refund requests must be directed to the property owner."
      },
      {
        q: "What payment methods are accepted?",
        a: "Payments are processed through our partner Whish, which accepts major credit/debit cards. You can save your payment method for faster future transactions."
      },
      {
        q: "Is my payment information secure?",
        a: "Yes, all payment processing is handled by Whish using industry-standard encryption. Roomy never stores your full card details on our servers."
      },
      {
        q: "What if I have a payment dispute?",
        a: "Payment disputes must be resolved directly with the dorm owner. Roomy is not a party to the rental agreement. We may voluntarily assist at our discretion, but have no obligation to mediate disputes."
      }
    ]
  },
  {
    id: 'owners',
    category: 'Owners',
    items: [
      {
        q: "How do I list my property on Roomy?",
        a: "Click 'Become an Owner' in the app, complete the registration process, agree to the Owner Agreement, and submit your property details for verification. Once approved, your listing will be visible to students."
      },
      {
        q: "What is the Owner Agreement?",
        a: "The Owner Agreement outlines your responsibilities as a property owner on Roomy, including providing accurate listings, maintaining safety standards, responding to inquiries promptly, and complying with local housing regulations."
      },
      {
        q: "How do I receive payments from students?",
        a: "Payments are processed through Whish directly to your linked account. You'll need to set up your payout method in your owner dashboard to receive funds."
      },
      {
        q: "How do I manage my listings?",
        a: "Access your Owner Dashboard to add, edit, or remove rooms, update availability, respond to booking requests, and view your earnings and performance metrics."
      },
      {
        q: "What happens if my listing is rejected?",
        a: "If your listing is rejected, you'll receive a notification explaining why. Common reasons include incomplete information, unclear photos, or policy violations. You can update and resubmit for review."
      }
    ]
  },
  {
    id: 'accounts',
    category: 'Accounts',
    items: [
      {
        q: "How do I change my password?",
        a: "Go to Settings > Login & Security and select 'Change Password'. You'll need to enter your current password and then create a new one. Choose a strong password with at least 8 characters."
      },
      {
        q: "How do I enable two-factor authentication?",
        a: "Navigate to Settings > Login & Security and enable Two-factor authentication. Scan the QR code with your authenticator app (like Google Authenticator) and enter the verification code to complete setup."
      },
      {
        q: "How do I manage trusted devices?",
        a: "Go to Settings > Login & Security > Trusted devices to view all devices that have accessed your account. You can remove any devices you don't recognize, which will sign them out immediately."
      },
      {
        q: "How do I update my profile information?",
        a: "Go to your Profile page and tap the edit button. You can update your personal info, academic details, housing preferences, and profile photo at any time."
      },
      {
        q: "How do I delete my account?",
        a: "Contact our support team through the Contact page to request account deletion. Please note that this action is permanent and will remove all your data from our platform."
      }
    ]
  },
  {
    id: 'legal',
    category: 'Legal',
    items: [
      {
        q: "Is Roomy responsible for housing safety?",
        a: "No, Roomy is a digital marketplace that connects students with property owners. We verify listings to reduce scams, but we do not inspect properties or guarantee safety standards. Property owners are responsible for maintaining safe living conditions."
      },
      {
        q: "Who handles disputes between students and owners?",
        a: "Disputes must be resolved directly between students and property owners. Roomy is not a party to rental agreements. We may voluntarily assist at our discretion but have no obligation to mediate or resolve disputes."
      },
      {
        q: "What data does Roomy collect about me?",
        a: "We collect information you provide (profile, preferences), usage data (how you use the app), and device information. See our Privacy Policy for full details on data collection, use, and your rights."
      },
      {
        q: "Can I use Roomy if I'm under 18?",
        a: "Roomy is intended for university students who are typically 18 or older. Users under 18 may need parental consent depending on local regulations."
      },
      {
        q: "Where can I read the full terms and policies?",
        a: "Visit our Legal section for the full Terms of Service, Privacy Policy, Payment Terms, Cookie Policy, and Owner Agreement. Links are available in the app footer."
      }
    ]
  },
  {
    id: 'troubleshooting',
    category: 'Troubleshooting',
    items: [
      {
        q: "I can't log in to my account",
        a: "Try resetting your password using the 'Forgot Password' link. If you still can't access your account, clear your browser cache or try a different browser. Contact support if problems persist."
      },
      {
        q: "My profile changes aren't saving",
        a: "Ensure you have a stable internet connection and try again. If the issue continues, log out and log back in, then retry. Clear your app cache if using the mobile app."
      },
      {
        q: "I'm not receiving match notifications",
        a: "Check your notification settings in Settings > Notifications and ensure notifications are enabled. Also check your device's notification permissions for the Roomy app or browser."
      },
      {
        q: "The app is running slowly",
        a: "Try closing and reopening the app, clearing cache, or updating to the latest version. A slow internet connection can also affect performance."
      },
      {
        q: "I found a bug or have feedback",
        a: "We appreciate your feedback! Use the Contact page to report bugs or share suggestions. Include as much detail as possible about what happened and steps to reproduce the issue."
      }
    ]
  }
];

export const getAllCategories = (): string[] => {
  return faqData.map(cat => cat.category);
};

export const getCategoryById = (id: string): FAQCategory | undefined => {
  return faqData.find(cat => cat.id === id);
};
