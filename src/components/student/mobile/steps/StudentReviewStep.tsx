import { motion } from 'framer-motion';
import { User, MapPin, GraduationCap, Heart, Home, DollarSign, Edit2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentReviewStepProps {
  data: {
    full_name: string;
    age: number;
    gender: string;
    governorate: string;
    district: string;
    university: string;
    major: string;
    year_of_study: number;
    personality_sleep_schedule: string;
    personality_noise_tolerance: string;
    personality_cleanliness_level: string;
    personality_intro_extro: string;
    city: string;
    preferred_housing_area: string;
    // distance_preference: string; // COMMENTED - future implementation
    budget: number;
    room_type: string;
    accommodation_status: string;
    needs_roommate: boolean;
  };
  onEdit: (step: number) => void;
}

const StudentReviewStep = ({ data, onEdit }: StudentReviewStepProps) => {
  const sections = [
    {
      title: 'Personal Info',
      icon: User,
      step: 2,
      items: [
        { label: 'Name', value: data.full_name || 'Not set' },
        { label: 'Age', value: data.age ? `${data.age} years` : 'Not set' },
        { label: 'Gender', value: data.gender || 'Not set' }
      ]
    },
    {
      title: 'Location',
      icon: MapPin,
      step: 3,
      items: [
        { label: 'From', value: [data.district, data.governorate].filter(Boolean).join(', ') || 'Not set' }
      ]
    },
    {
      title: 'Academic',
      icon: GraduationCap,
      step: 4,
      items: [
        { label: 'University', value: data.university || 'Not set' },
        { label: 'Major', value: data.major || 'Not set' },
        { label: 'Year', value: data.year_of_study ? `Year ${data.year_of_study}` : 'Not set' }
      ]
    },
    {
      title: 'Lifestyle',
      icon: Heart,
      step: 6,
      items: [
        { label: 'Sleep', value: data.personality_sleep_schedule?.replace(/_/g, ' ') || 'Not set' },
        { label: 'Noise', value: data.personality_noise_tolerance?.replace(/_/g, ' ') || 'Not set' },
        { label: 'Social', value: data.personality_intro_extro || 'Not set' }
      ]
    },
    {
      title: 'Preferences',
      icon: Home,
      step: 9,
      items: [
        { label: 'City', value: data.city ? data.city.charAt(0).toUpperCase() + data.city.slice(1) : 'Not set' },
        { label: 'Area', value: data.preferred_housing_area?.replace(/_/g, ' ') || 'Not set' }
        // { label: 'Distance', value: data.distance_preference?.replace(/_/g, ' ') || 'Not set' } // COMMENTED - future implementation
      ]
    },
    {
      title: 'Budget & Type',
      icon: DollarSign,
      step: 10,
      items: [
        { label: 'Budget', value: data.budget ? `$${data.budget}/mo` : 'Not set' },
        { label: 'Room type', value: data.room_type || 'Not set' },
        { label: 'Status', value: data.accommodation_status?.replace(/_/g, ' ') || 'Not set' }
      ]
    }
  ];

  const isComplete = (items: { value: string }[]) => {
    return items.every(item => item.value !== 'Not set');
  };

  return (
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Review your profile
        </h2>
        <p className="text-muted-foreground mb-6">
          Almost there! Make sure everything looks good.
        </p>

        {/* Summary Cards */}
        <div className="space-y-3">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border-2 ${
                isComplete(section.items) 
                  ? 'border-green-500/30 bg-green-500/5' 
                  : 'border-yellow-500/30 bg-yellow-500/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">{section.title}</span>
                  {isComplete(section.items) && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(section.step)}
                  className="text-primary hover:text-primary/80"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`font-medium ${
                      item.value === 'Not set' ? 'text-yellow-600' : 'text-foreground'
                    }`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Verification Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20"
        >
          <p className="text-sm text-foreground">
            <strong>Ready to go!</strong> Your profile will help us find the perfect dorms and roommates for you.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StudentReviewStep;
