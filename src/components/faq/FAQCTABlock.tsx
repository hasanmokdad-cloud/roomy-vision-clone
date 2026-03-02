import { Link } from "react-router-dom";
import { HelpCircle, MessageCircle } from "lucide-react";

const FAQCTABlock = () => (
  <div
    className="rounded-2xl p-8 md:p-12 text-center mt-8"
    style={{ background: "linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)" }}
  >
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
      style={{ background: "linear-gradient(135deg, #8b5cf6, #a855f7)" }}
    >
      <HelpCircle className="w-7 h-7 text-white" />
    </div>
    <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#2563eb" }}>
      Can't find what you're looking for?
    </h3>
    <p className="mb-6 max-w-md mx-auto" style={{ color: "#6b7280" }}>
      Our support team is here to help you with any questions about Tenanters.
    </p>
    <Link
      to="/contact"
      className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-opacity hover:opacity-90"
      style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
    >
      <MessageCircle className="w-4 h-4" />
      Contact Support
    </Link>
  </div>
);

export default FAQCTABlock;
