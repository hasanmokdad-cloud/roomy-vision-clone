import { memo } from 'react';
import { Clock, Shield, FileText, ChevronRight } from 'lucide-react';

interface ThingsToKnowProps {
  houseRules?: string[];
  safetyFeatures?: string[];
  cancellationPolicy?: string;
}

function ThingsToKnowComponent({
  houseRules,
  safetyFeatures,
  cancellationPolicy,
}: ThingsToKnowProps) {
  const hasContent = (houseRules?.length || 0) > 0 || 
                     (safetyFeatures?.length || 0) > 0 || 
                     cancellationPolicy;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="py-6 border-b">
      <h3 className="text-xl font-semibold mb-6">Things to know</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* House Rules */}
        {houseRules && houseRules.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5" />
              <h4 className="font-medium">House rules</h4>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {houseRules.slice(0, 4).map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
            {houseRules.length > 4 && (
              <button className="flex items-center gap-1 mt-3 text-sm font-medium underline">
                Show more
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Safety & Property */}
        {safetyFeatures && safetyFeatures.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5" />
              <h4 className="font-medium">Safety & property</h4>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {safetyFeatures.slice(0, 4).map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
            {safetyFeatures.length > 4 && (
              <button className="flex items-center gap-1 mt-3 text-sm font-medium underline">
                Show more
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Cancellation Policy */}
        {cancellationPolicy && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              <h4 className="font-medium">Cancellation policy</h4>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-4">
              {cancellationPolicy}
            </p>
            <button className="flex items-center gap-1 mt-3 text-sm font-medium underline">
              Show more
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const ThingsToKnow = memo(ThingsToKnowComponent);
