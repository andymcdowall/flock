export function desaturate(r: number, g: number, b: number, satiation: number): string {
  const gray = r * 0.299 + g * 0.587 + b * 0.114;
  const t = satiation;
  return `rgb(${Math.round(r*t + gray*(1-t))},${Math.round(g*t + gray*(1-t))},${Math.round(b*t + gray*(1-t))})`;
}
