import { FileText, Shield, CreditCard, Cookie, Users, Scale, Trash2, Home } from 'lucide-react';

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
    shortTitle: 'Terms of Service',
    description: 'Terms and conditions for using the Tenanters platform',
    icon: <FileText className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Acceptance of Terms</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            By accessing and using Tenanters, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>User Accounts</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Platform Usage</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            Tenanters is a platform connecting students with property owners. We facilitate bookings but are not party to the actual rental agreements between students and property owners.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Prohibited Activities</h2>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Posting false, misleading, or fraudulent information</li>
            <li>Attempting to circumvent our payment system</li>
            <li>Harassing or abusing other users</li>
            <li>Violating any applicable laws or regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Marketplace Disclaimer</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">
            Tenanters functions exclusively as a digital marketplace and is not a real estate broker, agent, or financial intermediary. Tenanters does not guarantee listing accuracy, availability, pricing, or property safety. All rental agreements and payments are strictly between students and property owners. Tenanters shall not be held liable for lost payments, safety issues, inaccurate owner information, or any harm occurring on-site.
          </p>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">
            By using Tenanters, you agree that Tenanters shall not be held liable for:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4" style={{ color: '#4B5563' }}>
            <li>Lost payments, failed reservations, or financial disagreements</li>
            <li>Safety or maintenance issues within the dorm or property</li>
            <li>Inaccurate or misleading information provided by Owners</li>
            <li>Emotional, financial, or physical harm sustained on-site</li>
          </ul>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">
            You agree to release, indemnify, and hold Tenanters harmless against any claims arising out of:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4" style={{ color: '#4B5563' }}>
            <li>(a) the condition of the property</li>
            <li>(b) communication with an Owner</li>
            <li>(c) payment or refund disputes</li>
            <li>(d) housing outcomes resulting from information on the Platform</li>
          </ul>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            If a disagreement occurs, users must contact the Owner directly. Tenanters may, at its discretion, voluntarily assist, but has no obligation to mediate or resolve disputes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Limitation of Liability</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            Tenanters is not liable for any disputes between students and property owners. We provide the platform as-is and make no warranties about the accuracy of listings or user information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Changes to Terms</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Contact Us</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            For questions about these terms, please contact us at security@tenanters.com
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 'privacy',
    shortTitle: 'Privacy Policy',
    title: 'Privacy Policy',
    icon: <Shield className="w-5 h-5" />,
    lastUpdated: '2026-01-01',
    description: 'How we collect, use, and protect your data',
    content: (
      <div className="space-y-8">
        <nav style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
          <h3 className="font-semibold mb-3" style={{ color: '#111827' }}>Table of Contents</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#privacy-section-1" style={{ color: '#1D4ED8' }} className="hover:underline">Introductory Statement</a></li>
            <li><a href="#privacy-section-2" style={{ color: '#1D4ED8' }} className="hover:underline">1. Data We Collect</a></li>
            <li><a href="#privacy-section-3" style={{ color: '#1D4ED8' }} className="hover:underline">2. How We Use Your Data</a></li>
            <li><a href="#privacy-section-4" style={{ color: '#1D4ED8' }} className="hover:underline">3. Data Storage Duration</a></li>
            <li><a href="#privacy-section-5" style={{ color: '#1D4ED8' }} className="hover:underline">4. Sharing of Data</a></li>
            <li><a href="#privacy-section-6" style={{ color: '#1D4ED8' }} className="hover:underline">5. Your Rights</a></li>
            <li><a href="#privacy-section-7" style={{ color: '#1D4ED8' }} className="hover:underline">6. How to Request Data Deletion</a></li>
            <li><a href="#privacy-section-8" style={{ color: '#1D4ED8' }} className="hover:underline">7. Children Under 18</a></li>
            <li><a href="#privacy-section-9" style={{ color: '#1D4ED8' }} className="hover:underline">8. Jurisdiction</a></li>
          </ul>
        </nav>

        <section id="privacy-section-1">
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Introductory Statement</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            This Privacy Policy explains how Tenanters ("Tenanters," "we," "us," "the Platform") collects, processes, stores, and protects personal information belonging to users ("you," "Students," "Owners," "Visitors"). By using Tenanters, you consent to the practices described herein.
          </p>
        </section>

        <section id="privacy-section-2">
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>1. Data We Collect</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">Tenanters may collect the following categories of information:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Account information (name, email, phone number)</li>
            <li>Profile details you provide (university, preferences, profile photo)</li>
            <li>Housing preferences and reservation history</li>
            <li>AI match personality questionnaire responses</li>
            <li>Usage data (Tenanters does not currently collect behavioral analytics or cookies)</li>
          </ul>
        </section>

        <section id="privacy-section-3">
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>2. How We Use Your Data</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">Tenanters processes personal information exclusively to support platform functionality:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Provide and improve our services</li>
            <li>Match you with compatible roommates and dorms</li>
            <li>Process reservations and facilitate owner contact</li>
            <li>Send essential notifications and support replies</li>
          </ul>
        </section>

        <section id="privacy-section-4">
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>3. Data Storage Duration</h2>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li><strong>Personality Questionnaire + AI Score</strong> → retained until account deletion</li>
            <li><strong>Room reservation metadata</strong> → retained until account deletion</li>
            <li><strong>Profile photos/images</strong> → may remain cached for up to 30 days after deletion</li>
          </ul>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mt-4 text-sm italic">
            AI personality data and reservation metadata are retained until account deletion. Account deletion requests are processed within 30 days.
          </p>
        </section>

        <section id="privacy-section-5">
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>4. Sharing of Data</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">
            Tenanters does not sell, rent, or transfer personal data to advertisers, universities, or unrelated third parties.
          </p>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-2">Permitted disclosure only occurs when:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>A Student initiates contact with an Owner</li>
            <li>Required by law / Lebanese court order</li>
          </ul>
        </section>

        <section id="privacy-section-6">
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>5. Your Rights</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-2">Users may:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Request a copy of your data</li>
            <li>Request full deletion (email: security@tenanters.com)</li>
            <li>Request corrections to your data</li>
            <li>Opt out of AI matching usage</li>
          </ul>
        </section>

        <section id="privacy-section-7">
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>6. How to Request Data Deletion</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">
            To request account deletion or a copy of personal data, email:
          </p>
          <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }} className="mb-4">
            <p className="font-medium" style={{ color: '#111827' }}>📧 security@tenanters.com</p>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Subject Line: Account Deletion Request – Full Name</p>
          </div>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            Tenanters may require ID verification before executing deletion. Deletion will be completed within 30 days.
          </p>
        </section>

        <section id="privacy-section-8">
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>7. Children Under 18</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            Tenanters is intended only for university-aged users (18+). Users under 18 are not permitted to register.
          </p>
        </section>

        <section id="privacy-section-9">
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>8. Jurisdiction</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            This Policy is governed by the laws of Lebanon. Disputes must be brought exclusively before the courts of Beirut, Lebanon.
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 'payments',
    title: 'Payments Disclaimer',
    shortTitle: 'Payments Disclaimer',
    description: 'Payment terms, fees, and refund policies',
    icon: <CreditCard className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>1. Overview of Payment Structure</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            Tenanters operates as a marketplace connecting students with dorm owners. All deposits and rental payments are made <strong>directly to the property owner</strong> through our secure payment processor, Whish (powered by Codnloc Pay). Tenanters does not hold, escrow, or manage rental funds on behalf of users.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>2. Payment Breakdown</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">When you reserve a room through Tenanters, the following charges apply:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li><strong>Room Deposit:</strong> Paid directly to the dorm owner. Amount set by the owner.</li>
            <li><strong>Platform Service Fee (10%):</strong> A non-refundable fee charged by Tenanters for facilitating the connection, booking support, and platform maintenance.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>3. Non-Refundable Policy</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4"><strong>All deposits and platform fees are strictly non-refundable.</strong></p>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">By completing a reservation, you acknowledge and agree that:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Deposits are transferred directly to the owner and cannot be reversed by Tenanters.</li>
            <li>Tenanters does not issue refunds under any circumstances, including cancellations, no-shows, or disputes with the owner.</li>
            <li>If you wish to request a refund, you must contact the dorm owner directly. Tenanters has no authority or obligation to process refunds.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>4. Payment Processing via Whish (Codnloc Pay)</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            Tenanters partners with Whish, a trusted payment provider, to securely process all transactions. Tenanters does not store your full credit card information. All payment data is encrypted and handled directly by our payment processor.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>5. No Chargebacks or Reversals</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">Tenanters does not support or facilitate chargebacks. Initiating a chargeback through your bank or card issuer may result in:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Immediate suspension of your Tenanters account.</li>
            <li>Reporting to fraud prevention services.</li>
            <li>Legal action if the chargeback is deemed fraudulent.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>6. Disputes Between Students and Owners</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">Tenanters is not a party to rental agreements or financial transactions between students and owners. If a dispute arises regarding:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Room condition or availability</li>
            <li>Deposit return policies</li>
            <li>Any other financial or contractual matter</li>
          </ul>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mt-4">
            You must resolve the matter directly with the property owner. Tenanters may, at its sole discretion, offer voluntary assistance but has no legal obligation to mediate or resolve disputes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>7. Liability Limitation</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">Tenanters shall not be held liable for:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Lost payments or failed transactions due to user error or third-party issues.</li>
            <li>Financial losses arising from disputes with property owners.</li>
            <li>Any indirect, incidental, or consequential damages related to payment processing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>8. Contact for Payment Inquiries</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            For questions about payments, please contact us at security@tenanters.com. For refund requests, contact the property owner directly.
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 'owner-agreement',
    title: 'Owner Listing Agreement',
    shortTitle: 'Owner Agreement',
    description: 'Terms for property owners listing on Tenanters',
    icon: <Home className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>1. Eligibility</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">To list a property on Tenanters, you ("Owner") must:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Be the legal owner of the property or have explicit authorization from the legal owner to list and manage the property.</li>
            <li>Be at least 18 years of age.</li>
            <li>Provide accurate contact information and respond to verification requests.</li>
            <li>Comply with all applicable Lebanese laws regarding property rental and student housing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>2. Listing Accuracy</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">You agree that all information provided in your listing is accurate, complete, and not misleading. This includes but is not limited to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Property address and location</li>
            <li>Room types, sizes, and availability</li>
            <li>Pricing, deposits, and payment terms</li>
            <li>Amenities and services offered</li>
            <li>House rules and restrictions</li>
            <li>Photos and videos (must accurately represent the property)</li>
          </ul>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mt-4">
            Tenanters reserves the right to remove or suspend any listing that contains inaccurate, misleading, or fraudulent information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>3. Verification Process</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">Tenanters may require documentation to verify property ownership and listing accuracy. You agree to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Provide proof of ownership or management authorization upon request.</li>
            <li>Allow Tenanters to conduct virtual or in-person property inspections if deemed necessary.</li>
            <li>Update your listing promptly if any information changes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>4. Payment Terms</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">
            <strong>Direct Payment:</strong> All deposits from students are transferred directly to you through our payment processor (Whish/Codnloc Pay). Tenanters does not hold, escrow, or manage funds on behalf of owners or students.
          </p>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">
            <strong>Platform Fee:</strong> Tenanters charges a 10% service fee on each reservation, which is collected separately from the student.
          </p>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            <strong>Owner Payouts:</strong> Payouts are currently processed via cash or bank transfer. You are responsible for providing accurate payout information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>5. No-Refund Acknowledgment</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">By listing on Tenanters, you acknowledge and agree that:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Deposits paid by students are transferred directly to you.</li>
            <li>Tenanters does not process refunds on your behalf.</li>
            <li>Any refund requests must be handled directly between you and the student.</li>
            <li>Tenanters bears no responsibility for disputes over deposits or refunds.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>6. Liability Disclaimer</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">Tenanters functions solely as a marketplace platform. By using Tenanters, you agree that Tenanters shall not be held liable for:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Disputes between you and students regarding rental terms, deposits, or property conditions.</li>
            <li>Damages, injuries, or incidents occurring at your property.</li>
            <li>Financial losses resulting from unpaid rent, property damage, or tenant disputes.</li>
            <li>Any legal claims arising from your rental activities.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>7. Termination and Removal</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">Tenanters reserves the right to suspend or permanently remove your listing if:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>You violate any terms of this agreement.</li>
            <li>Multiple complaints are received from students regarding your property or conduct.</li>
            <li>Your listing is found to contain false or misleading information.</li>
            <li>You engage in harassment, fraud, or illegal activity.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>8. Reporting Unsafe Conditions</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            Students and community members may report unsafe or unverified properties through our platform. Tenanters will investigate reported concerns and may take action including temporary suspension or permanent removal of listings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>9. Contact</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            For questions about the Owner Listing Agreement, please contact us at security@tenanters.com
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 'community',
    title: 'Community Guidelines',
    shortTitle: 'Community Guidelines',
    description: 'Standards of behavior for the Tenanters community',
    icon: <Users className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>1. Introduction</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            Tenanters is committed to creating a safe, respectful, and trustworthy community for students and property owners. These Community Guidelines outline the standards of behavior expected from all users of our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>2. Respectful Communication</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">All users must:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Communicate respectfully and professionally with other users.</li>
            <li>Avoid discriminatory, offensive, or harassing language.</li>
            <li>Respect the privacy and personal boundaries of others.</li>
            <li>Respond to messages and inquiries in a timely manner.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>3. Prohibited Behaviors</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">The following behaviors are strictly prohibited and may result in immediate account suspension:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Harassment, bullying, or threats against other users.</li>
            <li>Discrimination based on race, gender, religion, nationality, or any protected characteristic.</li>
            <li>Posting fraudulent, misleading, or false information.</li>
            <li>Attempting to conduct transactions outside the Tenanters platform to avoid fees.</li>
            <li>Sharing personal contact information for purposes of circumventing the platform.</li>
            <li>Impersonating other users or Tenanters staff.</li>
            <li>Spamming or sending unsolicited promotional content.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>4. Content Guidelines for Listings</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">Property owners must ensure that their listings:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Contain accurate and up-to-date information.</li>
            <li>Use authentic photos that accurately represent the property.</li>
            <li>Do not contain offensive, misleading, or inappropriate content.</li>
            <li>Comply with all applicable laws and regulations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>5. Reporting Violations</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">If you encounter behavior that violates these guidelines, please report it immediately through:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>The in-app reporting feature on user profiles or listings.</li>
            <li>Email: security@tenanters.com</li>
          </ul>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mt-4">
            All reports are reviewed confidentially. Tenanters will investigate and take appropriate action.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>6. Enforcement Actions</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">Violations of these guidelines may result in:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Warning notifications.</li>
            <li>Temporary suspension of account or listing.</li>
            <li>Permanent account termination.</li>
            <li>Reporting to law enforcement if criminal activity is suspected.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>7. Contact</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            For questions about our Community Guidelines, please contact us at security@tenanters.com
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 'data-rights',
    title: 'Data Rights & Deletion Policy',
    shortTitle: 'Data Rights & Deletion',
    description: 'Your rights over your personal data',
    icon: <Trash2 className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>1. Your Data Rights</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">At Tenanters, we respect your privacy and your rights over your personal data. You have the following rights:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li><strong>Right to Access:</strong> You can request a copy of all personal data we hold about you.</li>
            <li><strong>Right to Rectification:</strong> You can request correction of any inaccurate or incomplete data.</li>
            <li><strong>Right to Erasure:</strong> You can request deletion of your personal data (subject to legal retention requirements).</li>
            <li><strong>Right to Data Portability:</strong> You can request your data in a structured, commonly used format.</li>
            <li><strong>Right to Object:</strong> You can object to certain types of data processing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>2. Data We Collect</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">Tenanters collects and processes the following types of personal data:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Account information (name, email, phone number)</li>
            <li>Profile data (university, preferences, profile photo)</li>
            <li>Booking and reservation history</li>
            <li>Communication records (messages between users)</li>
            <li>Payment information (processed securely by our payment provider)</li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>3. Data Retention</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">We retain your personal data for as long as necessary to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Provide our services to you.</li>
            <li>Comply with legal obligations (e.g., financial record keeping).</li>
            <li>Resolve disputes and enforce our agreements.</li>
          </ul>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mt-4">
            After account deletion, we may retain certain data for up to 7 years for legal and regulatory compliance purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>4. Account Deletion Process</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">To delete your Tenanters account:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Log into your account and navigate to Settings.</li>
            <li>Select "Delete Account" option.</li>
            <li>Confirm your request by entering your password.</li>
            <li>Your account and associated data will be scheduled for deletion.</li>
          </ol>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mt-4">
            Alternatively, you can email security@tenanters.com with your deletion request. We will process your request within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>5. What Happens When You Delete Your Account</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">Upon account deletion:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Your profile and listings will be removed from public view.</li>
            <li>Your booking history will be anonymized.</li>
            <li>Messages with other users will be retained for their records but your name will be anonymized.</li>
            <li>Payment records may be retained for legal compliance.</li>
            <li>This action is irreversible.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>6. Data Export Requests</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">You can request a full export of your personal data by:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li>Navigating to Settings &gt; Privacy &gt; Export Data.</li>
            <li>Emailing security@tenanters.com with "Data Export Request" in the subject line.</li>
          </ul>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mt-4">We will provide your data in JSON or CSV format within 30 days.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>7. Third-Party Data Sharing</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mb-4">We share your data with third parties only when necessary:</p>
          <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: '#4B5563' }}>
            <li><strong>Payment Processors:</strong> To process transactions (Whish/Codnloc Pay).</li>
            <li><strong>Property Owners:</strong> To facilitate bookings (name, contact info, booking details).</li>
            <li><strong>Legal Authorities:</strong> When required by law or to protect our legal rights.</li>
          </ul>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }} className="mt-4">We do not sell your personal data to advertisers or data brokers.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>8. Contact for Data Requests</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            For any data-related requests or questions, please contact our Data Protection team at security@tenanters.com
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies & Tracking Policy',
    shortTitle: 'Cookies & Tracking',
    description: 'How we use cookies and tracking technologies',
    icon: <Cookie className="w-5 h-5" />,
    lastUpdated: '2025-01-15',
    content: (
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Overview of Cookies</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            Cookies are small text files stored on your device when you visit a website. They help the site function properly and can provide information to site owners. Tenanters uses only essential cookies required for authentication and session management.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Session & Authentication Cookies</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            Tenanters uses session cookies to keep you logged in and maintain your authentication state. These cookies are strictly necessary for the platform to function and are deleted when you log out or your session expires.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Analytics & Tracking</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            Tenanters does not currently use behavioral tracking cookies, third-party advertising cookies, or analytics tracking tools. If this changes in the future, this policy will be updated and users will be prompted to consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Opt-Out Instructions</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            You can manage or disable cookies through your browser settings. Please note that disabling essential cookies may prevent you from using certain features of Tenanters, such as logging in.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#111827' }}>Contact Us</h2>
          <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
            For questions about our cookie policy, please contact us at security@tenanters.com
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
