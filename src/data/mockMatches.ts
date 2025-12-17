export const mockMatches = [
  {
    dorm: 'Sunny Side Dorms',
    room: 'Single Room',
    matchPercentage: 94,
    // distance: '5 min walk', // TODO: Re-enable after distance algorithm implementation
    price: 450,
    capacity: 1,
    reasons: [
      'Perfect budget match - within your $500 range with room to spare',
      'Located in your preferred area near LAU Byblos campus',
      'Private room matches your preference for personal space and quiet study time'
    ],
    amenities: ['wifi', 'ac', 'study', 'security', 'furnished', 'laundry'],
    dormId: 'dorm-1',
    roomId: 'r1-1'
  },
  {
    dorm: 'Campus View Homes',
    room: 'Studio Apartment',
    matchPercentage: 87,
    // distance: '10 min walk', // TODO: Re-enable after distance algorithm implementation
    price: 650,
    capacity: 1,
    reasons: [
      'Full kitchen facilities perfect for your cooking preferences',
      'Located near AUB campus area',
      'Studio layout provides the independence you mentioned in your profile'
    ],
    amenities: ['wifi', 'ac', 'kitchen', 'furnished', 'balcony', 'parking'],
    dormId: 'dorm-3',
    roomId: 'r3-2'
  },
  {
    dorm: 'The Urban Nest',
    room: 'Double Room',
    matchPercentage: 79,
    // distance: '15 min walk', // TODO: Re-enable after distance algorithm implementation
    price: 350,
    capacity: 2,
    reasons: [
      'Most affordable option that still meets quality standards',
      'Shared room provides built-in social connection for international students',
      'Accessible location for multiple universities'
    ],
    amenities: ['wifi', 'ac', 'laundry', 'study', 'security'],
    dormId: 'dorm-2',
    roomId: 'r2-2'
  },
  {
    dorm: 'Byblos Heights',
    room: 'Shared Room for 4',
    matchPercentage: 68,
    // distance: '8 min drive', // TODO: Re-enable after distance algorithm implementation
    price: 180,
    capacity: 4,
    reasons: [
      'Budget-friendly option for cost-conscious students',
      'Large shared space encourages community and networking',
      'Good backup option if other preferences unavailable'
    ],
    amenities: ['wifi', 'study', 'security'],
    dormId: 'dorm-4',
    roomId: 'r4-3'
  }
];
