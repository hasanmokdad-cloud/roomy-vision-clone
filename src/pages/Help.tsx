import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Search, MessageCircle, HelpCircle, Menu, X } from 'lucide-react';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { SwipeableSubPage } from '@/components/mobile/SwipeableSubPage';
import { SubPageHeader } from '@/components/mobile/SubPageHeader';
import { helpCategories, getArticleById, HelpCategory, HelpArticle } from '@/data/helpArticles';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpSidebar } from '@/components/help/HelpSidebar';
import { HelpArticleView } from '@/components/help/HelpArticleView';
import { HelpCategorySection } from '@/components/help/HelpCategorySection';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Rocket, Sparkles, CreditCard, Building2, Eye, Scale, Wrench } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Rocket: <Rocket className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  CreditCard: <CreditCard className="w-5 h-5" />,
  Building2: <Building2 className="w-5 h-5" />,
  Eye: <Eye className="w-5 h-5" />,
  Scale: <Scale className="w-5 h-5" />,
  Wrench: <Wrench className="w-5 h-5" />,
  HelpCircle: <HelpCircle className="w-5 h-5" />,
};

export default function Help() {
  const navigate = useNavigate();
  const { articleId } = useParams();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get current article if viewing one
  const currentArticle = articleId ? getArticleById(articleId) : null;

  // Filter articles based on search
  const filteredCategories = searchQuery
    ? helpCategories.map(category => ({
        ...category,
        articles: category.articles.filter(article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.articles.length > 0)
    : helpCategories;

  const handleArticleClick = (id: string) => {
    navigate(`/help/${id}`);
    setMobileMenuOpen(false);
  };

  const renderArticleContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Handle links in markdown format [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const processedLine = line.replace(linkRegex, (_, text, url) => {
        return `<a href="${url}" class="text-primary hover:underline">${text}</a>`;
      });

      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-lg font-semibold text-foreground mt-6 mb-3">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-base font-medium text-foreground mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('- ')) {
        return (
          <li 
            key={index} 
            className="text-muted-foreground ml-4 mb-1"
            dangerouslySetInnerHTML={{ __html: processedLine.replace('- ', '') }}
          />
        );
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-medium text-foreground mb-2">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }
      return (
        <p 
          key={index} 
          className="text-muted-foreground mb-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    });
  };

  // Mobile article view
  if (isMobile && currentArticle) {
    return (
      <SwipeableSubPage onBack={() => navigate('/help')}>
        <SubPageHeader title={currentArticle.title} onBack={() => navigate('/help')} />
        <div className="pt-16 pb-32 px-6">
          <div className="text-xs text-muted-foreground mb-4">{currentArticle.category}</div>
          <div className="prose prose-sm max-w-none">
            {renderArticleContent(currentArticle.content)}
          </div>
        </div>
      </SwipeableSubPage>
    );
  }

  // Mobile main help view
  if (isMobile) {
    return (
      <SwipeableSubPage onBack={() => navigate(-1)}>
        <SubPageHeader title="Help Center" onBack={() => navigate(-1)} />
        <div className="pt-16 pb-32 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Browse FAQ link */}
            <div className="bg-muted/50 border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Looking for quick answers?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/faq')}
                className="gap-2 w-full"
              >
                <HelpCircle className="w-4 h-4" />
                Browse FAQ
              </Button>
            </div>

            {/* Categories with Accordion */}
            <Accordion type="multiple" className="space-y-3">
              {(searchQuery ? filteredCategories : helpCategories).map((category) => (
                <AccordionItem 
                  key={category.id} 
                  value={category.id}
                  className="border border-border rounded-xl overflow-hidden bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {iconMap[category.icon]}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">{category.title}</p>
                        <p className="text-xs text-muted-foreground">{category.articles.length} articles</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-0">
                    <div className="divide-y divide-border border-t border-border">
                      {category.articles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => handleArticleClick(article.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm text-foreground">{article.title}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Contact support */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <h3 className="font-medium text-foreground mb-2">Still need help?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Can't find what you're looking for? Contact our support team.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/contact')}
                className="gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Support
              </Button>
            </div>
          </motion.div>
        </div>
      </SwipeableSubPage>
    );
  }

  // Desktop view with sidebar
  return (
    <div className="min-h-screen bg-background">
      <RoomyNavbar />
      
      <div className="pt-16 flex">
        {/* Sidebar */}
        <HelpSidebar
          categories={helpCategories}
          currentArticleId={articleId || null}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onArticleClick={handleArticleClick}
        />

        {/* Main Content */}
        {currentArticle ? (
          <HelpArticleView 
            article={currentArticle} 
            onBack={() => navigate('/help')} 
          />
        ) : (
          <div className="flex-1 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
              <div className="max-w-4xl mx-auto px-8 py-12">
                <h1 className="text-3xl font-bold text-foreground mb-2">Help Center</h1>
                <p className="text-muted-foreground">
                  Find answers to common questions and learn how to use Roomy
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-8 py-8">
              {/* Browse FAQ Card */}
              <div className="bg-muted/50 border border-border rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Browse FAQ</h3>
                    <p className="text-muted-foreground text-sm">
                      Quick answers to the most common questions
                    </p>
                  </div>
                  <Button onClick={() => navigate('/faq')} variant="outline" className="gap-2">
                    <HelpCircle className="w-4 h-4" />
                    View FAQ
                  </Button>
                </div>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(searchQuery ? filteredCategories : helpCategories).map((category) => (
                  <HelpCategorySection
                    key={category.id}
                    category={category}
                    onArticleClick={handleArticleClick}
                  />
                ))}
              </div>

              {/* Contact Support */}
              <div className="mt-12 bg-primary/5 border border-primary/20 rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-2">Still need help?</h3>
                <p className="text-muted-foreground mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <Button onClick={() => navigate('/contact')} className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Contact Support
                </Button>
              </div>
            </div>

            <Footer />
          </div>
        )}
      </div>
    </div>
  );
}
