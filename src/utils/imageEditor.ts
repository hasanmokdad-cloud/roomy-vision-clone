export interface FilterPreset {
  name: string;
  filter: string;
  preview?: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  { name: 'None', filter: 'none' },
  { name: 'B&W', filter: 'grayscale(100%)' },
  { name: 'Sepia', filter: 'sepia(100%)' },
  { name: 'Vibrant', filter: 'saturate(150%) contrast(110%)' },
  { name: 'Vintage', filter: 'sepia(40%) contrast(90%)' },
  { name: 'Cool', filter: 'hue-rotate(180deg) saturate(120%)' },
];

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  filter: string;
}

export const defaultAdjustments: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  filter: 'none',
};

export function applyAdjustmentsToCanvas(
  sourceCanvas: HTMLCanvasElement,
  adjustments: ImageAdjustments,
  crop?: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Set canvas size based on crop or rotation
  const sourceWidth = crop?.width || sourceCanvas.width;
  const sourceHeight = crop?.height || sourceCanvas.height;
  
  if (adjustments.rotation === 90 || adjustments.rotation === 270) {
    canvas.width = sourceHeight;
    canvas.height = sourceWidth;
  } else {
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
  }

  // Apply transformations
  ctx.save();
  
  // Center point for rotation
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  ctx.translate(centerX, centerY);
  
  // Rotation
  if (adjustments.rotation) {
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
  }
  
  // Flip
  ctx.scale(
    adjustments.flipHorizontal ? -1 : 1,
    adjustments.flipVertical ? -1 : 1
  );
  
  // Apply filters
  const filters = [];
  if (adjustments.brightness !== 100) {
    filters.push(`brightness(${adjustments.brightness}%)`);
  }
  if (adjustments.contrast !== 100) {
    filters.push(`contrast(${adjustments.contrast}%)`);
  }
  if (adjustments.saturation !== 100) {
    filters.push(`saturate(${adjustments.saturation}%)`);
  }
  if (adjustments.filter !== 'none') {
    const preset = FILTER_PRESETS.find(f => f.name === adjustments.filter);
    if (preset) filters.push(preset.filter);
  }
  
  ctx.filter = filters.join(' ');
  
  // Draw image
  if (crop) {
    ctx.drawImage(
      sourceCanvas,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      -sourceWidth / 2,
      -sourceHeight / 2,
      sourceWidth,
      sourceHeight
    );
  } else {
    ctx.drawImage(
      sourceCanvas,
      -sourceWidth / 2,
      -sourceHeight / 2,
      sourceWidth,
      sourceHeight
    );
  }
  
  ctx.restore();
  
  return canvas;
}

export async function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  quality: number = 0.92
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        resolve(file);
      },
      'image/jpeg',
      quality
    );
  });
}

export async function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
