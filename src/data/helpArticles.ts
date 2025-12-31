export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
}

export interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  articles: HelpArticle[];
}

export const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'Rocket',
    articles: [
      {
        id: 'creating-profile',
        title: 'Creating your profile',
        category: 'Getting Started',
        content: `Set up your profile to get started with Roomy.

## Steps to create your profile

1. **Sign up**: Create an account with your email
2. **Verify your email**: Check your inbox for the verification link
3. **Complete onboarding**: Fill in your basic information
4. **Add your photo**: Upload a profile picture
5. **Set preferences**: Tell us what you're looking for

## Profile tips

- Use a clear, recent photo
- Be honest about your preferences
- Complete all sections for better matches`
      },
      {
        id: 'finding-dorms',
        title: 'Finding dorms',
        category: 'Getting Started',
        content: `Discover how to browse and find the perfect dorm.

## Browsing dorms

1. Go to the Dorms page
2. Use filters to narrow your search
3. View dorm details by tapping on a listing
4. Save dorms you like to your wishlist

## Filter options

- Location/Area
- Price range
- Room type
- Amenities
- University proximity

## Saving dorms

Tap the heart icon to save a dorm to your wishlist. Access your saved dorms anytime from the Saved page.`
      },
      {
        id: 'how-to-reserve',
        title: 'How to reserve a room',
        category: 'Getting Started',
        content: `Learn the step-by-step process to reserve your dorm room.

## Reservation steps

1. **Browse listings**: Find a dorm that matches your preferences
2. **View details**: Check room types, amenities, and pricing
3. **Contact owner**: Schedule a tour or ask questions
4. **Make a deposit**: Secure your room with a deposit payment
5. **Confirm booking**: Finalize your reservation

## Important notes

- Deposits are non-refundable and paid directly to owners
- Always communicate through the Roomy platform for safety
- Review the dorm's policies before booking`
      }
    ]
  },
  {
    id: 'ai-matching',
    title: 'AI Matching',
    icon: 'Sparkles',
    articles: [
      {
        id: 'how-roomy-matching-works',
        title: 'How Roomy Matching Works',
        category: 'AI Matching',
        content: `Our AI-powered matching system helps you find the perfect dorm and compatible roommates.

## The Roomy Algorithm

Our proprietary matching algorithm analyzes multiple factors to find your ideal living situation:

### Preference Matching
- Budget alignment with available rooms
- Location preferences and university proximity
- Room type preferences (single, shared, etc.)
- Amenity requirements

### Personality Compatibility
- Living habits and daily routines
- Study and sleep schedules
- Social preferences
- Cleanliness standards

### Academic Alignment
- Same university preference
- Year of study similarity
- Major field compatibility

## How to get better matches

1. **Complete your profile** - Fill in all sections thoroughly
2. **Take the personality test** - This significantly improves match quality
3. **Be specific** about your preferences
4. **Keep your profile updated** with current information`
      },
      {
        id: 'how-matching-works',
        title: 'How roommate matching works',
        category: 'AI Matching',
        content: `Our AI-powered roommate matching system helps you find compatible roommates based on multiple factors.

## How it works

1. **Complete your profile**: Fill in your personal info, academic details, and housing preferences
2. **Take the personality test**: Our questionnaire helps us understand your living habits and preferences
3. **Get matched**: Our AI analyzes your profile and finds compatible roommates
4. **Connect**: View matched profiles and reach out to potential roommates

## Matching factors

We consider:
- Housing preferences (budget, location, room type)
- Academic background (university, year of study)
- Personality traits and living habits
- Schedule compatibility

## Improving your matches

- Complete all profile sections
- Take the personality test
- Keep your preferences up to date`
      },
      {
        id: 'compatibility-scores',
        title: 'Understanding compatibility scores',
        category: 'AI Matching',
        content: `Learn what the compatibility percentage means and how it's calculated.

## What is the compatibility score?

The compatibility score (shown as a percentage) indicates how well you might get along with a potential roommate based on various factors.

## How it's calculated

Our AI considers:
- **Housing preferences** (40%): Budget, location, room type alignment
- **Lifestyle compatibility** (30%): Sleep schedule, study habits, social preferences
- **Academic alignment** (20%): Same university, similar year of study
- **Personal values** (10%): Cleanliness, noise tolerance, guest policies

## Score ranges

- **90-100%**: Excellent match - highly compatible
- **75-89%**: Great match - compatible on most factors
- **60-74%**: Good match - some differences but workable
- **Below 60%**: May have significant differences`
      },
      {
        id: 'tier-plans',
        title: 'Match plan tiers explained',
        category: 'AI Matching',
        content: `Learn about the different AI Match plans available.

## Basic (Free)
- Up to 3 AI matches per day
- Basic compatibility insights
- Standard profile visibility

## Advanced
- Up to 10 AI matches per day
- Detailed compatibility breakdown
- Priority in matching queue
- Personality insights included

## VIP
- Unlimited AI matches
- Full compatibility analysis
- Top priority in matching queue
- Advanced personality insights
- Exclusive features and early access`
      }
    ]
  },
  {
    id: 'payments',
    title: 'Payments & Deposits',
    icon: 'CreditCard',
    articles: [
      {
        id: 'how-whish-payments-work',
        title: 'How Whish Payments Work',
        category: 'Payments & Deposits',
        content: `Learn how our secure payment system processes your transactions.

## About Whish

Roomy partners with Whish, a trusted payment provider, to securely process all transactions.

## Payment flow

1. **Select a room**: Choose the room you want to reserve
2. **Enter card details**: Your payment information is encrypted
3. **Authorize payment**: Confirm the transaction
4. **Funds transfer**: Payment goes directly to the dorm owner
5. **Confirmation**: You receive a booking confirmation

## Security measures

- 256-bit SSL encryption
- PCI DSS compliant processing
- Fraud detection and prevention
- Tokenized card storage

## Transaction timeline

- Authorization: Instant
- Owner receipt: 1-3 business days
- Confirmation email: Within minutes`
      },
      {
        id: 'why-deposits-non-refundable',
        title: 'Why Deposits Are Non-Refundable',
        category: 'Payments & Deposits',
        content: `Understanding Roomy's marketplace model and deposit policies.

## Roomy is a marketplace

Roomy connects students with property owners. We are not a hotel booking service and do not manage properties directly.

## How deposits work

- Deposits are paid **directly to the property owner**
- Roomy facilitates the payment but does not hold the funds
- The owner sets their own deposit amount and policies

## Why non-refundable?

1. **Direct owner payment**: Funds go straight to owners
2. **Owner discretion**: Refund policies are set by each owner
3. **Commitment protection**: Deposits protect owners from last-minute cancellations

## What you should do

- Read the dorm's cancellation policy before booking
- Contact the owner directly for refund requests
- Visit the property before making a deposit when possible

For more details, see our [Payments & Security](/legal/payments) policy.`
      },
      {
        id: 'payments-handling',
        title: 'Who handles payments and refunds?',
        category: 'Payments & Deposits',
        content: `Roomy is a marketplace platform that connects students with property owners. Here's how payments work:

## Payment Flow

All payments, including deposits, are made directly to the dorm owner. Roomy facilitates the transaction through our secure payment partner (Whish) but does not hold or manage the funds.

## Important Notice

- **Deposits are non-refundable** and are paid directly to the dorm owner
- Any refund requests must be directed to the property owner
- Roomy is not a party to the rental agreement between you and the owner

## For More Information

See our [Payments & Security](/legal/payments) policy for complete details on how transactions are processed.`
      }
    ]
  },
  {
    id: 'owners',
    title: 'Listing as an Owner',
    icon: 'Building2',
    articles: [
      {
        id: 'how-to-list-property',
        title: 'How to list your property',
        category: 'Listing as an Owner',
        content: `Get your property listed on Roomy and start connecting with students.

## Steps to list

1. **Create an owner account**: Sign up and select "Owner" account type
2. **Submit your property**: Fill in property details, photos, and pricing
3. **Verification**: Our team reviews your listing
4. **Go live**: Once approved, your listing becomes visible to students

## What you'll need

- Property photos (at least 5 high-quality images)
- Room details and pricing
- Amenities and services offered
- Contact information

## Listing tips

- Use clear, well-lit photos
- Write detailed descriptions
- Set competitive pricing
- Respond quickly to inquiries`
      },
      {
        id: 'owner-agreement-overview',
        title: 'Owner Agreement overview',
        category: 'Listing as an Owner',
        content: `Understand the terms that govern property listings on Roomy.

## What the agreement covers

- Accurate listing requirements
- Photo and description standards
- Pricing transparency
- Response time expectations
- Safety and maintenance responsibilities

## Owner obligations

- Provide truthful property information
- Maintain safe living conditions
- Respond to student inquiries promptly
- Honor confirmed reservations

## Roomy's role

- Verify listings for authenticity
- Provide platform and payment processing
- Mediate disputes when necessary
- Remove non-compliant listings

Read the full [Owner Agreement](/legal/owner-agreement).`
      },
      {
        id: 'what-owners-see',
        title: 'What Owners See About Tenants',
        category: 'Listing as an Owner',
        content: `Understanding what information is shared with property owners during the reservation process.

## Information shared with owners

When you make a reservation, owners can see:

### Basic Information
- Full name
- Profile photo
- University and year of study
- Contact email (for reservation purposes)

### Reservation Details
- Requested move-in date
- Room type preference
- Booking messages you send

## What owners cannot see

- Your compatibility scores with other students
- Your saved/wishlisted properties
- Private messages with other users
- Payment method details
- Account security settings

## Privacy protection

Your information is only shared when you initiate contact or make a reservation. Owners cannot browse student profiles without an inquiry.`
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy & Profile Visibility',
    icon: 'Eye',
    articles: [
      {
        id: 'privacy-profile-visibility',
        title: 'What Information is Visible to Roommates?',
        category: 'Privacy & Profile Visibility',
        content: `When another student gets matched with you via AI roommate matching, they can click "View Profile" on your roommate match card to see certain information about you.

## What is visible

### Personal Information
- Full name
- Age
- Gender
- Home location (governorate, district, town)

### Academic Information
- University
- Major
- Year of study

### Housing Preferences
- Monthly budget
- Preferred location/areas
- Room type preference

## What is NOT visible

The following information is kept private and never shared with matched roommates:

- Email address
- Phone number
- Exact address
- Private messages with other users
- Your saved/wishlisted dorms
- Payment information
- Account security settings

## Why we share this information

This information helps potential roommates understand if you might be a good match based on shared preferences and circumstances. It enables meaningful connections while protecting your sensitive personal data.

## Managing your visibility

You can update your profile information at any time by visiting your Profile page and editing your personal info, academic info, or housing preferences.`
      },
      {
        id: 'managing-visibility',
        title: 'Managing your profile visibility',
        category: 'Privacy & Profile Visibility',
        content: `Learn how to control what information is visible on your profile.

## Your profile settings

You have control over the information displayed on your profile. While some basic information is shared with matched roommates to facilitate connections, you can always update or modify your details.

## How to update your profile

1. Go to your Profile page
2. Tap on your profile photo or the edit button
3. Update any information you'd like to change
4. Save your changes

## Tips for privacy

- Only provide information you're comfortable sharing
- Keep sensitive details like your exact address private
- Use the messaging system for private communications`
      },
      {
        id: 'legal-rights-data-control',
        title: 'Legal Rights & Data Control',
        category: 'Privacy & Profile Visibility',
        content: `Understanding your rights regarding your personal data on Roomy.

## Your data rights

You have the right to:

### Access
- View all data we have about you
- Request a copy of your personal information

### Correction
- Update inaccurate information
- Modify your profile at any time

### Deletion
- Request deletion of your account
- Remove your data from our systems

### Portability
- Export your data in a standard format
- Transfer your information to another service

## How to exercise your rights

1. Go to Settings > Privacy & Data
2. Select the action you want to take
3. Follow the prompts to complete your request

## Data retention

- Active accounts: Data retained while account is active
- Deleted accounts: Data removed within 30 days
- Legal requirements: Some data may be retained for legal compliance

See our [Privacy Policy](/legal/privacy) for complete details.`
      },
      {
        id: 'how-roomy-protects-your-data',
        title: 'How Roomy protects your data',
        category: 'Privacy & Profile Visibility',
        content: `Roomy is committed to protecting your personal information. Here's a simple breakdown of how we handle your data.

## What data we collect

We collect only what's needed to help you find housing:

- **Account info**: Name, email, phone, university details
- **Housing preferences**: Room type, location, budget
- **AI matching data**: Personality questionnaire responses and compatibility scores

## What we don't collect

Currently, Roomy does not collect:

- Behavioral analytics or tracking cookies
- Third-party advertising identifiers

If we add analytics in the future, you'll be notified and asked to consent.

## How we use your data

Your information is used exclusively for:

- Logging in and managing your account
- Matching you with compatible roommates
- Processing housing reservations
- Sending important notifications (like verification emails)

## Your rights

You have the right to:

- **Access**: Request a copy of all your data
- **Correction**: Fix inaccurate information
- **Deletion**: Request full account and data deletion
- **Opt out**: Exclude yourself from AI matching

## How to delete your account

To request account deletion, email **security@roomylb.com** with the subject line "Account Deletion Request" followed by your full name. We'll process your request within 30 days.

## Data security

- We don't sell, rent, or share your data with advertisers
- Data is only disclosed when you contact an Owner or when required by Lebanese law
- Profile photos may remain cached up to 30 days after account deletion

## Full policy

For complete legal details, read our [Privacy Policy](/legal/privacy).`
      }
    ]
  },
  {
    id: 'legal',
    title: 'Legal',
    icon: 'Scale',
    articles: [
      {
        id: 'terms-overview',
        title: 'Terms of Service',
        category: 'Legal',
        content: `Overview of Roomy's Terms of Service.

## Key points

- Roomy is a marketplace connecting students with property owners
- Users must be 18+ or have parental consent
- All payments are processed through our secure payment partner
- Roomy is not responsible for property conditions or disputes

## User responsibilities

- Provide accurate information
- Respect other users and property
- Follow local laws and regulations
- Report violations or safety concerns

## Read the full terms

Visit our [Terms of Service](/legal/terms) page for the complete legal document.`
      },
      {
        id: 'privacy-policy-overview',
        title: 'Privacy Policy',
        category: 'Legal',
        content: `How Roomy collects, uses, and protects your personal information.

## What we collect

- Account information (name, email, phone)
- Profile details you provide
- Usage data and preferences
- Payment information (processed securely)

## How we use your data

- Provide and improve our services
- Match you with compatible roommates and dorms
- Process payments and reservations
- Send important notifications

## Data protection

- Encryption for all sensitive data
- Secure payment processing
- Regular security audits
- Limited employee access

Read our full [Privacy Policy](/legal/privacy).`
      },
      {
        id: 'owner-agreement-info',
        title: 'What is the Owner Agreement?',
        category: 'Legal',
        content: `The Owner Agreement is a set of terms that property owners must accept before listing on Roomy.

## What It Covers

The Owner Agreement includes:
- Owner responsibilities for accurate listings
- Safety and compliance requirements
- Property verification process
- Conditions for listing removal
- Liability and dispute handling

## Why It Matters to Students

The Owner Agreement helps ensure that:
- Listings are accurate and truthful
- Owners commit to basic safety standards
- There's a clear process for reporting issues

## For More Information

Read the full [Owner Agreement](/legal/owner-agreement) or visit our [Privacy Policy](/legal/privacy) to learn how your data is protected.`
      },
      {
        id: 'housing-safety',
        title: 'Is Roomy responsible for housing safety?',
        category: 'Legal',
        content: `Roomy is a digital marketplace that connects students with property owners. Here's what you need to know about safety responsibilities:

## Roomy's Role

Roomy verifies listings to reduce scams and fake postings. However, Roomy does not:
- Inspect physical properties
- Guarantee safety or maintenance standards
- Serve as a landlord or property manager

## Owner Responsibilities

Property owners are responsible for:
- Maintaining safe living conditions
- Providing accurate listing information
- Complying with local housing regulations

## Your Rights

If you encounter safety issues:
1. Contact the property owner directly
2. Report the issue to local authorities if necessary
3. You may report unsafe conditions to Roomy, and we may take action at our discretion

## For More Information

See our [Terms of Service](/legal/terms) for the full Marketplace Disclaimer.`
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: 'Wrench',
    articles: [
      {
        id: 'login-issues',
        title: 'Login issues',
        category: 'Troubleshooting',
        content: `Having trouble logging in? Here's how to fix common issues.

## Common problems and solutions

### Forgot password
1. Click "Forgot password" on the login page
2. Enter your email address
3. Check your inbox for the reset link
4. Create a new password

### Email not recognized
- Make sure you're using the email you signed up with
- Check for typos in your email address
- Try signing up if you haven't created an account

### Password not working
- Ensure Caps Lock is off
- Try copying and pasting your password
- Reset your password if needed

### Account locked
- Wait 15 minutes before trying again
- Contact support if the issue persists

## Still need help?

[Contact Support](/contact) for assistance.`
      },
      {
        id: 'confirmation-email-not-received',
        title: "I didn't receive a confirmation email",
        category: 'Troubleshooting',
        content: `If you haven't received your confirmation or verification email, try these steps.

## Check your spam folder

Confirmation emails sometimes end up in spam or junk folders. Check there first.

## Wait a few minutes

Emails can sometimes be delayed. Wait up to 10 minutes before trying again.

## Resend the email

1. Go to the login page
2. Click "Resend verification email"
3. Enter your email address
4. Check your inbox (and spam folder)

## Check your email address

Make sure you entered the correct email when signing up. Typos are common!

## Common issues

- **Using work/school email**: Some institutions block external emails. Try using a personal email.
- **Full inbox**: If your inbox is full, new emails may not arrive.
- **Email filters**: Check if you have filters that might redirect or delete our emails.

## Still not working?

[Contact Support](/contact) and we'll help you verify your account manually.`
      },
      {
        id: 'payments-failing',
        title: 'Payments failing — what to do',
        category: 'Troubleshooting',
        content: `If your payment isn't going through, here's how to troubleshoot.

## Common reasons for payment failures

### Insufficient funds
Make sure your card has enough balance to cover the payment.

### Card declined
Your bank may have declined the transaction. Contact your bank to authorize the payment.

### Incorrect card details
Double-check your card number, expiry date, and CVV.

### Card not supported
We accept most major credit and debit cards. Some prepaid cards may not work.

### 3D Secure verification
Make sure to complete the verification step if prompted by your bank.

## Try these solutions

1. **Use a different card**: Try another payment method
2. **Contact your bank**: Ask them to approve international transactions
3. **Clear browser cache**: Sometimes cached data causes issues
4. **Try a different browser**: Some browsers handle payments better than others

## Payment still failing?

[Contact Support](/contact) with details about the error message you're seeing.`
      },
      {
        id: 'reservations-not-showing',
        title: 'Reservations not showing',
        category: 'Troubleshooting',
        content: `If your reservations aren't appearing in your account, try these steps.

## Refresh your page

Sometimes a simple refresh loads the latest data. Pull down to refresh on mobile or press F5 on desktop.

## Check you're logged in

Make sure you're logged into the correct account. You might have multiple accounts with different emails.

## Wait a few minutes

New reservations may take a moment to process. Wait a few minutes and check again.

## Check your email

Look for a booking confirmation email. If you received one, your reservation was processed.

## Common issues

### Payment pending
Your reservation might not appear until payment is confirmed. Check your payment status.

### Wrong account
If you made the reservation while logged out, it may be under a guest booking.

### Owner hasn't confirmed
Some reservations require owner approval before they appear as confirmed.

## Still not showing?

[Contact Support](/contact) with your booking confirmation email or payment receipt.`
      },
      {
        id: 'how-to-delete-account',
        title: 'How to Delete My Account',
        category: 'Troubleshooting',
        content: `Learn how to permanently delete your Roomy account.

## Before you delete

Consider these alternatives:
- Log out if you just need a break
- Update your profile if information is incorrect
- Contact support for any issues

## What happens when you delete

- Your profile and personal data are removed
- Active reservations may be affected
- Your matches and messages are deleted
- This action cannot be undone

## How to delete your account

1. Go to **Settings**
2. Select **Account**
3. Scroll to **Delete Account**
4. Confirm your decision
5. Enter your password to verify

## Data retention

After deletion:
- Most data is removed within 24 hours
- Some data may be retained for up to 30 days for legal purposes
- Payment records are kept for accounting requirements

## Need help instead?

[Contact Support](/contact) - we may be able to resolve your concerns without account deletion.`
      },
      {
        id: 'login-security',
        title: 'Login & security settings',
        category: 'Troubleshooting',
        content: `Manage your account security settings.

## Password

Change your password regularly for better security. Go to Settings > Login & Security to update your password.

## Two-factor authentication

Add an extra layer of security by enabling 2FA:
1. Go to Settings > Login & Security
2. Enable Two-factor authentication
3. Scan the QR code with your authenticator app
4. Enter the verification code

## Trusted devices

View and manage devices that have access to your account. Remove any devices you don't recognize.`
      },
      {
        id: 'trusted-devices',
        title: 'Managing trusted devices',
        category: 'Troubleshooting',
        content: `Learn how to manage devices connected to your account.

## Viewing your devices

Go to Settings > Login & Security > Trusted devices to see all devices that have accessed your account.

## Removing a device

If you see a device you don't recognize or no longer use:
1. Find the device in the list
2. Tap "Remove" or the trash icon
3. Confirm the removal

The device will be signed out immediately.`
      }
    ]
  }
];

export const getArticleById = (articleId: string): HelpArticle | undefined => {
  for (const category of helpCategories) {
    const article = category.articles.find(a => a.id === articleId);
    if (article) return article;
  }
  return undefined;
};

export const getCategoryById = (categoryId: string): HelpCategory | undefined => {
  return helpCategories.find(c => c.id === categoryId);
};
