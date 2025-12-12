import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import BottomNav from '@/components/BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Legal() {
  const { page } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const getContent = () => {
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

      case 'refunds':
        return {
          title: 'Refund Policy',
          content: (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4">Refund Window</h2>
                <p className="text-muted-foreground mb-4">
                  You can request a refund within 72 hours of making a reservation, provided 
                  you have not yet moved into the property.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Refund Process</h2>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-4">
                  <li>Submit a refund request through your payment history page</li>
                  <li>Property owner reviews your request (typically within 24-48 hours)</li>
                  <li>If approved by owner, admin processes the refund</li>
                  <li>Refund is issued to your original payment method within 5-7 business days</li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Refundable Amount</h2>
                <p className="text-muted-foreground mb-4">
                  Approved refunds include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Full deposit amount</li>
                  <li>Full service fee</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Non-Refundable Items</h2>
                <p className="text-muted-foreground mb-4">
                  The following are non-refundable:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>AI Match premium plans (digital services consumed immediately)</li>
                  <li>Reservations after the 72-hour window has expired</li>
                  <li>Reservations where you have already moved into the property</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Disputes</h2>
                <p className="text-muted-foreground">
                  If you have a dispute regarding a refund decision, please contact our support 
                  team at support@roomy.app with your reservation details.
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {!isMobile && <RoomyNavbar />}

      <div className="container mx-auto px-6 py-32 max-w-4xl mb-20">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-8">
          <h1 className="text-4xl font-bold mb-8 gradient-text">{title}</h1>
          {content}
        </Card>
      </div>

      {isMobile && <BottomNav />}
    </div>
  );
}
