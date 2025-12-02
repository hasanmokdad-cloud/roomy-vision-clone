import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Home, Users, Settings, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmptyMatchStateProps {
  type: 'dorms' | 'roommates' | 'rooms';
  hasPersonalityTest?: boolean;
  className?: string;
}

export const EmptyMatchState = ({ type, hasPersonalityTest = false, className }: EmptyMatchStateProps) => {
  const navigate = useNavigate();

  const getContent = () => {
    switch (type) {
      case 'dorms':
        return {
          icon: Home,
          title: 'No Perfect Dorm Matches Yet',
          description: "We couldn't find dorms that match all your preferences right now.",
          suggestions: [
            'Try adjusting your budget range',
            'Expand your preferred areas',
            'Consider different room types'
          ],
          action: {
            label: 'Adjust Preferences',
            onClick: () => navigate('/profile')
          }
        };
      case 'roommates':
        return {
          icon: Users,
          title: hasPersonalityTest ? 'No Compatible Roommates Found' : 'Complete Your Profile for Better Matches',
          description: hasPersonalityTest 
            ? "We couldn't find roommates that match your preferences."
            : 'Enable personality matching for more accurate roommate suggestions.',
          suggestions: hasPersonalityTest 
            ? [
                'Try expanding your budget range',
                'Consider different universities',
                'Adjust your preferred areas'
              ]
            : [
                'Complete the personality test',
                'Enable personality matching',
                'Fill out more profile details'
              ],
          action: {
            label: hasPersonalityTest ? 'Adjust Preferences' : 'Take Personality Test',
            onClick: () => navigate(hasPersonalityTest ? '/profile' : '/personality-test')
          }
        };
      case 'rooms':
        return {
          icon: Home,
          title: 'No Available Rooms Found',
          description: "All rooms in your preferred dorms are currently full.",
          suggestions: [
            'Try looking at similar dorms',
            'Expand your area preferences',
            'Adjust your budget'
          ],
          action: {
            label: 'View All Dorms',
            onClick: () => navigate('/listings')
          }
        };
    }
  };

  const content = getContent();
  const Icon = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="border-2 border-dashed border-muted">
        <CardContent className="p-12 text-center space-y-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10"
          >
            <Icon className="w-10 h-10 text-primary" />
          </motion.div>

          {/* Title */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">{content.title}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {content.description}
            </p>
          </div>

          {/* Suggestions */}
          <div className="space-y-3 max-w-md mx-auto">
            <p className="text-sm font-semibold flex items-center justify-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Try these suggestions:
            </p>
            <ul className="space-y-2 text-sm text-left">
              {content.suggestions.map((suggestion, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                  {suggestion}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Action Button */}
          <Button onClick={content.action.onClick} size="lg" className="gap-2">
            <Settings className="w-4 h-4" />
            {content.action.label}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
