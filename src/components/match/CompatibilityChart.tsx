import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

interface CompatibilityChartProps {
  profileA: any;
  profileB: any;
}

export function CompatibilityChart({ profileA, profileB }: CompatibilityChartProps) {
  // Calculate individual dimension scores
  const budgetScore = calculateBudgetScore(profileA.budget, profileB.budget);
  const locationScore = calculateLocationScore(profileA.favorite_areas, profileB.favorite_areas);
  const universityScore = profileA.preferred_university === profileB.preferred_university ? 100 : 30;
  const roomTypeScore = calculateRoomTypeScore(profileA.preferred_room_types, profileB.preferred_room_types);
  const amenitiesScore = calculateAmenitiesScore(profileA.preferred_amenities, profileB.preferred_amenities);

  const data = [
    { subject: 'Budget', score: budgetScore, fullMark: 100 },
    { subject: 'Location', score: locationScore, fullMark: 100 },
    { subject: 'University', score: universityScore, fullMark: 100 },
    { subject: 'Room Type', score: roomTypeScore, fullMark: 100 },
    { subject: 'Amenities', score: amenitiesScore, fullMark: 100 },
  ];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Radar
            name="Compatibility"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.subject} className="flex justify-between items-center text-sm">
            <span className="text-foreground/60">{item.subject}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <span className="font-semibold min-w-[3ch] text-right">{Math.round(item.score)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function calculateBudgetScore(budgetA: number, budgetB: number): number {
  if (!budgetA || !budgetB) return 0;
  const diff = Math.abs(budgetA - budgetB);
  const avg = (budgetA + budgetB) / 2;
  const percentDiff = diff / avg;
  
  if (percentDiff < 0.1) return 100;
  if (percentDiff < 0.2) return 85;
  if (percentDiff < 0.3) return 70;
  if (percentDiff < 0.5) return 50;
  return 30;
}

function calculateLocationScore(areasA: string[], areasB: string[]): number {
  if (!areasA?.length || !areasB?.length) return 50;
  const overlap = areasA.filter(a => areasB.includes(a)).length;
  const total = Math.max(areasA.length, areasB.length);
  return Math.round((overlap / total) * 100);
}

function calculateRoomTypeScore(typesA: string[], typesB: string[]): number {
  if (!typesA?.length || !typesB?.length) return 50;
  const overlap = typesA.filter(t => typesB.includes(t)).length;
  return overlap > 0 ? 100 : 30;
}

function calculateAmenitiesScore(amenitiesA: string[], amenitiesB: string[]): number {
  if (!amenitiesA?.length || !amenitiesB?.length) return 50;
  const overlap = amenitiesA.filter(a => amenitiesB.includes(a)).length;
  const total = Math.max(amenitiesA.length, amenitiesB.length);
  return Math.round((overlap / total) * 100);
}
