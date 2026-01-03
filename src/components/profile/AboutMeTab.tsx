import { User, GraduationCap, Calendar, MapPin, DollarSign, Home, Users as UsersIcon, BookOpen } from 'lucide-react';
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

  const userInitial = userName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="max-w-[640px]">
      {/* Header with Edit button */}
      <div className="flex items-center justify-between mb-8">
        <h2 
          className="text-[32px] font-semibold text-[#222222] tracking-tight"
          style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif' }}
        >
          About me
        </h2>
        <button
          onClick={onEditClick}
          className="px-4 py-2 text-sm font-semibold text-[#222222] border border-[#222222] rounded-full hover:bg-[#F7F7F7] transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Two-column layout: Profile Card + Complete Section / Profile Data */}
      <div className="flex gap-8">
        {/* Left Column - Profile Card */}
        <div className="flex-shrink-0">
          <div className="w-[200px] bg-white rounded-3xl shadow-[0_6px_16px_rgba(0,0,0,0.12)] p-6 text-center">
            {/* Avatar */}
            <div className="w-[104px] h-[104px] mx-auto rounded-full bg-[#222222] flex items-center justify-center overflow-hidden mb-4">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-medium">{userInitial}</span>
              )}
            </div>
            {/* Name */}
            <h3 
              className="text-[26px] font-semibold text-[#222222] mb-1 leading-tight"
              style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif' }}
            >
              {userName || 'Guest'}
            </h3>
            {/* Role Label */}
            <p className="text-sm text-[#717171]">Student</p>
          </div>
        </div>

        {/* Right Column - Complete Your Profile OR Profile Data */}
        <div className="flex-1 pt-2">
          {!hasAnyProfileData ? (
            // Show "Complete your profile" section
            <div>
              <h3 
                className="text-[22px] font-semibold text-[#222222] mb-2"
                style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif' }}
              >
                Complete your profile
              </h3>
              <p className="text-base text-[#717171] mb-6 leading-relaxed">
                Your Roomy profile helps property owners and other students get to know you. Complete yours to unlock personalized dorm matches.
              </p>
              <Button
                onClick={onGetStartedClick}
                className="bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold px-6 py-3 h-auto rounded-lg text-base"
              >
                Get started
              </Button>
            </div>
          ) : (
            // Show profile summary sections
            <div className="space-y-6">
              <ProfileSection title="Personal Information" icon={<User className="w-5 h-5" />}>
                <ProfileField label="Full Name" value={profileData?.full_name} />
                <ProfileField label="Age" value={profileData?.age?.toString()} />
                <ProfileField label="Gender" value={profileData?.gender} />
                <ProfileField 
                  label="Location" 
                  value={[profileData?.governorate, profileData?.district].filter(Boolean).join(', ')} 
                />
              </ProfileSection>

              <ProfileSection title="Academic Information" icon={<GraduationCap className="w-5 h-5" />}>
                <ProfileField label="University" value={profileData?.university} />
                <ProfileField label="Major" value={profileData?.major} />
                <ProfileField 
                  label="Year of Study" 
                  value={profileData?.year_of_study ? `Year ${profileData.year_of_study}` : undefined} 
                />
              </ProfileSection>

              <ProfileSection title="Housing Preferences" icon={<Home className="w-5 h-5" />}>
                <ProfileField 
                  label="Budget" 
                  value={profileData?.budget ? `$${profileData.budget}/month` : undefined} 
                />
                <ProfileField label="Preferred Area" value={profileData?.preferred_housing_area} />
                <ProfileField label="Room Type" value={profileData?.room_type} />
              </ProfileSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ProfileSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#717171]">{icon}</span>
        <h4 className="text-base font-semibold text-[#222222]">{title}</h4>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {children}
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-sm text-[#717171]">{label}</span>
      <p className="text-[15px] text-[#222222]">
        {value || <span className="text-[#B0B0B0]">Not set</span>}
      </p>
    </div>
  );
}
