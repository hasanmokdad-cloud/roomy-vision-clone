export const roomTypes = [
  "Any",
  "Single",
  "Double",
  "Triple",
  "Apartment",
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

export const isSingleRoom = (roomType: string | undefined | null): boolean => {
  if (!roomType || roomType === 'Any') return false;
  return roomType.toLowerCase().includes('single');
};
