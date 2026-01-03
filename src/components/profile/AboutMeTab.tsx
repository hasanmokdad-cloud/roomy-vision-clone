import { MessageSquareText } from 'lucide-react';
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
  const userInitial = userName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="max-w-[700px]">
      {/* Header with Edit button */}
      <div className="flex items-center gap-4 mb-8">
        <h2 
          className="text-[32px] font-semibold text-[#222222] tracking-tight"
          style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif' }}
        >
          About me
        </h2>
        <button
          onClick={onEditClick}
          className="px-5 py-2 text-sm font-medium text-[#222222] border border-[#B0B0B0] rounded-full hover:border-[#222222] transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Two-column layout: Profile Card + Complete Section */}
      <div className="flex gap-10">
        {/* Left Column - Profile Card */}
        <div className="flex-shrink-0">
          <div className="w-[320px] bg-white rounded-2xl shadow-[0_6px_16px_rgba(0,0,0,0.12)] px-10 py-8 text-center">
            {/* Avatar */}
            <div className="w-[120px] h-[120px] mx-auto rounded-full bg-[#222222] flex items-center justify-center overflow-hidden mb-4">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-4xl font-semibold">{userInitial}</span>
              )}
            </div>
            {/* Name */}
            <h3 
              className="text-2xl font-semibold text-[#222222] mb-1 leading-tight truncate"
              style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif' }}
            >
              {userName || 'Guest'}
            </h3>
            {/* Role Label */}
            <p className="text-base text-[#717171]">Student</p>
          </div>
        </div>

        {/* Right Column - Complete Your Profile (always shown, no profile fields on this view) */}
        <div className="flex-1 pt-2 max-w-[300px]">
          <h3 
            className="text-[22px] font-semibold text-[#222222] mb-3"
            style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif' }}
          >
            Complete your profile
          </h3>
          <p className="text-base text-[#717171] mb-6 leading-relaxed">
            Your Roomy profile is an important part of every reservation. Complete yours to help other students get to know you.
          </p>
          <Button
            onClick={onGetStartedClick}
            className="bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold px-6 py-3 h-auto rounded-lg text-base"
          >
            Get started
          </Button>
        </div>
      </div>

      {/* Divider Line - spans full width */}
      <div className="border-t border-[#DDDDDD] mt-10 pt-8">
        {/* Reviews I've written section */}
        <div className="flex items-center gap-3">
          <MessageSquareText 
            size={20} 
            strokeWidth={1.5}
            className="text-[#484848]" 
            fill="rgba(72, 72, 72, 0.08)"
          />
          <span className="text-base font-normal text-[#484848]">
            Reviews I've written
          </span>
        </div>
      </div>
    </div>
  );
}
