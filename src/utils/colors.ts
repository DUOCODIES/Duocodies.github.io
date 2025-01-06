export function generatePastelColor(): string {
  // Generate a pastel color by using high lightness and medium saturation
  const hue = Math.floor(Math.random() * 360); // Random hue
  const saturation = 50 + Math.random() * 20; // 50-70% saturation
  const lightness = 75 + Math.random() * 10; // 75-85% lightness
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
} 