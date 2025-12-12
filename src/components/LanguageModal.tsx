import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface LanguageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', region: 'United States' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'لبنان' },
];

export function LanguageModal({ open, onOpenChange }: LanguageModalProps) {
  const { i18n, t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem('roomy_language');
    if (savedLang) {
      setSelectedLanguage(savedLang);
    }
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLanguage(langCode);
    i18n.changeLanguage(langCode);
    localStorage.setItem('roomy_language', langCode);
    
    // Update document direction for RTL support
    if (langCode === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t('language.chooseLanguage', 'Choose a language')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 pt-2">
          <p className="text-sm text-muted-foreground mb-4 px-2">
            {t('language.subtitle', 'Select your preferred language for Roomy')}
          </p>
          
          <div className="grid grid-cols-1 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all",
                  "hover:bg-accent/50 hover:border-primary/30",
                  selectedLanguage === lang.code
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium text-foreground">
                    {lang.nativeName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {lang.name} · {lang.region}
                  </span>
                </div>
                
                {selectedLanguage === lang.code && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
