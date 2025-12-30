import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { SubPageHeader } from '@/components/mobile/SubPageHeader';
import { SwipeBackWrapper } from '@/components/mobile/SwipeBackWrapper';
import { FileText, Shield, CreditCard, Cookie, Users } from 'lucide-react';

export default function Legal() {
  const { page } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const getContent = () => {
    // Legal Hub (index page)
    if (!page) {
      return {
        title: 'Legal Information',
        content: (
          <div className="space-y-6">
            <p className="text-muted-foreground mb-8">
              Review our policies and agreements that govern the use of Roomy.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                to="/legal/terms"
                className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Terms of Service</h3>
                  <p className="text-sm text-muted-foreground">Usage rules and conditions</p>
                </div>
              </Link>

              <Link
                to="/legal/privacy"
                className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Privacy Policy</h3>
                  <p className="text-sm text-muted-foreground">How we handle your data</p>
                </div>
              </Link>

              <Link
                to="/legal/payments"
                className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Payments & Security</h3>
                  <p className="text-sm text-muted-foreground">Payment processing and security</p>
                </div>
              </Link>

              <Link
                to="/legal/cookies"
                className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Cookie className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Cookies & Tracking</h3>
                  <p className="text-sm text-muted-foreground">How we use cookies</p>
                </div>
              </Link>

              <Link
                to="/legal/owner-agreement"
                className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Owner Agreement</h3>
                  <p className="text-sm text-muted-foreground">Terms for property owners</p>
                </div>
              </Link>
            </div>
          </div>
        ),
      };
    }

    switch (page) {
      case 'payments':
        return {
          title: 'Payments & Security',
          content: (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">Payment Processing</h2>
                <p className="text-muted-foreground mb-4">
                  All payments on Roomy are processed securely through Whish (Codnloc Pay), 
                  a certified payment gateway that complies with international security standards.
                </p>
                <p className="text-muted-foreground">
                  We do not store your full credit card information. All payment data is 
                  encrypted and handled directly by our payment processor.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Payment Breakdown</h2>
                <p className="text-muted-foreground mb-4">
                  When you make a reservation, you pay:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Room Deposit:</strong> Paid directly to the property owner</li>
                  <li><strong>Service Fee (10%):</strong> Roomy's platform fee for secure booking and support</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Secure Transactions</h2>
                <p className="text-muted-foreground">
                  All transactions are protected by SSL encryption and monitored for fraud. 
                  Your payment information is never shared with property owners or other users.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Questions?</h2>
                <p className="text-muted-foreground">
                  If you have any questions about payments or security, please contact our 
                  support team at support@roomy.app
                </p>
              </section>
            </div>
          ),
        };

      case 'cookies':
        return {
          title: 'Cookies & Tracking Policy',
          content: (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">Overview of Cookies</h2>
                <p className="text-muted-foreground">
                  [Explain what cookies are and why Roomy uses them]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Session & Authentication Cookies</h2>
                <p className="text-muted-foreground">
                  [Describe cookies used for login sessions and user authentication]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Analytics Cookies</h2>
                <p className="text-muted-foreground">
                  [Describe cookies used for analytics and improving the platform]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Opt-Out Instructions</h2>
                <p className="text-muted-foreground">
                  [Explain how users can manage or disable cookies]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                <p className="text-muted-foreground">
                  For questions about our cookie policy, please contact us at privacy@roomy.app
                </p>
              </section>
            </div>
          ),
        };

      case 'owner-agreement':
        return {
          title: 'Owner Agreement',
          content: (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">Owner Responsibilities</h2>
                <p className="text-muted-foreground">
                  [Define the responsibilities of property owners using Roomy]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Accuracy of Listings</h2>
                <p className="text-muted-foreground">
                  [Requirements for accurate and truthful listing information]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Safety Compliance</h2>
                <p className="text-muted-foreground">
                  [Safety standards and regulations owners must follow]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Property Verification</h2>
                <p className="text-muted-foreground">
                  [Verification process and requirements for properties]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Removal and Termination</h2>
                <p className="text-muted-foreground">
                  [Conditions under which listings may be removed or accounts terminated]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Liability Disclaimer</h2>
                <p className="text-muted-foreground">
                  [Roomy's liability limitations regarding owner properties]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Report Unsafe Dorms</h2>
                <p className="text-muted-foreground">
                  [Policy and process for reporting unsafe conditions]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                <p className="text-muted-foreground">
                  For questions about the Owner Agreement, please contact us at owners@roomy.app
                </p>
              </section>
            </div>
          ),
        };

      case 'privacy':
        return {
          title: 'Privacy Policy',
          content: (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
                <p className="text-muted-foreground">
                  [Your privacy policy content here - describe what personal data is collected]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
                <p className="text-muted-foreground">
                  [Describe how collected data is used]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Information Sharing</h2>
                <p className="text-muted-foreground">
                  [Describe when/if data is shared with third parties]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Data Security</h2>
                <p className="text-muted-foreground">
                  [Describe security measures]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
                <p className="text-muted-foreground">
                  [Describe user rights regarding their data]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                <p className="text-muted-foreground">
                  For privacy-related inquiries, please contact us at privacy@roomy.app
                </p>
              </section>
            </div>
          ),
        };

      case 'terms':
        return {
          title: 'Terms of Service',
          content: (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using Roomy, you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to these terms, please 
                  do not use our service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">User Accounts</h2>
                <p className="text-muted-foreground mb-4">
                  You are responsible for maintaining the confidentiality of your account and 
                  password. You agree to accept responsibility for all activities that occur 
                  under your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Platform Usage</h2>
                <p className="text-muted-foreground mb-4">
                  Roomy is a platform connecting students with property owners. We facilitate 
                  bookings but are not party to the actual rental agreements between students 
                  and property owners.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Prohibited Activities</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Posting false, misleading, or fraudulent information</li>
                  <li>Attempting to circumvent our payment system</li>
                  <li>Harassing or abusing other users</li>
                  <li>Violating any applicable laws or regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Marketplace Disclaimer</h2>
                <p className="text-muted-foreground mb-4">
                  Roomy functions exclusively as a digital marketplace that connects students and property owners. Roomy is not a real estate broker, agent, sub-lessor, property manager, escrow holder, or financial intermediary. Roomy does not guarantee the accuracy of listings, availability, suitability, pricing, or safety of properties. All rental agreements, payments, disputes, and relationships are strictly between students and property owners.
                </p>
                <p className="text-muted-foreground mb-4">
                  By using Roomy, you agree that Roomy shall not be held liable for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>lost payments, failed reservations, or financial disagreements</li>
                  <li>safety or maintenance issues within the dorm or property</li>
                  <li>inaccurate or misleading information provided by Owners</li>
                  <li>emotional, financial, or physical harm sustained on-site</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  You agree to release, indemnify, and hold Roomy harmless against any claims arising out of:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>(a) the condition of the property</li>
                  <li>(b) communication with an Owner</li>
                  <li>(c) payment or refund disputes</li>
                  <li>(d) housing outcomes resulting from information on the Platform</li>
                </ul>
                <p className="text-muted-foreground">
                  If a disagreement occurs, users must contact the Owner directly. Roomy may, at its discretion, voluntarily assist, but has no obligation to mediate or resolve disputes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  Roomy is not liable for any disputes between students and property owners. 
                  We provide the platform as-is and make no warranties about the accuracy of 
                  listings or user information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. Continued use of 
                  the platform after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                <p className="text-muted-foreground">
                  For questions about these terms, please contact us at legal@roomy.app
                </p>
              </section>
            </div>
          ),
        };

      default:
        return {
          title: 'Legal Information',
          content: (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Page not found</p>
            </div>
          ),
        };
    }
  };

  const { title, content } = getContent();

  return (
    <SwipeBackWrapper>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {isMobile && <SubPageHeader title={title} />}
        {!isMobile && <RoomyNavbar />}

        <div className={`container mx-auto px-6 max-w-4xl mb-20 ${isMobile ? 'pt-20 pb-8' : 'py-32'}`}>
          <Card className="p-8">
            <h1 className="text-4xl font-bold mb-8 gradient-text">{title}</h1>
            {content}
          </Card>
        </div>
      </div>
    </SwipeBackWrapper>
  );
}
