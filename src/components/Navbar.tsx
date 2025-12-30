import { motion } from 'framer-motion';
import { Home, Sparkles, Info, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import RoomyLogo from '@/assets/roomy-logo.png';
import { useAuth } from '@/contexts/AuthContext';

export const Navbar = () => {
  const { openAuthModal } = useAuth();
  
  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Building2, label: 'Dorms', href: '/listings' },
    { icon: Sparkles, label: 'AI Match', href: '/ai-match' },
    { icon: Info, label: 'About', href: '/about' },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto navbar-water-glass rounded-2xl px-6 py-3 flex items-center justify-between relative overflow-hidden">
        {/* Water caustics overlay */}
        <div className="navbar-water-caustics" />
        <Link to="/">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <img 
              src={RoomyLogo} 
              alt="Roomy" 
              className="w-10 h-10 rounded-xl"
            />
            <span className="text-2xl font-bold gradient-text">Roomy</span>
          </motion.div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item, index) => (
            <Link key={item.label} to={item.href}>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 transition-all"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </motion.div>
            </Link>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <Button
            variant="ghost"
            asChild
            className="hidden md:flex items-center gap-2"
          >
            <Link to="/contact">
              <Phone className="w-4 h-4" />
              Reach Us
            </Link>
          </Button>
          <Button
            onClick={openAuthModal}
            className="bg-gradient-to-r from-primary to-secondary text-white font-semibold px-6 py-2 rounded-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300"
          >
            Get Started
          </Button>
        </motion.div>
      </div>
    </motion.nav>
  );
};
