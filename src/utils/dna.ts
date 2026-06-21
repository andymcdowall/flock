export function encodeByte(value: number, min: number, max: number): number {
  return Math.round(Math.max(0, Math.min(255, ((value - min) / (max - min)) * 255)));
}

export function decodeByte(byte: number, min: number, max: number): number {
  return min + (byte / 255) * (max - min);
}

export function toHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}
