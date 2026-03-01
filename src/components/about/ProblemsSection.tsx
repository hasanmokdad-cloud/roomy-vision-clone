import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import { Layers, Clock, MapPin, Users, Receipt, ChevronRight } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";

const problems = [
  {
    icon: Layers,
    title: "No Centralized Platform",
    subtitle: "Everything is scattered, nothing is clear",
    content: (
      <div className="space-y-3 text-sm md:text-base leading-relaxed text-muted-foreground">
        <p>People search across WhatsApp groups, Facebook posts, brokers, and word-of-mouth just to find available housing.</p>
        <p>Information is fragmented, outdated, and inconsistent. There's no single place to compare options, understand pricing, or verify what's real.</p>
        <p>What should be a straightforward search turns into weeks of confusion and wasted effort.</p>
      </div>
    ),
  },
  {
    icon: Clock,
    title: "Time & Uncertainty",
    subtitle: "Endless searching with no real answers",
    content: (
      <div className="space-y-3 text-sm md:text-base leading-relaxed text-muted-foreground">
        <p>Finding housing often turns into weeks of searching, messaging, and waiting, only to hear "it's no longer available" or "come check it out and we'll see."</p>
        <p>People waste time chasing unclear listings, outdated information, and vague promises, all while juggling work, studies, deadlines, and transportation.</p>
        <p>What should be a simple decision becomes exhausting and stressful, especially when time is running out.</p>
      </div>
    ),
  },
  {
    icon: MapPin,
    title: "Wasted Travel & Effort",
    subtitle: "Too many trips for too little clarity",
    content: (
      <div className="space-y-3 text-sm md:text-base leading-relaxed text-muted-foreground">
        <p>People are often forced to physically visit multiple places just to understand basic details: location accuracy, room condition, or whether the listing is even the same as the one shown in photos.</p>
        <p>Many visits end in disappointment, misleading photos, missing services, or conditions never mentioned upfront.</p>
        <p>Every unnecessary trip costs time, money, and energy, resources people don't have to spare.</p>
      </div>
    ),
  },
  {
    icon: Users,
    title: "Desperate Roommate Decisions",
    subtitle: "Choosing fast instead of choosing right",
    content: (
      <div className="space-y-3 text-sm md:text-base leading-relaxed text-muted-foreground">
        <p>When single rooms are unavailable or unaffordable, people are pushed into shared units with strangers.</p>
        <p>Under pressure and limited by budget, they rush to find roommates without properly considering compatibility, lifestyle, or expectations.</p>
        <p>These rushed decisions often lead to conflicts, uncomfortable living situations, and broken leases, but people feel they have no better option.</p>
      </div>
    ),
  },
  {
    icon: Receipt,
    title: "Confusing Prices & Expectations",
    subtitle: "What you see is rarely what you get",
    content: (
      <div className="space-y-3 text-sm md:text-base leading-relaxed text-muted-foreground">
        <p>Pricing is often unclear. Utilities, deposits, house rules, and extra fees are rarely explained properly until late in the process.</p>
        <p>People commit emotionally to a place, only to discover unexpected costs or conditions after it's too late.</p>
        <p>This lack of transparency creates frustration, mistrust, and rushed decisions people later regret.</p>
      </div>
    ),
  },
];

const ProblemsSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section ref={ref} className="py-16 md:py-24 px-4 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <div className={cn("text-center mb-10 transition-all duration-700", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
            The problems
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Finding housing shouldn't feel this stressful, but for many people, it does.
          </p>
        </div>

        <div className={cn("space-y-3 transition-all duration-700 delay-200", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div key={index}>
                <button
                  onClick={() => setOpenIndex(index)}
                  className="w-full bg-white rounded-2xl p-4 md:p-5 flex items-center justify-between hover:shadow-lg transition-all duration-300 group border border-border hover:border-primary/30 pointer-events-auto"
                  style={{ gap: '12px' }}
                >
                  <div className="flex items-center gap-3 md:gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-foreground">
                        {problem.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {problem.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>

                <ResponsiveModal
                  open={openIndex === index}
                  onOpenChange={(open) => !open && setOpenIndex(null)}
                  title={problem.title}
                  description={problem.subtitle}
                >
                  {problem.content}
                </ResponsiveModal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
