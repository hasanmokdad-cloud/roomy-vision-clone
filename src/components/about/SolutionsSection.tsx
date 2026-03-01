import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, UserCheck, Shield, Eye, Maximize2 } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";

const solutions = [
  {
    icon: LayoutDashboard,
    title: "One Centralized Platform",
    subtitle: "Everything in one place",
    content: (
      <div className="space-y-3 text-sm md:text-base leading-relaxed text-muted-foreground">
        <p>Tenanters brings long-term housing into a single, structured platform.</p>
        <p>Listings are organized, searchable, and comparable, so you don't have to jump between apps, chats, and unreliable sources.</p>
        <p>One place. Clear options. Less chaos.</p>
      </div>
    ),
  },
  {
    icon: FileText,
    title: "Clear & Structured Listings",
    subtitle: "Understand your options before committing",
    content: (
      <div className="space-y-3 text-sm md:text-base leading-relaxed text-muted-foreground">
        <p>Tenanters introduces structured listings with consistent information: pricing breakdowns, room types, included utilities, rules, and availability.</p>
        <p>Instead of guessing, you can compare options side-by-side and understand exactly what you're paying for.</p>
        <p>Less confusion upfront means better decisions and fewer surprises later.</p>
      </div>
    ),
  },
  {
    icon: UserCheck,
    title: "Smarter Matching",
    subtitle: "Housing that fits your needs, not just your budget",
    content: (
      <div className="space-y-3 text-sm md:text-base leading-relaxed text-muted-foreground">
        <p>When needed, Tenanters helps match you with housing options and roommates based on preferences, lifestyle, and compatibility.</p>
        <p>This reduces mismatches, rushed roommate choices, and last-minute stress.</p>
        <p>It's not about forcing decisions, it's about guiding you toward better ones.</p>
      </div>
    ),
  },
  {
    icon: Shield,
    title: "Reserve With Confidence",
    subtitle: "Less back-and-forth, more certainty",
    content: (
      <div className="space-y-3 text-sm md:text-base leading-relaxed text-muted-foreground">
        <p>Tenanters streamlines communication and reservation requests so you can move forward without endless messaging or uncertainty.</p>
        <p>The process is designed to feel guided, clear, and intentional, not rushed or chaotic.</p>
        <p>The goal is simple: help you secure housing with confidence, not anxiety.</p>
      </div>
    ),
  },
  {
    icon: Eye,
    title: "See More Before You Go",
    subtitle: "Fewer wasted trips",
    content: (
      <div className="space-y-3 text-sm md:text-base leading-relaxed text-muted-foreground">
        <p>With detailed photos, structured information, and virtual tours when available, Tenanters helps you understand places better before visiting in person.</p>
        <p>This reduces unnecessary travel and helps you focus only on places that truly meet your needs.</p>
      </div>
    ),
  },
];

const SolutionsSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const renderCard = (index: number, extraClass?: string) => {
    const solution = solutions[index];
    const Icon = solution.icon;
    return (
      <div key={index} className={cn("flex flex-col", extraClass)}>
        <button
          onClick={() => setOpenIndex(index)}
          className="relative w-full bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 text-center hover:shadow-lg transition-all duration-300 group border border-border hover:border-primary/30 h-full flex flex-col items-center pointer-events-auto min-h-[160px] lg:min-h-[240px]"
        >
          <div className="absolute top-3 right-3">
            <Maximize2 className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm lg:text-base font-semibold text-foreground mb-1">
            {solution.title}
          </h3>
          <p className="text-xs lg:text-sm text-muted-foreground">
            {solution.subtitle}
          </p>
        </button>

        <ResponsiveModal
          open={openIndex === index}
          onOpenChange={(open) => !open && setOpenIndex(null)}
          title={solution.title}
          description={solution.subtitle}
        >
          {solution.content}
        </ResponsiveModal>
      </div>
    );
  };

  return (
    <section ref={ref} className="py-16 md:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className={cn("text-center mb-10 transition-all duration-700", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            Our solutions
          </h2>
        </div>

        {/* Mobile: 2-column grid */}
        <div className={cn("grid grid-cols-2 gap-3 lg:hidden transition-all duration-700 delay-200", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="col-span-2 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((index) => renderCard(index))}
          </div>
          <div className="col-span-2 flex justify-center">
            {renderCard(4, "w-[calc(50%-6px)]")}
          </div>
        </div>

        {/* Desktop: 3-column layout */}
        <div className={cn("hidden lg:block space-y-4 transition-all duration-700 delay-200", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((index) => renderCard(index))}
          </div>
          <div className="flex justify-center gap-4">
            {[3, 4].map((index) => renderCard(index, "w-[calc((100%-24px)/3)]"))}
          </div>
        </div>

        <p className={cn("text-center text-sm text-muted-foreground mt-12 transition-all duration-700 delay-400", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          Starting in Lebanon. Expanding building by building.
        </p>
      </div>
    </section>
  );
};

export default SolutionsSection;
