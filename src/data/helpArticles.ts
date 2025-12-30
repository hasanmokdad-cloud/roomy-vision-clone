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
    id: 'privacy',
    title: 'Privacy and Visibility',
    icon: 'Eye',
    articles: [
      {
        id: 'profile-visibility',
        title: 'What profile information is visible to matched roommates',
        category: 'Privacy and Visibility',
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
        category: 'Privacy and Visibility',
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
      }
    ]
  },
  {
    id: 'ai-matching',
    title: 'AI Matching',
    icon: 'Sparkles',
    articles: [
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
    id: 'account',
    title: 'Account & Security',
    icon: 'Shield',
    articles: [
      {
        id: 'login-security',
        title: 'Login & security settings',
        category: 'Account & Security',
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
        category: 'Account & Security',
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
  },
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
      }
    ]
  },
  {
    id: 'legal-safety',
    title: 'Legal & Safety',
    icon: 'Scale',
    articles: [
      {
        id: 'payments-handling',
        title: 'Who handles payments and refunds?',
        category: 'Legal & Safety',
        content: `Roomy is a marketplace platform that connects students with property owners. Here's how payments work:

## Payment Flow

All payments, including deposits, are made directly to the dorm owner. Roomy facilitates the transaction through our secure payment partner (Whish) but does not hold or manage the funds.

## Important Notice

- **Deposits are non-refundable** and are paid directly to the dorm owner
- Any refund requests must be directed to the property owner
- Roomy is not a party to the rental agreement between you and the owner

## For More Information

See our [Payments & Security](/legal/payments) policy for complete details on how transactions are processed.`
      },
      {
        id: 'housing-safety',
        title: 'Is Roomy responsible for housing safety?',
        category: 'Legal & Safety',
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
      },
      {
        id: 'owner-agreement-info',
        title: 'What is the Owner Agreement?',
        category: 'Legal & Safety',
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
