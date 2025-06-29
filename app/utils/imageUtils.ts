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
): Promise<string | null> {
  try {
    console.log('Starting image generation with:', {
      modelId,
      bottomLineText: textPreset.bottomLine.text,
      containerExists: !!imageContainerRef,
      containerDisplay: imageContainerRef?.style.display
    });

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
        },
        filter: (node) => {
          // Log nodes being processed
          console.log('Processing node:', node.tagName, node.className);
          return true;
        }
      });
      console.log('Successfully generated PNG data URL:', {
        dataUrlLength: dataUrl.length,
        startsWithDataImage: dataUrl.startsWith('data:image/png')
      });

      // Convert data URL to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      console.log('Successfully converted to blob:', {
        type: blob.type,
        size: blob.size,
        validImage: blob.type.startsWith('image/')
      });

      if (blob.size === 0 || !blob.type.startsWith('image/')) {
        throw new Error('Generated image is invalid');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', blob, 'design.png');
      formData.append('uploadType', 'tshirt-design');
      formData.append('bottomLine', textPreset.bottomLine.text);
      formData.append('modelId', modelId);
      console.log('FormData created with:', {
        uploadType: 'tshirt-design',
        bottomLine: textPreset.bottomLine.text,
        modelId
      });

      // Upload to Cloudinary through our API route
      console.log('Starting upload to API...');
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Received API response:', {
        status: uploadResponse.status,
        ok: uploadResponse.ok
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('Upload failed with error:', errorData);
        throw new Error(`Upload failed: ${JSON.stringify(errorData)}`);
      }

      const result = await uploadResponse.json();
      console.log('Upload successful, received URL:', result.secure_url);
      return result.secure_url;
    } finally {
      // Restore the original display style
      imageContainerRef.style.display = originalDisplay;
    }
  } catch (error) {
    console.error('Detailed error in generateAndUploadImage:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
} 