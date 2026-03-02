import { Helmet } from "react-helmet-async";
import { RoomyNavbar } from "@/components/RoomyNavbar";
import Footer from "@/components/shared/Footer";
import ContactHeader from "@/components/contact/ContactHeader";
import ContactFormCard from "@/components/contact/ContactFormCard";
import ContactInfoCard from "@/components/contact/ContactInfoCard";
import SocialLinksCard from "@/components/contact/SocialLinksCard";
import { useIsMobile } from "@/hooks/use-mobile";

const Contact = () => {
  const isMobile = useIsMobile();
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F0F4F8" }}>
      {!isMobile && <RoomyNavbar />}
      <Helmet>
        <title>Contact Tenanters | Get in Touch</title>
        <meta name="description" content="Have questions about Tenanters? Reach out to our team for support, partnerships, or general inquiries." />
      </Helmet>
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-6xl mx-auto">
          <ContactHeader />
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <ContactFormCard />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <ContactInfoCard />
              <SocialLinksCard />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default Contact;
