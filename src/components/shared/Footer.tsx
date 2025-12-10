import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import RoomyLogo from '@/assets/roomy-logo.png';

export default function Footer() {
  const universities = [
    { name: 'LAU (Byblos)', href: '/listings' },
    { name: 'LAU (Beirut)', href: '/listings' },
    { name: 'AUB', href: '/listings' },
    { name: 'USEK', href: '/listings' },
    { name: 'USJ', href: '/listings' },
  ];

  return (
    <footer className="border-t border-white/10 bg-black/40 backdrop-blur-sm py-16 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Left Block */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img 
                src={RoomyLogo} 
                alt="Roomy" 
                className="w-10 h-10 rounded-xl"
              />
              <span className="text-2xl font-bold gradient-text">Roomy</span>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              AI-powered smart student living platform. Find verified dorms safely and quickly.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/listings" className="text-sm text-foreground/70 hover:text-primary transition-colors story-link">
                  Browse Dorms
                </Link>
              </li>
              <li>
                <Link to="/ai-match" className="text-sm text-foreground/70 hover:text-primary transition-colors story-link">
                  AI Match
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-foreground/70 hover:text-primary transition-colors story-link">
                  About Roomy
                </Link>
              </li>
            </ul>
          </div>

          {/* Universities */}
          <div>
            <h3 className="font-bold text-lg mb-4">Universities</h3>
            <ul className="space-y-2">
              {universities.map(uni => (
                <li key={uni.name}>
                  <Link 
                    to={uni.href} 
                    className="text-sm text-foreground/70 hover:text-primary transition-colors story-link"
                  >
                    {uni.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Jbeil, Lebanon</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground/70">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="mailto:info@roomylb.com" className="hover:text-primary transition-colors">
                  info@roomylb.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground/70">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="tel:+96181858026" className="hover:text-primary transition-colors">
                  +961 81 858 026
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-sm text-foreground/60 text-center">
            © 2025 Roomy. Making student living smarter and safer in Lebanon.
          </p>
        </div>
      </div>
    </footer>
  );
}
