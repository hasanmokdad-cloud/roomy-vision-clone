import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface OccupancyChartProps {
  available: number;
  reserved: number;
  occupied: number;
  size?: 'sm' | 'md' | 'lg';
}

const COLORS = {
  available: 'hsl(var(--chart-2))',
  reserved: 'hsl(var(--chart-4))',
  occupied: 'hsl(var(--chart-1))',
};

export function OccupancyChart({ available, reserved, occupied, size = 'md' }: OccupancyChartProps) {
  const total = available + reserved + occupied;
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No beds configured
      </div>
    );
  }

  const data = [
    { name: 'Available', value: available, color: COLORS.available },
    { name: 'Reserved', value: reserved, color: COLORS.reserved },
    { name: 'Occupied', value: occupied, color: COLORS.occupied },
  ].filter(item => item.value > 0);

  const dimensions = {
    sm: { height: 120, innerRadius: 25, outerRadius: 40 },
    md: { height: 160, innerRadius: 35, outerRadius: 55 },
    lg: { height: 200, innerRadius: 45, outerRadius: 70 },
  };

  const { height, innerRadius, outerRadius } = dimensions[size];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value} beds (${Math.round((value / total) * 100)}%)`,
            name,
          ]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
