// Centralized location data for buildings/listings (NOT for student residential areas/hometown)
// This is used by: LocationStep, AirbnbFiltersModal, FiltersPanel, LocationPreferencesStep

export const cities = [
  { value: 'beirut', label: 'Beirut' },
  { value: 'byblos', label: 'Byblos' },
];

export const areasByCity: Record<string, string[]> = {
  beirut: [
    'Hamra',
    'Kraytem',
    'Manara',
    'Ain El Mraisseh',
    'Achrafieh',
    'Badaro',
    "Ras Al Naba'a",
    'Sanayeh',
    'Ras Beirut',
    'Ain El Remmaneh',
    'Gemmayze',
    'Mar Mikhael',
    'Borj Hammoud',
    'Hadath',
    'Sin El Fil',
    'Dekwaneh',
    'Jdeideh',
    'Hazmieh',
    'Forn El Chebbak',
    'Tariq El Jdideh',
    'Fanar',
    'Borj El Brajneh',
    'Msaytbeh',
  ],
  byblos: [
    'Blat',
    'Nahr Ibrahim',
    'Halat',
    'Jeddayel',
    'Mastita',
    'Fidar',
    'Habboub',
  ],
};

// Sub-areas for specific areas
export const subAreasByArea: Record<string, string[]> = {
  'Achrafieh': ['Damascus Street', 'Geitawi Street', 'Sodeco Square', 'Alfred Naccash Street'],
  'Ain El Mraisseh': ['Clemenceau Street'],
  'Hamra': ['Bliss Street'],
};

export function hasSubAreas(area: string): boolean {
  return area in subAreasByArea;
}

export function getSubAreas(area: string): string[] {
  return subAreasByArea[area] || [];
}

export function generateAddress(city: string, area: string, subArea?: string): string {
  const cityLabel = cities.find(c => c.value === city)?.label || city;
  if (subArea) {
    return `${subArea}, ${area}, ${cityLabel}`;
  }
  if (area) {
    return `${area}, ${cityLabel}`;
  }
  return cityLabel;
}
