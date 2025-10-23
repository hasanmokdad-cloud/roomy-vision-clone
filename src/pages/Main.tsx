import { FluidBackground } from '@/components/FluidBackground';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { DormListings } from '@/components/DormListings';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';

const Main = () => {
  return (
    <div className="relative min-h-screen">
      <FluidBackground />
      <Navbar />
      <Hero />
      <HowItWorks />
      <DormListings />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Main;
