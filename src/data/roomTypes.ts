// Simplified room types for students - for search/filtering
export const studentRoomTypes = [
  "Any",
  "Any shared",
  "Single",
  "Double",
  "Triple",
  "Quadruple",
  "Suite",
  "Apartment",
  "Studio"
];

// Full list of room types for owners - includes base types and variations
// Note: "Apartment" is excluded as apartments are property types that contain rooms
export const ownerRoomTypes = [
  "Single",
  "Double",
  "Triple",
  "Quadruple",
  "Suite",
  "Studio",
  "Junior Suite",
  "Royal Suite",
  "Standard Single",
  "High Standard Single",
  "Standard Double",
  "High Standard Double",
  "Small Single",
  "Medium Single",
  "Large Single",
  "Small Double",
  "Medium Double",
  "Large Double",
  "Large Quadruple"
];

// Legacy export for backward compatibility
export const roomTypes = studentRoomTypes;

// Shared room types (capacity >= 2) - excludes single rooms
export const sharedRoomTypes = ['double', 'triple', 'quadruple', 'suite', 'apartment', 'studio'];

// Check if a room type is a shared room (capacity >= 2)
export const isSharedRoomType = (roomType: string | undefined | null): boolean => {
  if (!roomType) return false;
  const normalizedRoom = roomType.toLowerCase();
  // Single rooms are NOT shared
  if (normalizedRoom.includes('single')) return false;
  // Check if matches any shared type
  return sharedRoomTypes.some(type => normalizedRoom.includes(type));
};

// Helper function for substring matching - used in filtering
export const matchesRoomTypeFilter = (roomType: string | undefined | null, filterType: string): boolean => {
  if (!filterType || filterType === 'Any') return true;
  if (filterType === 'Any shared') return isSharedRoomType(roomType);
  if (!roomType) return false;
  
  const normalizedRoom = roomType.toLowerCase();
  const normalizedFilter = filterType.toLowerCase();
  
  return normalizedRoom.includes(normalizedFilter);
};

// Check if a room type is a single room (for roommate toggle logic)
export const isSingleRoom = (roomType: string | undefined | null): boolean => {
  if (!roomType || roomType === 'Any' || roomType === 'Any shared') return false;
  return roomType.toLowerCase().includes('single');
};
