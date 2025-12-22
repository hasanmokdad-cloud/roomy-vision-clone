// Simplified room types for students - for search/filtering
export const studentRoomTypes = [
  "Any",
  "Single",
  "Double",
  "Triple",
  "Quadruple",
  "Suite",
  "Apartment",
  "Studio"
];

// Full list of room types for owners - includes base types and variations
export const ownerRoomTypes = [
  "Single",
  "Double",
  "Triple",
  "Quadruple",
  "Apartment",
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

// Helper function for substring matching - used in filtering
export const matchesRoomTypeFilter = (roomType: string | undefined | null, filterType: string): boolean => {
  if (!filterType || filterType === 'Any') return true;
  if (!roomType) return false;
  
  const normalizedRoom = roomType.toLowerCase();
  const normalizedFilter = filterType.toLowerCase();
  
  return normalizedRoom.includes(normalizedFilter);
};

// Check if a room type is a single room (for roommate toggle logic)
export const isSingleRoom = (roomType: string | undefined | null): boolean => {
  if (!roomType || roomType === 'Any') return false;
  return roomType.toLowerCase().includes('single');
};
