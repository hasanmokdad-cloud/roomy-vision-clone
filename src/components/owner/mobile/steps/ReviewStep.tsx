import { motion } from 'framer-motion';
import { MapPin, Users, Camera, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IsometricRoomAnimation } from '../IsometricRoomAnimation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ReviewStepProps {
  formData: {
    city: string;
    area: string;
    address: string;
    capacity: number;
    amenities: string[];
    genderPreference: string;
    coverImage: string;
    galleryImages: string[];
    title: string;
    description: string;
  };
  onEditStep: (step: number) => void;
  agreedToOwnerTerms: boolean;
  onAgreedToOwnerTermsChange: (agreed: boolean) => void;
}

const genderLabels: Record<string, string> = {
  male: 'Male only',
  female: 'Female only',
  mixed: 'Mixed (Co-ed)',
};

const cityLabels: Record<string, string> = {
  byblos: 'Byblos',
  beirut: 'Beirut',
};

export function ReviewStep({ formData, onEditStep, agreedToOwnerTerms, onAgreedToOwnerTermsChange }: ReviewStepProps) {
  const sections = [
    {
      icon: MapPin,
      title: 'Location',
      value: formData.city && formData.area 
        ? `${cityLabels[formData.city] || formData.city} • ${formData.area}${formData.address ? ` • ${formData.address}` : ''}`
        : 'Not set',
      complete: !!formData.city && !!formData.area,
      editStep: 2,
    },
    {
      icon: Users,
      title: 'Capacity & Gender',
      value: `${formData.capacity} rooms • ${genderLabels[formData.genderPreference] || 'Not set'}`,
      complete: formData.capacity > 0 && !!formData.genderPreference,
      editStep: 3,
    },
    {
      icon: Camera,
      title: 'Photos',
      value: `${formData.coverImage ? 1 : 0} cover, ${formData.galleryImages.length} gallery`,
      complete: !!formData.coverImage,
      editStep: 9,
    },
    {
      icon: FileText,
      title: 'Description',
      value: formData.title || 'No title',
      complete: !!formData.title,
      editStep: 11,
    },
  ];

  const allComplete = sections.every((s) => s.complete);

  return (
    <div className="px-6 pt-24 pb-32">
      {/* Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-4"
      >
        <IsometricRoomAnimation phase={3} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Review your listing
        </h1>
        <p className="text-muted-foreground">
          Almost there! Make sure everything looks good.
        </p>
      </motion.div>

      {/* Summary cards */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center justify-between p-4 rounded-xl border ${
              section.complete ? 'bg-card border-border' : 'bg-amber-500/5 border-amber-500/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                section.complete ? 'bg-primary/10' : 'bg-amber-500/10'
              }`}>
                {section.complete ? (
                  <section.icon className="w-5 h-5 text-primary" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{section.title}</p>
                <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                  {section.value}
                </p>
              </div>
            </div>
            <button
              onClick={() => onEditStep(section.editStep)}
              className="text-sm font-medium text-primary underline"
            >
              Edit
            </button>
          </motion.div>
        ))}
      </div>

      {/* Amenities count */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-4 rounded-xl bg-muted/50"
      >
        <p className="text-sm text-muted-foreground">
          <strong>{formData.amenities.length}</strong> amenities selected
        </p>
      </motion.div>

      {/* Owner Agreement Checkbox */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="mt-6 p-4 rounded-xl bg-muted/50"
      >
        <div className="flex items-start gap-3">
          <Checkbox
            id="owner-agreement-checkbox"
            checked={agreedToOwnerTerms}
            onCheckedChange={(checked) => onAgreedToOwnerTermsChange(checked === true)}
            className="mt-0.5"
          />
          <Label 
            htmlFor="owner-agreement-checkbox" 
            className="text-sm text-muted-foreground leading-tight cursor-pointer"
          >
            I agree to the{' '}
            <Link 
              to="/legal/owner-agreement" 
              className="underline text-primary hover:text-primary/80"
              onClick={(e) => e.stopPropagation()}
            >
              Owner Agreement
            </Link>
          </Label>
        </div>
      </motion.div>

      {/* Verification notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`mt-4 p-4 rounded-xl flex items-start gap-3 ${
          allComplete && agreedToOwnerTerms ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'
        }`}
      >
        {allComplete && agreedToOwnerTerms ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Ready to submit!</p>
              <p className="text-sm text-muted-foreground">
                Your dorm will be reviewed by our team. You'll be notified once it's approved.
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                {!agreedToOwnerTerms && allComplete 
                  ? 'Please accept the Owner Agreement' 
                  : 'Some sections need attention'}
              </p>
              <p className="text-sm text-muted-foreground">
                {!agreedToOwnerTerms && allComplete 
                  ? 'You must agree to the Owner Agreement before submitting.'
                  : 'Please complete all required fields before submitting.'}
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
