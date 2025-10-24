import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { Sparkles, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-16 mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <Badge variant="secondary" className="mb-4">About Us</Badge>
            <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
              Welcome to Roomy
            </h1>
            <p className="text-xl text-foreground/70">
              Smart Student Living — Making housing in Lebanon safer, smarter, and stress-free
            </p>
          </div>

          <div className="space-y-12">
            <div className="glass-hover rounded-2xl p-8 animate-fade-in">
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Roomy was created to solve the biggest problem facing students in Lebanon: finding safe, verified, and affordable housing without scams, outdated listings, or endless searching. We use AI to cross-check listings, match students with compatible roommates, and provide 3D virtual tours — making student housing transparent, trustworthy, and personalized.
              </p>
            </div>

            <div className="glass-hover rounded-2xl p-8 animate-fade-in">
              <h2 className="text-2xl font-bold mb-4">Why Roomy?</h2>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Roomy is redefining student living across Lebanon. Our mission is to make finding housing simple, safe, and transparent — powered by AI verification and smart matching. Whether you're studying in Jbeil, Beirut, or beyond, Roomy ensures that every listing you see is real, verified, and tailored to your lifestyle.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-hover rounded-2xl p-8 animate-fade-in">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI-Powered Matching</h3>
                <p className="text-foreground/70">
                  Our intelligent algorithm learns your preferences, budget, and lifestyle to recommend the perfect dorms and compatible roommates
                </p>
              </div>

              <div className="glass-hover rounded-2xl p-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Verified & Safe</h3>
                <p className="text-foreground/70">
                  Every listing is cross-checked by AI and our team to detect scams, fake photos, and outdated information — ensuring you only see real, available dorms
                </p>
              </div>
            </div>

            <div className="glass-hover rounded-2xl p-8 text-center animate-fade-in border-2 border-primary/20">
              <h2 className="text-2xl font-bold mb-4">Our Promise</h2>
              <p className="text-lg text-foreground/80 leading-relaxed mb-4">
                We're committed to making student housing in Lebanon transparent, safe, and accessible. Every listing is verified. Every recommendation is personalized. Every student deserves to find a home they can trust.
              </p>
              <p className="text-xl font-bold gradient-text">
                Smart Living. Safe Housing. Simple Process. 🏠
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
