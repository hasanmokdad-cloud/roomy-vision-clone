import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQQuestion } from "@/data/faqData";

interface Props {
  categoryId: string;
  categoryLabel: string;
  questions: FAQQuestion[];
  isActive: boolean;
}

const FAQAccordionSection = ({ categoryId, categoryLabel, questions, isActive }: Props) => {
  if (!isActive) return null;
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 rounded-full" style={{ backgroundColor: "#2563eb" }} />
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: "#2563eb" }}>
          {categoryLabel}
        </h2>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {questions.map((item, i) => (
          <AccordionItem
            key={i}
            value={`${categoryId}-${i}`}
            className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 overflow-hidden"
            style={{ borderBottom: "1px solid #e5e7eb" }}
          >
            <AccordionTrigger className="py-4 text-left hover:no-underline text-sm md:text-base font-medium text-gray-900 [&[data-state=open]]:text-[#2563eb]">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-0 text-sm leading-relaxed" style={{ color: "#6b7280" }}>
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQAccordionSection;
