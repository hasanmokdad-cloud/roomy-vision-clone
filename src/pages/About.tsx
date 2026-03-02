import { Helmet } from "react-helmet-async";
import { RoomyNavbar } from "@/components/RoomyNavbar";
import Footer from "@/components/shared/Footer";
import AboutIntroSection from "@/components/about/AboutIntroSection";
import ProblemsSection from "@/components/about/ProblemsSection";
import SolutionsSection from "@/components/about/SolutionsSection";

const About = () => {
  return (
    <>
      <Helmet>
        <title>About Tenanters | Our mission</title>
        <meta name="description" content="Learn how Tenanters makes finding safe, affordable housing in Lebanon simpler, clearer, and more transparent." />
        <meta property="og:title" content="About Tenanters | Our mission" />
        <meta property="og:description" content="Learn how Tenanters makes finding safe, affordable housing in Lebanon simpler, clearer, and more transparent." />
      </Helmet>
      <RoomyNavbar />
      <main className="bg-[hsl(210,40%,96.1%)]">
        <AboutIntroSection />
        <ProblemsSection />
        <SolutionsSection />
      </main>
      <Footer />
    </>
  );
};

export default About;
