export interface FAQQuestion {
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  label: string;
  questions: FAQQuestion[];
}

export const faqCategories: FAQCategory[] = [
  {
    id: "general",
    label: "General",
    questions: [
      { question: "What is Tenanters?", answer: "Tenanters is a smart housing platform that connects university students, alumni, and employees in Lebanon with verified rental units and like-minded roommates. Our platform uses advanced matching algorithms to help you find the perfect place near your university or workplace." },
      { question: "Who can use Tenanters?", answer: "Anyone who needs to find a place near their university or workplace can use Tenanters to search for rental units and/or find roommates. Property owners can also register their properties on our platform after agreeing to our Owner Agreement." },
      { question: "Where is Tenanters available?", answer: "Tenanters' mission is to revolutionize Lebanon's housing marketplace, helping university students and employees find their second home effortlessly. We're launching around major universities and workplaces in Beirut and Byblos, and continuously expanding our coverage." },
      { question: "Is Tenanters free to use?", answer: "Yes, browsing listings and basic searching with filters is completely free. Some premium features such as advanced AI matching may require a subscription or a one-time payment." },
      { question: "How do I get started?", answer: "Create an account with your email, complete your profile with your personal, academic, and housing information and preferences, then start browsing listings or use our AI matching to match with compatible rental units and roommates when needed." }
    ]
  },
  {
    id: "ai-matching",
    label: "AI Matching",
    questions: [
      { question: "How does AI roommate matching work?", answer: "Our AI analyzes your profile information, housing preferences, lifestyle habits, and personality traits from the compatibility test to find students with similar or complementary living styles and preferences. The more you complete your profile, the better your matches." },
      { question: "What is a compatibility score?", answer: "The compatibility score (shown as a percentage) indicates how well you might get along with a potential roommate. It considers housing preferences (40%), lifestyle compatibility (30%), academic alignment (20%), and personal values (10%). Scores above 75% indicate great compatibility." },
      { question: "What are the Match Plan tiers?", answer: "We offer three tiers: Basic (Free) with up to 3 matches per semester, Advanced with up to 10 matches per semester based on the compatibility tests and detailed insights, and VIP with all the features of Advanced in addition unlimited matches and priority placement in the matching queue." },
      { question: "How can I improve my match quality?", answer: "Complete all sections of your profile, take the personality/compatibility test, keep your preferences updated, and add a clear profile photo. The more information you provide, the better our AI can match you." },
      { question: "What information do matched roommates see?", answer: "Matched roommates can see your name, age, gender, home location, university, major, workplace and housing preferences. Your phone number, email, and exact address are never shared." }
    ]
  },
  {
    id: "payments",
    label: "Payments",
    questions: [
      { question: "How do payments work?", answer: "All payments, including deposits and rent, are made directly to the property Owner through our secure payment partner Whish. Tenanters facilitates the transactions but does not hold or manage the funds." },
      { question: "Are deposits refundable?", answer: "No, deposits are non-refundable and are paid directly to the property Owner. Make sure to review all terms with the owner before paying a deposit and reserving a rental unit. Any refund request must be directed to the property Owner." },
      { question: "What payment methods are accepted?", answer: "Payments are processed through our partner Whish, which accepts only Whish Visa cards for online transactions." },
      { question: "Is my payment information secure?", answer: "Yes, all payment processing is handled strictly by Whish using industry-standard encryption. Tenanters never stores your full card details on our servers." },
      { question: "What if I have a payment dispute?", answer: "Tenanters is not a party to the rental agreement. We may voluntarily assist, at our discretion, but have no obligation to mediate disputes." }
    ]
  },
  {
    id: "owners",
    label: "Owners",
    questions: [
      { question: "How do I list my property on Tenanters?", answer: "Click 'Become an Owner', create an account or log in if you already have one, complete the wizard registration process, agree to the Owner Agreement, and submit your property details for Admin verification. Once approved, your properties will be visible to students, and you can update the information any time on your Owner control panel." },
      { question: "What is the Owner Agreement?", answer: "The Owner Agreement outlines your responsibilities as a property owner on Tenanters, including providing accurate listings and data, providing real images and videos about the unit, maintaining safety and ethical standards, responding to inquiries and messages promptly, and complying with local housing regulations." },
      { question: "How do I receive deposits from tenants?", answer: "Payments are processed through Whish directly to your linked Owner account. You'll need to set up your payout by inserting your Whish Visa card details on your control panel to receive funds." },
      { question: "How do I manage my listings?", answer: "Access your Owner Control Panel to add, edit, or remove rental units, update availability and occupancy, and view your earnings and performance metrics." },
      { question: "What happens if my listing is rejected?", answer: "If your listing is rejected, you'll receive a notification explaining why. Common reasons include incomplete information, unclear or inaccurate photos, or policy violations. You can update and re-submit for review." }
    ]
  },
  {
    id: "accounts",
    label: "Accounts",
    questions: [
      { question: "How do I change my password?", answer: "Go to Settings > Login & Security and select 'Change Password'. You'll need to enter your current password and then create a new one. Choose a strong password with at least 8 characters." },
      { question: "How do I enable two-factor authentication (2FA)?", answer: "Navigate to Settings > Login & Security and enable Two-factor authentication. Scan the QR code with your authenticator app (like Google Authenticator) and enter the verification code to complete the setup." },
      { question: "How do I manage trusted devices?", answer: "Navigate to Settings > Login & Security > Trusted Devices to view all devices that have accessed your account. You can remove any devices you don't recognize, which will sign them out immediately." },
      { question: "How do I update my profile information?", answer: "Go to your Profile page and tap the edit button. You can update your personal information, academic details, housing preferences, personality test, and profile photo at any time." },
      { question: "How do I delete my account?", answer: "Contact our support team through the Contact page to request account deletion. Please note that this action is irreversible and will remove all your data from our platform." }
    ]
  },
  {
    id: "legal",
    label: "Legal",
    questions: [
      { question: "Is Tenanters responsible for housing safety?", answer: "No, Tenanters is a digital marketplace that connects tenants with property owners. We verify listings to reduce scams, but we do not inspect properties or guarantee safety standards. Property owners are responsible for maintaining safe living conditions." },
      { question: "Who handles disputes between tenants and owners?", answer: "Disputes must be resolved directly between tenants and property owners. Tenanters is not a party to rental agreements. We may voluntarily assist, at our discretion, but have no obligation to mediate or resolve disputes." },
      { question: "What data does Tenanters collect about me?", answer: "We collect information you provide (profile, preferences), usage data (how you use the platform or app), and device information." },
      { question: "Can I use Tenanters if I'm under 18?", answer: "Tenanters is intended for university students and employees who are typically 18 or older. Users under 18 may need parental consent depending on local regulations." }
    ]
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    questions: [
      { question: "I can't log in to my account", answer: "Try resetting your password using the 'Forgot Password' link. If you still can't access your account, clear your browser cache or try a different browser. Contact support if issue persists." },
      { question: "My profile changes aren't saving", answer: "Ensure you have a stable internet connection and try again. If the issue continues, log out and log back in, then retry. Clear your app or browser cache depending on usage." },
      { question: "I'm not receiving any notifications", answer: "Check your notification settings in Settings > Notifications and ensure notifications are enabled. Also check your device's notification permissions for the Tenanters app or browser." },
      { question: "The app is running slowly", answer: "Try closing and reopening the app, clearing cache, or updating to the latest version. A slow internet connection can also affect performance." },
      { question: "I found a bug or have feedback", answer: "We appreciate your feedback! Use the Contact page to report bugs or share suggestions. Include as much detail as possible about what happened and steps to reproduce the issue." }
    ]
  }
];
