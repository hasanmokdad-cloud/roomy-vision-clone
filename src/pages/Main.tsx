import Navbar from '@/components/shared/Navbar';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { DormListings } from '@/components/DormListings';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { RoomyAI } from '@/components/RoomyAI';

const Main = () => {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <DormListings />
      <Footer />
      <WhatsAppButton />
      <RoomyAI />
    </div>
  );
};

export default Main;
