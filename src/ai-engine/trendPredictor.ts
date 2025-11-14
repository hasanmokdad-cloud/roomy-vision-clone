// Tiny linear-regression utility to forecast future demand.
export function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return { m: 0, b: points[0]?.y ?? 0 };

  const sumX = points.reduce((a, p) => a + p.x, 0);
  const sumY = points.reduce((a, p) => a + p.y, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumXX = points.reduce((a, p) => a + p.x * p.x, 0);

  const m = (n * sumXY - sumX * sumY) / Math.max(n * sumXX - sumX * sumX, 1e-6);
  const b = sumY / n - (m * sumX) / n;
  return { m, b };
}

export function forecast(points: { x: number; y: number }[],steps = 7) {
  const { m, b } = linearRegression(points);
  const lastX = points[points.length - 1]?.x ?? 0;
  return Array.from({ length: steps }, (_, i) => {
    const x = lastX + i + 1;
    return { x, y: Math.max(0, Math.round(m * x + b)) };
  });
}
