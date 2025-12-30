import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, ThumbsUp, ThumbsDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelpArticle, HelpCategory, helpCategories } from '@/data/helpArticles';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useHelpFeedback } from '@/hooks/useHelpFeedback';

interface HelpArticleViewProps {
  article: HelpArticle;
  onBack: () => void;
}

export function HelpArticleView({ article, onBack }: HelpArticleViewProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { submitFeedback, submitted, isSubmitting } = useHelpFeedback(article.id);

  // Find the category for this article
  const category = helpCategories.find(c => 
    c.articles.some(a => a.id === article.id)
  );

  // Get related articles from the same category
  const relatedArticles = category?.articles
    .filter(a => a.id !== article.id)
    .slice(0, 3) || [];

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/help/${article.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (isHelpful: boolean) => {
    submitFeedback(isHelpful);
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Handle links in markdown format [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const processedLine = line.replace(linkRegex, (_, text, url) => {
        return `<a href="${url}" class="text-primary hover:underline">${text}</a>`;
      });

      if (line.startsWith('## ')) {
        return (
          <h2 
            key={index} 
            className="text-xl font-semibold text-foreground mt-8 mb-4 first:mt-0"
          >
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 
            key={index} 
            className="text-lg font-medium text-foreground mt-6 mb-3"
          >
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('- **') && line.includes('**:')) {
        const [boldPart, ...rest] = line.replace('- **', '').split('**:');
        return (
          <li key={index} className="text-muted-foreground ml-4 mb-2 list-disc">
            <span className="font-semibold text-foreground">{boldPart}:</span>
            {rest.join('**:')}
          </li>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li 
            key={index} 
            className="text-muted-foreground ml-4 mb-2 list-disc"
            dangerouslySetInnerHTML={{ __html: processedLine.replace('- ', '') }}
          />
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li 
            key={index} 
            className="text-muted-foreground ml-4 mb-2 list-decimal"
            dangerouslySetInnerHTML={{ __html: processedLine.replace(/^\d+\.\s/, '') }}
          />
        );
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={index} className="font-semibold text-foreground mb-3">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      }
      if (line.trim() === '') {
        return <div key={index} className="h-3" />;
      }
      return (
        <p 
          key={index} 
          className="text-muted-foreground mb-3 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    });
  };

  return (
    <div className="flex-1 min-h-screen">
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <button 
              onClick={onBack}
              className="hover:text-foreground transition-colors"
            >
              Help Center
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{category?.title}</span>
          </div>

          {/* Title and Copy Button */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {article.title}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="prose prose-gray max-w-none">
          {renderContent(article.content)}
        </div>

        {/* Feedback */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-foreground font-medium mb-4">Was this article helpful?</p>
          <div className="flex gap-3">
            <Button
              variant={submitted ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFeedback(true)}
              disabled={submitted || isSubmitting}
              className={cn(
                submitted && 'bg-green-600 hover:bg-green-700'
              )}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Yes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback(false)}
              disabled={submitted || isSubmitting}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              No
            </Button>
          </div>
          {submitted && (
            <p className="text-sm text-muted-foreground mt-2">Thanks for your feedback!</p>
          )}
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Related articles</h3>
            <div className="space-y-2">
              {relatedArticles.map((related) => (
                <button
                  key={related.id}
                  onClick={() => navigate(`/help/${related.id}`)}
                  className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left"
                >
                  <span className="text-sm text-foreground">{related.title}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contact Support CTA */}
        <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-xl">
          <h3 className="font-semibold text-foreground mb-2">Still need help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Button onClick={() => navigate('/contact')}>
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
