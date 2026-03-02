import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { RoomyNavbar } from "@/components/RoomyNavbar";
import Footer from "@/components/shared/Footer";
import FAQHeader from "@/components/faq/FAQHeader";
import FAQCategoryPills from "@/components/faq/FAQCategoryPills";
import FAQAccordionSection from "@/components/faq/FAQAccordionSection";
import FAQCTABlock from "@/components/faq/FAQCTABlock";
import { faqCategories } from "@/data/faqData";

export default function FAQ() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "general";
  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setSearchParams({ category: categoryId }, { replace: true });
    },
    [setSearchParams]
  );

  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions - Tenanters</title>
        <meta name="description" content="Find answers to common questions about Tenanters." />
      </Helmet>
      <RoomyNavbar />
      <main style={{ backgroundColor: "#f3f4f6" }} className="min-h-screen pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-8">
          <FAQHeader />
          <FAQCategoryPills
            categories={faqCategories.map((c) => ({ id: c.id, label: c.label }))}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
          {faqCategories.map((category) => (
            <FAQAccordionSection
              key={category.id}
              categoryId={category.id}
              categoryLabel={category.label}
              questions={category.questions}
              isActive={activeCategory === category.id}
            />
          ))}
          <FAQCTABlock />
        </div>
      </main>
      <Footer />
    </>
  );
}
