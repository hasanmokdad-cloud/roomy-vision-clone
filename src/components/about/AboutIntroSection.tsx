import { useState } from "react";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import { Target, Eye, Bot, Maximize2 } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";

const cards = [
  {
    icon: Target,
    title: "Our Mission",
    subtitle: "Simplifying long-term housing in Lebanon",
    modalContent: (
      <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
        To simplify long-term housing in Lebanon for university students, working professionals, and international residents. We connect tenants with verified, affordable housing options, from shared apartments to private units, using transparent listings, AI-powered matching, and flexible semester or monthly leases. No more endless searching or uncertainty.
      </p>
    ),
  },
  {
    icon: Eye,
    title: "Our Vision",
    subtitle: "Lebanon's most trusted rental platform",
    modalContent: (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">We aspire —</p>
        <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
          To become Lebanon's most trusted long-term rental platform, where finding your second home is simple, transparent, and tailored to your lifestyle, whether you're studying, working, or relocating.
        </p>
      </div>
    ),
  },
  {
    icon: Bot,
    title: "Smart Matching, Long-Term Focus",
    subtitle: "Semester and monthly rentals, not nightly stays",
    modalContent: (
      <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
        We specialize in{" "}
        <span className="font-semibold text-foreground">semester-based and monthly rentals</span>. Our AI learns your budget, location preferences, and lifestyle needs to recommend compatible housing and roommates. We're built for tenants who need a real home, not just a place to crash.
      </p>
    ),
  },
];

const AboutIntroSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });
  const [openModal, setOpenModal] = useState<number | null>(null);

  return (
    <section ref={ref} className="py-16 md:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className={cn("text-center mb-12 transition-all duration-700", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            About Tenanters
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Long-term housing made simple for students, professionals, and residents across Lebanon.
          </p>
        </div>

        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-16 transition-all duration-700 delay-200", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={index}
                onClick={() => setOpenModal(index)}
                whileHover={{ scale: 1.04, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative bg-white rounded-2xl p-6 md:p-8 text-center border border-border hover:shadow-lg hover:border-primary/20 flex flex-col items-center cursor-pointer group"
                style={{ originX: 0.5, originY: 0.5 }}
              >
                <Maximize2 className="absolute top-3 right-3 w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
                  {card.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {card.subtitle}
                </p>
              </motion.button>
            );
          })}
        </div>

        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <ResponsiveModal
              key={index}
              open={openModal === index}
              onOpenChange={(open) => setOpenModal(open ? index : null)}
              title={card.title}
              description={card.subtitle}
            >
              {card.modalContent}
            </ResponsiveModal>
          );
        })}

        <div className={cn("text-center transition-all duration-700 delay-400", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <p className="text-lg md:text-xl font-semibold text-foreground mb-2">
            Your Home, Your Terms, Your Timeline.
          </p>
          <p className="text-sm md:text-base text-muted-foreground">
            Built for long-term living. Designed for real life. Powered by smart matching.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutIntroSection;
