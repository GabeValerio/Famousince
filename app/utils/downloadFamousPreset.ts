import { StayFamousText, DEFAULT_PRESET } from '@/app/components/StayFamousPreset';

export const downloadFamousPreset = async (description: string) => {
  // Load the Chalkduster font
  try {
    const font = new FontFace('Chalkduster', 'local("Chalkduster")');
    await font.load();
    document.fonts.add(font);
  } catch (error) {
    console.warn('Could not load Chalkduster font, falling back to system font');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Calculate canvas size based on the preset values
  // The preset uses percentages (left: 51 means 51%)
  const scale = 4; // For higher quality output
  const width = 200; // Base width that 51% refers to
  const height = 100; // Base height that 33% and 37% refer to
  canvas.width = width * scale;
  canvas.height = height * scale;

  // Scale everything up for higher quality
  ctx.scale(scale, scale);

  // Set background to transparent
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, width, height);

  // Configure text style
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Helper function to add distressed effect to text
  const drawDistressedText = (text: string, x: number, y: number, fontSize: number) => {
    ctx.font = `${fontSize}px Chalkduster`;
    
    // Draw the main text
    ctx.globalAlpha = 1;
    ctx.fillText(text, x, y);
    
    // Add distressed effect by drawing multiple times with slight offsets
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 3; i++) {
      const offset = 0.5;
      ctx.fillText(text, x + offset, y + offset);
      ctx.fillText(text, x - offset, y - offset);
    }
    
    // Reset alpha
    ctx.globalAlpha = 1;
  };

  // Draw top line ("FAMOUS SINCE")
  const topX = width * (DEFAULT_PRESET.topLine.left / 100);
  const topY = height * (DEFAULT_PRESET.topLine.top / 100);
  drawDistressedText(
    DEFAULT_PRESET.topLine.text,
    topX,
    topY,
    DEFAULT_PRESET.topLine.fontSize
  );

  // Draw bottom line (custom text)
  const bottomX = width * (DEFAULT_PRESET.bottomLine.left / 100);
  const bottomY = height * (60 / 100);
  drawDistressedText(
    description.toUpperCase(),
    bottomX,
    bottomY,
    DEFAULT_PRESET.bottomLine.fontSize
  );

  // Convert canvas to blob
  canvas.toBlob((blob) => {
    if (!blob) return;

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `famous_${description.toLowerCase().replace(/\s+/g, '_')}.png`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }, 'image/png');
}; 