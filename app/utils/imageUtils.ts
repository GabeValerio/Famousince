import * as htmlToImage from 'html-to-image';

interface TextPosition {
  text: string;
  fontSize: number;
  top: number;
  left: number;
}

interface StayFamousText {
  topLine: TextPosition;
  bottomLine: TextPosition;
}

export async function generateAndUploadImage(
  imageContainerRef: HTMLDivElement,
  textPreset: StayFamousText,
  modelId: string
): Promise<string | undefined> {
  try {
    // Temporarily make the container visible for image generation
    const originalDisplay = imageContainerRef.style.display;
    imageContainerRef.style.display = 'block';

    // Wait for any potential image loading and ensure the image is loaded
    const imageElement = imageContainerRef.querySelector('img');
    if (imageElement) {
      if (!imageElement.complete) {
        await new Promise((resolve) => {
          imageElement.onload = resolve;
        });
      }
      // Additional wait to ensure styles are applied
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      // Generate the image
      const dataUrl = await htmlToImage.toPng(imageContainerRef, {
        quality: 1.0,
        pixelRatio: 2,
        skipAutoScale: true,
        cacheBust: true,
        style: {
          transform: 'none'
        }
      });

      // Convert data URL to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      if (blob.size === 0 || !blob.type.startsWith('image/')) {
        throw new Error('Generated image is invalid');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', blob, 'design.png');
      formData.append('uploadType', 'tshirt-design');
      formData.append('bottomLine', textPreset.bottomLine.text);
      formData.append('modelId', modelId);

      // Upload to Cloudinary through our API route
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`Upload failed: ${JSON.stringify(errorData)}`);
      }

      const result = await uploadResponse.json();
      return result.secure_url;
    } finally {
      // Restore the original display style
      imageContainerRef.style.display = originalDisplay;
    }
  } catch (error) {
    console.error('Error in generateAndUploadImage:', error instanceof Error ? error.message : 'Unknown error');
    return undefined;
  }
} 