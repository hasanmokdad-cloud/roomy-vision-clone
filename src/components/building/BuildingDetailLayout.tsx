import { ReactNode } from 'react';

interface BuildingDetailLayoutProps {
  building: {
    id: string;
    dorm_name?: string;
    name?: string;
    area?: string;
    location?: string;
    address?: string;
    description?: string;
    cover_image?: string;
    image_url?: string;
    gallery_images?: string[];
    amenities?: string[];
    verification_status?: string;
    monthly_price?: number;
    price?: number;
    room_types_json?: any;
    owner_id?: string;
    property_type?: string;
  };
  buildingType: 'dorm' | 'apartment' | 'hybrid';
  children: ReactNode; // Inventory section slot
}

/**
 * BuildingDetailLayout - Shared layout wrapper for all building detail pages.
 * 
 * This component provides the common structure for:
 * - Dorm building pages
 * - Apartment building pages  
 * - Hybrid building pages (combined sections)
 * 
 * The layout accepts an inventory section as children, which allows different
 * building types to render their specific room/unit options.
 * 
 * @example
 * <BuildingDetailLayout building={dorm} buildingType="dorm">
 *   <DormInventorySection rooms={rooms} />
 * </BuildingDetailLayout>
 */
export function BuildingDetailLayout({ 
  building, 
  buildingType, 
  children 
}: BuildingDetailLayoutProps) {
  // This is currently a pass-through layout scaffold
  // The actual sections are still rendered in DormDetail.tsx
  // This will be expanded in future to contain the common sections:
  // - BuildingHero
  // - BuildingMetaHeader  
  // - BuildingDescription
  // - {children} - Inventory section
  // - BuildingAmenities
  // - BuildingLocation
  // - BuildingReviews

  return (
    <div className="space-y-6" data-building-type={buildingType}>
      {children}
    </div>
  );
}

export default BuildingDetailLayout;
