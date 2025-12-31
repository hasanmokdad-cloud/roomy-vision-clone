import { FileText, Shield, CreditCard, Cookie, Users, Scale, Trash2 } from 'lucide-react';

export interface LegalDocument {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ReactNode;
  lastUpdated: string;
  content: React.ReactNode;
}

export const legalDocuments: LegalDocument[] = [
  {
    id: 'terms',
    title: 'Terms of Service',
    shortTitle: 'Terms',
    description: 'Usage rules and conditions',
    icon: <FileText className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
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
            For questions about these terms, please contact us at security@roomylb.com
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    shortTitle: 'Privacy',
    description: 'How we handle your data',
    icon: <Shield className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
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
            For privacy-related inquiries, please contact us at security@roomylb.com
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 'payments',
    title: 'Payments Disclaimer',
    shortTitle: 'Payments',
    description: 'Payment processing and non-refundable policies',
    icon: <CreditCard className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Overview of Payment Structure</h2>
          <p className="text-muted-foreground mb-4">
            Roomy operates as a marketplace connecting students with dorm owners. All deposits and rental payments are made <strong>directly to the property owner</strong> through our secure payment processor, Whish (powered by Codnloc Pay). Roomy does not hold, escrow, or manage rental funds on behalf of users.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Payment Breakdown</h2>
          <p className="text-muted-foreground mb-4">
            When you reserve a room through Roomy, the following charges apply:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li><strong>Room Deposit:</strong> Paid directly to the dorm owner. Amount set by the owner.</li>
            <li><strong>Platform Service Fee (10%):</strong> A non-refundable fee charged by Roomy for facilitating the connection, booking support, and platform maintenance.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Non-Refundable Policy</h2>
          <p className="text-muted-foreground mb-4">
            <strong>All deposits and platform fees are strictly non-refundable.</strong>
          </p>
          <p className="text-muted-foreground mb-4">
            By completing a reservation, you acknowledge and agree that:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Deposits are transferred directly to the owner and cannot be reversed by Roomy.</li>
            <li>Roomy does not issue refunds under any circumstances, including cancellations, no-shows, or disputes with the owner.</li>
            <li>If you wish to request a refund, you must contact the dorm owner directly. Roomy has no authority or obligation to process refunds.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Payment Processing via Whish (Codnloc Pay)</h2>
          <p className="text-muted-foreground mb-4">
            All payments are securely processed through Whish (Codnloc Pay), a certified payment gateway compliant with industry security standards. Roomy does not store your full credit card information. All payment data is encrypted and handled directly by our payment processor.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. No Chargebacks or Reversals</h2>
          <p className="text-muted-foreground mb-4">
            Roomy does not support or facilitate chargebacks. Initiating a chargeback through your bank or card issuer may result in:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Immediate suspension of your Roomy account.</li>
            <li>Reporting to fraud prevention services.</li>
            <li>Legal action if the chargeback is deemed fraudulent.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Disputes Between Students and Owners</h2>
          <p className="text-muted-foreground mb-4">
            Roomy is not a party to rental agreements or financial transactions between students and owners. If a dispute arises regarding:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Room condition or availability</li>
            <li>Deposit return policies</li>
            <li>Any other financial or contractual matter</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            You must resolve the matter directly with the property owner. Roomy may, at its sole discretion, offer voluntary assistance but has no legal obligation to mediate or resolve disputes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">7. Liability Limitation</h2>
          <p className="text-muted-foreground mb-4">
            Roomy shall not be held liable for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Lost payments or failed transactions due to user error or third-party issues.</li>
            <li>Financial losses arising from disputes with property owners.</li>
            <li>Any indirect, incidental, or consequential damages related to payment processing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">8. Contact for Payment Inquiries</h2>
          <p className="text-muted-foreground">
            For questions about payments, please contact us at security@roomylb.com. For refund requests, contact the property owner directly.
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 'owner-agreement',
    title: 'Owner Listing Agreement',
    shortTitle: 'Owner Agreement',
    description: 'Terms for property owners listing on Roomy',
    icon: <Users className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Eligibility</h2>
          <p className="text-muted-foreground mb-4">
            To list a property on Roomy, you ("Owner") must:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Be the legal owner of the property or have explicit authorization from the legal owner to list and manage the property.</li>
            <li>Be at least 18 years of age.</li>
            <li>Provide accurate contact information and respond to verification requests.</li>
            <li>Comply with all applicable Lebanese laws regarding property rental and student housing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Listing Accuracy</h2>
          <p className="text-muted-foreground mb-4">
            You agree that all information provided in your listing is accurate, complete, and not misleading. This includes but is not limited to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Property address and location</li>
            <li>Room types, sizes, and availability</li>
            <li>Pricing, deposits, and payment terms</li>
            <li>Amenities and services offered</li>
            <li>House rules and restrictions</li>
            <li>Photos and videos (must accurately represent the property)</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Roomy reserves the right to remove or suspend any listing that contains inaccurate, misleading, or fraudulent information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Verification Process</h2>
          <p className="text-muted-foreground mb-4">
            Roomy may require documentation to verify property ownership and listing accuracy. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Provide proof of ownership or management authorization upon request.</li>
            <li>Allow Roomy to conduct virtual or in-person property inspections if deemed necessary.</li>
            <li>Update your listing promptly if any information changes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Payment Terms</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Direct Payment:</strong> All deposits from students are transferred directly to you through our payment processor (Whish/Codnloc Pay). Roomy does not hold, escrow, or manage funds on behalf of owners or students.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Platform Fee:</strong> Roomy charges a 10% service fee on each reservation, which is collected separately from the student.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Owner Payouts:</strong> Payouts are currently processed via cash or bank transfer. You are responsible for providing accurate payout information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. No-Refund Acknowledgment</h2>
          <p className="text-muted-foreground mb-4">
            By listing on Roomy, you acknowledge and agree that:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Deposits paid by students are transferred directly to you.</li>
            <li>Roomy does not process refunds on your behalf.</li>
            <li>Any refund requests must be handled directly between you and the student.</li>
            <li>Roomy bears no responsibility for disputes over deposits or refunds.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Liability Disclaimer</h2>
          <p className="text-muted-foreground mb-4">
            Roomy functions solely as a marketplace platform. By using Roomy, you agree that Roomy shall not be held liable for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Disputes between you and students regarding rental terms, deposits, or property conditions.</li>
            <li>Damages, injuries, or incidents occurring at your property.</li>
            <li>Financial losses resulting from unpaid rent, property damage, or tenant disputes.</li>
            <li>Any legal claims arising from your rental activities.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">7. Termination and Removal</h2>
          <p className="text-muted-foreground mb-4">
            Roomy reserves the right to suspend or permanently remove your listing if:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>You violate any terms of this agreement.</li>
            <li>Multiple complaints are received from students regarding your property or conduct.</li>
            <li>Your listing is found to contain false or misleading information.</li>
            <li>You engage in harassment, fraud, or illegal activity.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">8. Reporting Unsafe Conditions</h2>
          <p className="text-muted-foreground mb-4">
            Students and community members may report unsafe or unverified properties through our platform. Roomy will investigate reported concerns and may take action including temporary suspension or permanent removal of listings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">9. Contact</h2>
          <p className="text-muted-foreground">
            For questions about the Owner Listing Agreement, please contact us at security@roomylb.com
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 'community',
    title: 'Community Guidelines',
    shortTitle: 'Community',
    description: 'Standards for respectful platform usage',
    icon: <Scale className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground">
            Roomy is committed to creating a safe, respectful, and trustworthy community for students and property owners. These Community Guidelines outline the standards of behavior expected from all users of our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Respectful Communication</h2>
          <p className="text-muted-foreground mb-4">
            All users must:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Communicate respectfully and professionally with other users.</li>
            <li>Avoid discriminatory, offensive, or harassing language.</li>
            <li>Respect the privacy and personal boundaries of others.</li>
            <li>Respond to messages and inquiries in a timely manner.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Prohibited Behaviors</h2>
          <p className="text-muted-foreground mb-4">
            The following behaviors are strictly prohibited and may result in immediate account suspension:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Harassment, bullying, or threats against other users.</li>
            <li>Discrimination based on race, gender, religion, nationality, or any protected characteristic.</li>
            <li>Posting fraudulent, misleading, or false information.</li>
            <li>Attempting to conduct transactions outside the Roomy platform to avoid fees.</li>
            <li>Sharing personal contact information for purposes of circumventing the platform.</li>
            <li>Impersonating other users or Roomy staff.</li>
            <li>Spamming or sending unsolicited promotional content.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Content Guidelines for Listings</h2>
          <p className="text-muted-foreground mb-4">
            Property owners must ensure that their listings:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Contain accurate and up-to-date information.</li>
            <li>Use authentic photos that accurately represent the property.</li>
            <li>Do not contain offensive, misleading, or inappropriate content.</li>
            <li>Comply with all applicable laws and regulations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. Reporting Violations</h2>
          <p className="text-muted-foreground mb-4">
            If you encounter behavior that violates these guidelines, please report it immediately through:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>The in-app reporting feature on user profiles or listings.</li>
            <li>Email: security@roomylb.com</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            All reports are reviewed confidentially. Roomy will investigate and take appropriate action.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Enforcement Actions</h2>
          <p className="text-muted-foreground mb-4">
            Violations of these guidelines may result in:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Warning notifications.</li>
            <li>Temporary suspension of account or listing.</li>
            <li>Permanent account termination.</li>
            <li>Reporting to law enforcement if criminal activity is suspected.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">7. Contact</h2>
          <p className="text-muted-foreground">
            For questions about our Community Guidelines, please contact us at security@roomylb.com
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 'data-rights',
    title: 'Data Rights & Deletion Policy',
    shortTitle: 'Data Rights',
    description: 'Your data rights and how to request deletion',
    icon: <Trash2 className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Your Data Rights</h2>
          <p className="text-muted-foreground mb-4">
            At Roomy, we respect your privacy and your rights over your personal data. You have the following rights:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li><strong>Right to Access:</strong> You can request a copy of all personal data we hold about you.</li>
            <li><strong>Right to Rectification:</strong> You can request correction of any inaccurate or incomplete data.</li>
            <li><strong>Right to Erasure:</strong> You can request deletion of your personal data (subject to legal retention requirements).</li>
            <li><strong>Right to Data Portability:</strong> You can request your data in a structured, commonly used format.</li>
            <li><strong>Right to Object:</strong> You can object to certain types of data processing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Data We Collect</h2>
          <p className="text-muted-foreground mb-4">
            Roomy collects and processes the following types of personal data:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Account information (name, email, phone number)</li>
            <li>Profile data (university, preferences, profile photo)</li>
            <li>Booking and reservation history</li>
            <li>Communication records (messages between users)</li>
            <li>Payment information (processed securely by our payment provider)</li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Data Retention</h2>
          <p className="text-muted-foreground mb-4">
            We retain your personal data for as long as necessary to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Provide our services to you.</li>
            <li>Comply with legal obligations (e.g., financial record keeping).</li>
            <li>Resolve disputes and enforce our agreements.</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            After account deletion, we may retain certain data for up to 7 years for legal and regulatory compliance purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Account Deletion Process</h2>
          <p className="text-muted-foreground mb-4">
            To delete your Roomy account:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
            <li>Log into your account and navigate to Settings.</li>
            <li>Select "Delete Account" option.</li>
            <li>Confirm your request by entering your password.</li>
            <li>Your account and associated data will be scheduled for deletion.</li>
          </ol>
          <p className="text-muted-foreground mt-4">
            Alternatively, you can email security@roomylb.com with your deletion request. We will process your request within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. What Happens When You Delete Your Account</h2>
          <p className="text-muted-foreground mb-4">
            Upon account deletion:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Your profile and listings will be removed from public view.</li>
            <li>Your booking history will be anonymized.</li>
            <li>Messages with other users will be retained for their records but your name will be anonymized.</li>
            <li>Payment records may be retained for legal compliance.</li>
            <li>This action is irreversible.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. Data Export Requests</h2>
          <p className="text-muted-foreground mb-4">
            You can request a full export of your personal data by:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Navigating to Settings &gt; Privacy &gt; Export Data.</li>
            <li>Emailing security@roomylb.com with "Data Export Request" in the subject line.</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            We will provide your data in JSON or CSV format within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">7. Third-Party Data Sharing</h2>
          <p className="text-muted-foreground mb-4">
            We share your data with third parties only when necessary:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li><strong>Payment Processors:</strong> To process transactions (Whish/Codnloc Pay).</li>
            <li><strong>Property Owners:</strong> To facilitate bookings (name, contact info, booking details).</li>
            <li><strong>Legal Authorities:</strong> When required by law or to protect our legal rights.</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            We do not sell your personal data to advertisers or data brokers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">8. Contact for Data Requests</h2>
          <p className="text-muted-foreground">
            For any data-related requests or questions, please contact our Data Protection team at security@roomylb.com
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies & Tracking Policy',
    shortTitle: 'Cookies',
    description: 'How we use cookies and tracking technologies',
    icon: <Cookie className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
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
            For questions about our cookie policy, please contact us at security@roomylb.com
          </p>
        </section>
      </div>
    ),
  },
];

export function getLegalDocument(id: string): LegalDocument | undefined {
  return legalDocuments.find(doc => doc.id === id);
}

export function formatLastUpdated(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
