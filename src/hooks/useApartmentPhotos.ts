import { useMemo } from 'react';
import type { ApartmentPhoto, PhotoSection, SpaceType, ApartmentDetailData } from '@/types/apartmentDetail';
import { SPACE_TYPE_LABELS } from '@/types/apartmentDetail';

interface UseApartmentPhotosResult {
  allPhotos: ApartmentPhoto[];
  coverPhoto?: ApartmentPhoto;
  collagePhotos: ApartmentPhoto[];
  sections: PhotoSection[];
  spaceTypes: SpaceType[];
}

export function useApartmentPhotos(apartment: ApartmentDetailData | null): UseApartmentPhotosResult {
  return useMemo(() => {
    if (!apartment) {
      return {
        allPhotos: [],
        coverPhoto: undefined,
        collagePhotos: [],
        sections: [],
        spaceTypes: [],
      };
    }

    // Combine categorized photos with legacy images array
    let allPhotos: ApartmentPhoto[] = [...apartment.photos];
    
    // If no categorized photos, create from legacy images
    if (allPhotos.length === 0 && apartment.images.length > 0) {
      allPhotos = apartment.images.map((url, idx) => ({
        id: `legacy-${idx}`,
        apartmentId: apartment.id,
        url,
        spaceType: 'other' as SpaceType,
        sortOrder: idx,
        isCover: idx === 0,
      }));
    }

    // Find cover photo
    const coverPhoto = allPhotos.find(p => p.isCover) || allPhotos[0];

    // Get first 5 photos for collage
    const collagePhotos = allPhotos.slice(0, 5);

    // Group photos by space type + instance
    const groupedPhotos = new Map<string, ApartmentPhoto[]>();
    
    allPhotos.forEach(photo => {
      const key = photo.spaceInstance 
        ? `${photo.spaceType}:${photo.spaceInstance}`
        : photo.spaceType;
      
      if (!groupedPhotos.has(key)) {
        groupedPhotos.set(key, []);
      }
      groupedPhotos.get(key)!.push(photo);
    });

    // Create sections
    const sections: PhotoSection[] = [];
    const spaceTypesSet = new Set<SpaceType>();

    // Define sort order for space types
    const spaceOrder: SpaceType[] = [
      'living_room', 'bedroom', 'kitchen', 'bathroom', 
      'balcony', 'dining', 'workspace', 'entrance', 'exterior', 'other'
    ];

    // Sort groups by space type order, then by instance
    const sortedKeys = Array.from(groupedPhotos.keys()).sort((a, b) => {
      const [typeA, instanceA] = a.split(':');
      const [typeB, instanceB] = b.split(':');
      
      const orderA = spaceOrder.indexOf(typeA as SpaceType);
      const orderB = spaceOrder.indexOf(typeB as SpaceType);
      
      if (orderA !== orderB) return orderA - orderB;
      if (instanceA && instanceB) return instanceA.localeCompare(instanceB);
      return 0;
    });

    sortedKeys.forEach(key => {
      const photos = groupedPhotos.get(key)!;
      const [spaceType, spaceInstance] = key.split(':') as [SpaceType, string | undefined];
      
      spaceTypesSet.add(spaceType);

      const label = spaceInstance 
        ? `${SPACE_TYPE_LABELS[spaceType]} (${spaceInstance})`
        : SPACE_TYPE_LABELS[spaceType];

      sections.push({
        spaceType,
        spaceInstance,
        label,
        photos: photos.sort((a, b) => a.sortOrder - b.sortOrder),
      });
    });

    const spaceTypes = spaceOrder.filter(t => spaceTypesSet.has(t));

    return {
      allPhotos,
      coverPhoto,
      collagePhotos,
      sections,
      spaceTypes,
    };
  }, [apartment]);
}
