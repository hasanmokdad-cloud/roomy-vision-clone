// Unified universities data - single source of truth for all university-related data

export interface UniversitySubOption {
  id: string;
  name: string;
  shortName: string;
  area?: string;
  subArea?: string;
}

export interface University {
  id: string;
  name: string;
  shortName: string;
  primaryLocation: 'beirut' | 'byblos' | 'keserwan';
  area?: string;
  subArea?: string;
  hasSubOptions?: boolean;
  subOptions?: UniversitySubOption[];
}

export const universities: University[] = [
  // BEIRUT UNIVERSITIES
  {
    id: 'aub',
    name: 'American University of Beirut (AUB)',
    shortName: 'AUB',
    primaryLocation: 'beirut',
    area: 'Hamra',
    subArea: 'Bliss Street',
  },
  {
    id: 'lau',
    name: 'Lebanese American University (LAU)',
    shortName: 'LAU',
    primaryLocation: 'beirut',
    hasSubOptions: true,
    subOptions: [
      { id: 'lau-beirut', name: 'Lebanese American University (LAU) – Beirut', shortName: 'LAU Beirut', area: 'Hamra' },
      { id: 'lau-byblos', name: 'Lebanese American University (LAU) – Byblos', shortName: 'LAU Byblos', area: 'Blat' },
    ],
  },
  {
    id: 'usj',
    name: 'Université Saint-Joseph de Beyrouth (USJ)',
    shortName: 'USJ',
    primaryLocation: 'beirut',
    area: 'Achrafieh',
    subArea: 'Damascus Street',
  },
  {
    id: 'bau',
    name: 'Beirut Arab University (BAU) - Beirut',
    shortName: 'BAU',
    primaryLocation: 'beirut',
    area: 'Tariq El Jdideh',
  },
  {
    id: 'lu',
    name: 'Université Libanaise (LU)',
    shortName: 'LU',
    primaryLocation: 'beirut',
    hasSubOptions: true,
    subOptions: [
      { id: 'lu-hadath', name: 'Université Libanaise (LU) – Hadath', shortName: 'LU Hadath', area: 'Hadath' },
      { id: 'lu-forn', name: 'Université Libanaise (LU) – Forn El Chebbak', shortName: 'LU Forn El Chebbak', area: 'Forn El Chebbak' },
      { id: 'lu-borj', name: 'Université Libanaise (LU) – Borj El Brajneh', shortName: 'LU Borj El Brajneh', area: 'Borj El Brajneh' },
      { id: 'lu-dekwaneh', name: 'Université Libanaise (LU) – Dekwaneh', shortName: 'LU Dekwaneh', area: 'Dekwaneh' },
      { id: 'lu-fanar', name: 'Université Libanaise (LU) – Fanar', shortName: 'LU Fanar', area: 'Fanar' },
    ],
  },
  {
    id: 'liu',
    name: 'Lebanese International University (LIU)',
    shortName: 'LIU',
    primaryLocation: 'beirut',
    area: 'Msaytbeh',
  },
  {
    id: 'haigazian',
    name: 'Haigazian University',
    shortName: 'Haigazian',
    primaryLocation: 'beirut',
    area: 'Ain El Mraisseh',
    subArea: 'Clemenceau Street',
  },
  {
    id: 'aust',
    name: 'American University of Science and Technology (AUST)',
    shortName: 'AUST',
    primaryLocation: 'beirut',
    area: 'Achrafieh',
    subArea: 'Alfred Naccash Street',
  },
  {
    id: 'sagesse',
    name: 'Université la Sagesse',
    shortName: 'La Sagesse',
    primaryLocation: 'beirut',
    area: 'Forn El Chebbak',
  },

  // BYBLOS UNIVERSITIES
  {
    id: 'lau-byblos-standalone',
    name: 'Lebanese American University (LAU) – Byblos',
    shortName: 'LAU Byblos',
    primaryLocation: 'byblos',
    area: 'Blat',
  },
  {
    id: 'aut',
    name: 'American University of Technology (AUT) - Halat',
    shortName: 'AUT',
    primaryLocation: 'byblos',
    area: 'Halat',
  },

  // KESERWAN UNIVERSITIES
  {
    id: 'ndu',
    name: 'Notre Dame University (NDU) – Louaize',
    shortName: 'NDU',
    primaryLocation: 'keserwan',
    area: 'Zouk Mosbeh',
  },
  {
    id: 'usek',
    name: 'Université Saint-Esprit de Kaslik (USEK)',
    shortName: 'USEK',
    primaryLocation: 'keserwan',
    area: 'Jounieh',
    subArea: 'Kaslik',
  },
];

// Get universities filtered by primary location (for nearby universities step)
export function getUniversitiesByLocation(location: string): University[] {
  return universities.filter(u => {
    if (u.primaryLocation !== location) return false;
    // Exclude parent entries that only have sub-options
    if (u.hasSubOptions) return false;
    return true;
  });
}

// Get universities with sub-options (LAU, LU) for a given location
export function getUniversitiesWithSubOptionsForLocation(location: string): University[] {
  return universities.filter(u => u.hasSubOptions && u.primaryLocation === location);
}

// Get all university names (flat list for backward compatibility)
export function getAllUniversityNames(): string[] {
  const names: string[] = [];
  universities.forEach(u => {
    if (u.hasSubOptions && u.subOptions) {
      u.subOptions.forEach(sub => names.push(sub.name));
    } else {
      names.push(u.name);
    }
  });
  return names;
}

// Get flat list for dropdowns (student profile, onboarding)
export function getFlatUniversityList(): string[] {
  return getAllUniversityNames();
}

// Get all selectable options for a location (individual unis + sub-options)
export function getSelectableUniversitiesForLocation(location: string): Array<{ id: string; name: string; shortName: string; parentId?: string }> {
  const result: Array<{ id: string; name: string; shortName: string; parentId?: string }> = [];
  
  universities.forEach(u => {
    if (u.primaryLocation !== location) return;
    
    if (u.hasSubOptions && u.subOptions) {
      // Add sub-options with parent reference
      u.subOptions.forEach(sub => {
        result.push({
          id: sub.id,
          name: sub.name,
          shortName: sub.shortName,
          parentId: u.id,
        });
      });
    } else {
      result.push({
        id: u.id,
        name: u.name,
        shortName: u.shortName,
      });
    }
  });
  
  return result;
}

// Get university by ID
export function getUniversityById(id: string): University | UniversitySubOption | undefined {
  for (const u of universities) {
    if (u.id === id) return u;
    if (u.subOptions) {
      const sub = u.subOptions.find(s => s.id === id);
      if (sub) return sub;
    }
  }
  return undefined;
}

// Get short name for display
export function getUniversityShortName(id: string): string {
  const uni = getUniversityById(id);
  return uni?.shortName || id;
}
