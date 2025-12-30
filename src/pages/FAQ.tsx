import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, HelpCircle } from 'lucide-react';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { SwipeableSubPage } from '@/components/mobile/SwipeableSubPage';
import { SubPageHeader } from '@/components/mobile/SubPageHeader';
import { Button } from '@/components/ui/button';
import { faqData, FAQCategory } from '@/data/faq';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export default function FAQ() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState<string>(faqData[0]?.id || 'general');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = sectionRefs.current[categoryId];
    if (element) {
      const offset = isMobile ? 140 : 180; // Account for sticky header + pills
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  const CategoryPills = () => (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {faqData.map((category) => (
        <button
          key={category.id}
          onClick={() => scrollToCategory(category.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
            activeCategory === category.id
              ? "bg-primary text-primary-foreground border-primary shadow-md"
              : "bg-card text-foreground border-border hover:bg-muted hover:border-primary/30"
          )}
        >
          {category.category}
        </button>
      ))}
    </div>
  );

  const FAQSection = ({ category }: { category: FAQCategory }) => (
    <div
      ref={(el) => (sectionRefs.current[category.id] = el)}
      className="scroll-mt-48"
    >
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Category header with left accent */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
          <div className="w-1 h-6 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">{category.category}</h2>
        </div>

        {/* Accordion items */}
        <Accordion type="single" collapsible className="divide-y divide-border">
          {category.items.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`${category.id}-${index}`}
              className="border-none"
            >
              <AccordionTrigger className="px-5 py-4 text-left hover:no-underline hover:bg-muted/50 transition-colors [&[data-state=open]]:text-primary">
                <span className="text-sm font-medium pr-4">{item.q}</span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4 pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );

  const ContactCTA = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 md:p-8 text-center"
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <HelpCircle className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Can't find what you're looking for?
      </h3>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
        Our support team is here to help you with any questions about Roomy.
      </p>
      <Button onClick={() => navigate('/contact')} className="gap-2">
        <MessageCircle className="w-4 h-4" />
        Contact Support
      </Button>
    </motion.div>
  );

  // Mobile view
  if (isMobile) {
    return (
      <SwipeableSubPage onBack={() => navigate(-1)}>
        <SubPageHeader title="FAQ" onBack={() => navigate(-1)} />
        <div className="pt-16 pb-32">
          {/* Header */}
          <div className="px-6 py-6 bg-gradient-to-b from-muted/50 to-background">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-2xl font-bold text-foreground mb-2">FAQ</h1>
              <p className="text-muted-foreground text-sm">
                Find answers to common questions about Roomy
              </p>
            </motion.div>
          </div>

          {/* Sticky category pills */}
          <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
            <CategoryPills />
          </div>

          {/* FAQ sections */}
          <div className="px-4 py-6 space-y-6">
            {faqData.map((category) => (
              <FAQSection key={category.id} category={category} />
            ))}

            {/* Contact CTA */}
            <div className="pt-4">
              <ContactCTA />
            </div>
          </div>
        </div>
      </SwipeableSubPage>
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-background">
      <RoomyNavbar />

      {/* Hero header */}
      <div className="bg-gradient-to-b from-muted/60 via-muted/30 to-background pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">FAQ</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about Roomy
            </p>
          </motion.div>
        </div>
      </div>

      {/* Sticky category pills */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <CategoryPills />
        </div>
      </div>

      {/* FAQ content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          {faqData.map((category) => (
            <FAQSection key={category.id} category={category} />
          ))}
        </motion.div>

        {/* Contact CTA */}
        <div className="mt-12">
          <ContactCTA />
        </div>
      </div>

      <Footer />
    </div>
  );
}
