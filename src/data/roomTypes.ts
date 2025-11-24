export const roomTypes = [
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

export const isSingleRoom = (roomType: string): boolean => {
  return roomType.toLowerCase().includes('single');
};
