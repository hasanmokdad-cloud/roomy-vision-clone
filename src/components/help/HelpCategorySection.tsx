import { useNavigate } from 'react-router-dom';
import { ChevronRight, Rocket, Sparkles, CreditCard, Building2, Eye, Scale, Wrench, HelpCircle } from 'lucide-react';
import { HelpCategory } from '@/data/helpArticles';

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

interface HelpCategorySectionProps {
  category: HelpCategory;
  onArticleClick: (articleId: string) => void;
}

export function HelpCategorySection({ category, onArticleClick }: HelpCategorySectionProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Category Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {iconMap[category.icon]}
        </div>
        <div>
          <h2 className="font-semibold text-foreground">{category.title}</h2>
          <p className="text-xs text-muted-foreground">{category.articles.length} articles</p>
        </div>
      </div>

      {/* Articles List */}
      <div className="divide-y divide-border">
        {category.articles.map((article) => (
          <button
            key={article.id}
            onClick={() => onArticleClick(article.id)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm text-foreground">{article.title}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
