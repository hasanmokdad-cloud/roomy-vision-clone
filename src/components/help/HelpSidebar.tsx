import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronRight, Rocket, Sparkles, CreditCard, Building2, Eye, Scale, Wrench, HelpCircle, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HelpCategory, HelpArticle } from '@/data/helpArticles';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ReactNode> = {
  Rocket: <Rocket className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  CreditCard: <CreditCard className="w-4 h-4" />,
  Building2: <Building2 className="w-4 h-4" />,
  Eye: <Eye className="w-4 h-4" />,
  Scale: <Scale className="w-4 h-4" />,
  Wrench: <Wrench className="w-4 h-4" />,
  HelpCircle: <HelpCircle className="w-4 h-4" />,
};

interface HelpSidebarProps {
  categories: HelpCategory[];
  currentArticleId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onArticleClick: (articleId: string) => void;
}

export function HelpSidebar({
  categories,
  currentArticleId,
  searchQuery,
  onSearchChange,
  onArticleClick,
}: HelpSidebarProps) {
  const navigate = useNavigate();
  
  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    // Initially expand the category containing the current article
    const initialExpanded = new Set<string>();
    if (currentArticleId) {
      for (const category of categories) {
        if (category.articles.some(a => a.id === currentArticleId)) {
          initialExpanded.add(category.id);
          break;
        }
      }
    }
    return initialExpanded;
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Filter articles based on search
  const filteredCategories = searchQuery
    ? categories.map(category => ({
        ...category,
        articles: category.articles.filter(article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.articles.length > 0)
    : categories;

  return (
    <div className="w-72 flex-shrink-0 border-r border-border bg-card">
      <div className="sticky top-0 h-screen flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <Link to="/help" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Help Center</span>
          </Link>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-1">
            {/* FAQ Link */}
            <button
              onClick={() => navigate('/faq')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">FAQ</span>
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Categories */}
            {filteredCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const hasActiveArticle = category.articles.some(a => a.id === currentArticleId);

              return (
                <Collapsible
                  key={category.id}
                  open={isExpanded || hasActiveArticle}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{iconMap[category.icon]}</span>
                      <span className="text-sm font-medium">{category.title}</span>
                    </div>
                    {isExpanded || hasActiveArticle ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="ml-7 mt-1 space-y-0.5">
                      {category.articles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => onArticleClick(article.id)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                            currentArticleId === article.id
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          {article.title}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => navigate('/contact')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
