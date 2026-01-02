import { User, GraduationCap, Calendar, MapPin, DollarSign, Home, Users as UsersIcon, BookOpen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ProfileData {
  profile_photo_url?: string | null;
  full_name?: string;
  age?: number;
  gender?: string;
  university?: string;
  major?: string;
  year_of_study?: number;
  budget?: number;
  preferred_housing_area?: string;
  room_type?: string;
  governorate?: string;
  district?: string;
}

interface AboutMeTabProps {
  profileData: ProfileData | null;
  userName: string;
  profilePhotoUrl: string | null;
  hasCompletedProfile: boolean;
  onEditClick: () => void;
  onGetStartedClick: () => void;
}

export function AboutMeTab({
  profileData,
  userName,
  profilePhotoUrl,
  hasCompletedProfile,
  onEditClick,
  onGetStartedClick,
}: AboutMeTabProps) {
  // Check if any profile data exists
  const hasAnyProfileData = profileData && (
    profileData.full_name ||
    profileData.university ||
    profileData.gender ||
    profileData.age ||
    profileData.major ||
    profileData.budget
  );

  return (
    <div className="space-y-8">
      {/* Header with Edit button */}
      <div className="flex items-center justify-between">
        <h2 className="text-[32px] font-bold text-[#222222] font-sans">
          About me
        </h2>
        <button
          onClick={onEditClick}
          className="px-4 py-2 text-sm font-semibold text-[#222222] border border-[#222222] rounded-full hover:bg-[#F7F7F7] transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] p-8 text-center">
        <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white shadow-lg">
          <AvatarImage src={profilePhotoUrl || undefined} alt={userName} />
          <AvatarFallback className="bg-[#222222] text-white text-4xl font-semibold">
            {userName ? userName.charAt(0).toUpperCase() : <User className="w-12 h-12" />}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-2xl font-semibold text-[#222222] mb-1">
          {userName || 'Your Name'}
        </h3>
        <p className="text-sm text-[#717171]">Student</p>
      </div>

      {/* Complete Your Profile Section OR Profile Data */}
      {!hasAnyProfileData ? (
        <div className="space-y-4">
          <h3 className="text-[22px] font-semibold text-[#222222]">
            Complete your profile
          </h3>
          <p className="text-base text-[#717171] leading-relaxed">
            Your Roomy profile helps property owners and other students get to know you. Complete yours to unlock personalized dorm matches.
          </p>
          <Button
            onClick={onGetStartedClick}
            className="bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3.5 px-6 rounded-lg text-base"
          >
            Get started
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Personal Info */}
          <ProfileSection title="Personal Information">
            <ProfileField 
              icon={<User className="w-5 h-5" />} 
              label="Full Name" 
              value={profileData?.full_name} 
            />
            <ProfileField 
              icon={<Calendar className="w-5 h-5" />} 
              label="Age" 
              value={profileData?.age?.toString()} 
            />
            <ProfileField 
              icon={<UsersIcon className="w-5 h-5" />} 
              label="Gender" 
              value={profileData?.gender} 
            />
            <ProfileField 
              icon={<MapPin className="w-5 h-5" />} 
              label="Location" 
              value={[profileData?.governorate, profileData?.district].filter(Boolean).join(', ')} 
            />
          </ProfileSection>

          {/* Academic Info */}
          <ProfileSection title="Academic Information">
            <ProfileField 
              icon={<GraduationCap className="w-5 h-5" />} 
              label="University" 
              value={profileData?.university} 
            />
            <ProfileField 
              icon={<BookOpen className="w-5 h-5" />} 
              label="Major" 
              value={profileData?.major} 
            />
            <ProfileField 
              icon={<Calendar className="w-5 h-5" />} 
              label="Year of Study" 
              value={profileData?.year_of_study ? `Year ${profileData.year_of_study}` : undefined} 
            />
          </ProfileSection>

          {/* Housing Preferences */}
          <ProfileSection title="Housing Preferences">
            <ProfileField 
              icon={<DollarSign className="w-5 h-5" />} 
              label="Budget" 
              value={profileData?.budget ? `$${profileData.budget}/month` : undefined} 
            />
            <ProfileField 
              icon={<MapPin className="w-5 h-5" />} 
              label="Preferred Area" 
              value={profileData?.preferred_housing_area} 
            />
            <ProfileField 
              icon={<Home className="w-5 h-5" />} 
              label="Room Type" 
              value={profileData?.room_type} 
            />
          </ProfileSection>
        </div>
      )}
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#DDDDDD] pb-6 last:border-b-0">
      <h4 className="text-lg font-semibold text-[#222222] mb-4">{title}</h4>
      <div className="grid grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function ProfileField({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[#717171] mt-0.5">{icon}</span>
      <div>
        <p className="text-sm text-[#717171]">{label}</p>
        <p className="text-base text-[#222222] font-medium">
          {value || <span className="text-[#717171] italic">Not set</span>}
        </p>
      </div>
    </div>
  );
}
