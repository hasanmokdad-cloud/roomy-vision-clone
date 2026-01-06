/**
 * Hook to get property-specific terminology based on property type
 * @param propertyType - 'dorm', 'apartment', or 'hybrid'
 * @returns Dynamic labels for dorm and rooms terminology
 */
export function usePropertyTerminology(propertyType: string) {
  const getDormLabel = () => {
    switch (propertyType) {
      case 'apartment':
        return 'apartment building';
      case 'hybrid':
        return 'housing';
      default:
        return 'dorm';
    }
  };

  const getDormLabelCapitalized = () => {
    switch (propertyType) {
      case 'apartment':
        return 'Apartment Building';
      case 'hybrid':
        return 'Housing';
      default:
        return 'Dorm';
    }
  };

  const getRoomLabel = (plural: boolean = false) => {
    if (propertyType === 'apartment') {
      return plural ? 'apartments' : 'apartment';
    }
    return plural ? 'rooms' : 'room';
  };

  const getRoomLabelCapitalized = (plural: boolean = false) => {
    if (propertyType === 'apartment') {
      return plural ? 'Apartments' : 'Apartment';
    }
    return plural ? 'Rooms' : 'Room';
  };

  return {
    dormLabel: getDormLabel(),
    dormLabelCap: getDormLabelCapitalized(),
    roomLabel: getRoomLabel(false),
    roomsLabel: getRoomLabel(true),
    roomLabelCap: getRoomLabelCapitalized(false),
    roomsLabelCap: getRoomLabelCapitalized(true),
  };
}
