import { Helmet } from "react-helmet-async";
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
      <main>
        <AboutIntroSection />
        <ProblemsSection />
        <SolutionsSection />
      </main>
    </>
  );
};

export default About;
