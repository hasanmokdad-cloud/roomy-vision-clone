import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Eye, Sparkles, Shield, Rocket, Search, MessageCircle, Scale, HelpCircle } from 'lucide-react';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import Footer from '@/components/shared/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { SwipeableSubPage } from '@/components/mobile/SwipeableSubPage';
import { SubPageHeader } from '@/components/mobile/SubPageHeader';
import { helpCategories, getArticleById, HelpCategory, HelpArticle } from '@/data/helpArticles';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const iconMap: Record<string, React.ReactNode> = {
  Eye: <Eye className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  Rocket: <Rocket className="w-5 h-5" />,
  Scale: <Scale className="w-5 h-5" />,
  HelpCircle: <HelpCircle className="w-5 h-5" />,
};

export default function Help() {
  const navigate = useNavigate();
  const { articleId } = useParams();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // If articleId is provided, show that article
  const currentArticle = articleId ? getArticleById(articleId) : null;

  // Filter articles based on search
  const filteredCategories = helpCategories.map(category => ({
    ...category,
    articles: category.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.articles.length > 0);

  const renderArticleContent = (content: string) => {
    // Simple markdown-like rendering
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-lg font-semibold text-foreground mt-6 mb-3">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-base font-medium text-foreground mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="text-muted-foreground ml-4 mb-1">{line.replace('- ', '')}</li>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-medium text-foreground mb-2">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }
      return <p key={index} className="text-muted-foreground mb-2 leading-relaxed">{line}</p>;
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

            {/* Categories */}
            {(searchQuery ? filteredCategories : helpCategories).map((category) => (
              <div key={category.id} className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category.title}
                </h2>
                <div className="bg-card border border-border rounded-xl divide-y divide-border">
                  {category.articles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => navigate(`/help/${article.id}`)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-foreground">{article.title}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Browse FAQ link */}
            <div className="bg-muted/50 border border-border rounded-xl p-4 mb-4">
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

  // Desktop view
  return (
    <div className="min-h-screen bg-background">
      <RoomyNavbar />
      
      <div className="max-w-6xl mx-auto pt-24 pb-20 px-6">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h1 className="text-2xl font-bold text-foreground mb-6">Help Center</h1>
              
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category navigation */}
              <ScrollArea className="h-[calc(100vh-280px)]">
                <nav className="space-y-1">
                  {helpCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      {iconMap[category.icon]}
                      <span className="text-sm font-medium">{category.title}</span>
                    </button>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {currentArticle ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={() => navigate('/help')}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Help Center
                </button>
                
                <div className="bg-card border border-border rounded-xl p-8">
                  <div className="text-xs text-muted-foreground mb-2">{currentArticle.category}</div>
                  <h1 className="text-2xl font-bold text-foreground mb-6">{currentArticle.title}</h1>
                  <div className="prose prose-sm max-w-none">
                    {renderArticleContent(currentArticle.content)}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {(searchQuery ? filteredCategories : helpCategories).map((category) => (
                  <div key={category.id}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {iconMap[category.icon]}
                      </div>
                      <h2 className="text-lg font-semibold text-foreground">{category.title}</h2>
                    </div>
                    
                    <div className="bg-card border border-border rounded-xl divide-y divide-border">
                      {category.articles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => navigate(`/help/${article.id}`)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          <span className="text-sm text-foreground">{article.title}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Browse FAQ link */}
                <div className="bg-muted/50 border border-border rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Browse FAQ</h3>
                      <p className="text-muted-foreground text-sm">
                        Quick answers to common questions
                      </p>
                    </div>
                    <Button onClick={() => navigate('/faq')} variant="outline" className="gap-2">
                      <HelpCircle className="w-4 h-4" />
                      View FAQ
                    </Button>
                  </div>
                </div>

                {/* Contact support */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-2">Still need help?</h3>
                  <p className="text-muted-foreground mb-4">
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <Button onClick={() => navigate('/contact')} className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Contact Support
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
