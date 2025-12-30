import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import RoomyLogo from '@/assets/roomy-logo.png';

export const Footer = () => {
  return (
    <footer className="py-20 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img 
                src={RoomyLogo} 
                alt="Roomy" 
                className="w-10 h-10 rounded-xl"
              />
              <span className="text-2xl font-bold gradient-text">Roomy</span>
            </div>
            <p className="text-sm text-foreground/60 leading-relaxed">
              AI-powered platform connecting students with their perfect dorm in Jbeil.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2">
              {['Home', 'Dorms', 'AI Match', 'About', 'Contact'].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="text-sm text-foreground/60 hover:text-primary transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-foreground/60">
                <Mail className="w-4 h-4 text-secondary" />
                <span>info@roomylb.com</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground/60">
                <Phone className="w-4 h-4 text-secondary" />
                <span className="italic">Coming Soon</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground/60">
                <MapPin className="w-4 h-4 text-secondary" />
                <span>Beirut, Lebanon</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Newsletter</h3>
            <p className="text-sm text-foreground/60">
              Get the latest dorm listings and AI tips.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary/50 focus:outline-none transition-colors"
              />
              <button className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all duration-300">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground/60">
            © 2025 Roomy. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 md:gap-6">
            <Link to="/legal/terms" className="text-sm text-foreground/60 hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="/legal/privacy" className="text-sm text-foreground/60 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/legal/payments" className="text-sm text-foreground/60 hover:text-primary transition-colors">
              Payments
            </Link>
            <Link to="/legal/cookies" className="text-sm text-foreground/60 hover:text-primary transition-colors">
              Cookies
            </Link>
            <Link to="/faq" className="text-sm text-foreground/60 hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link to="/help" className="text-sm text-foreground/60 hover:text-primary transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
