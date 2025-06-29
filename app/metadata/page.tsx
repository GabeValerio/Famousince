'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function MetadataPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generatedImages, setGeneratedImages] = useState<{
    favicon: string;
    ogImage: string;
    twitterImage: string;
  } | null>(null);

  const generateLogoCanvas = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    // Set black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Configure text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = 'FAMOUS SINCE';
    
    // Calculate font size based on canvas width
    // Use a smaller ratio to ensure text fits
    const fontSize = Math.floor(width * 0.25);
    ctx.font = `bold ${fontSize}px Chalkduster`;

    // Measure text to ensure it fits
    let textWidth = ctx.measureText(text).width;
    
    // Adjust font size if text is too wide
    if (textWidth > width * 0.9) {
      const scaleFactor = (width * 0.9) / textWidth;
      const newFontSize = Math.floor(fontSize * scaleFactor);
      ctx.font = `bold ${newFontSize}px Chalkduster`;
    }

    // Add glow effect
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = Math.max(2, width * 0.005);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw text
    ctx.fillText(text, width / 2, height / 2);

    // Add distressed effect
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 0) { // If pixel is not black
        // Add random noise to edges
        if (Math.random() > 0.85) {
          data[i] = data[i + 1] = data[i + 2] = 0; // Make some pixels black
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);

    return canvas;
  };

  const generateImages = async () => {
    try {
      // Generate favicon (32x32)
      const faviconCanvas = generateLogoCanvas(32, 32);
      const favicon = faviconCanvas?.toDataURL('image/png');

      // Generate OG Image (1200x630)
      const ogCanvas = generateLogoCanvas(1200, 630);
      const ogImage = ogCanvas?.toDataURL('image/png');

      // Generate Twitter Image (1200x600)
      const twitterCanvas = generateLogoCanvas(1200, 600);
      const twitterImage = twitterCanvas?.toDataURL('image/png');

      if (favicon && ogImage && twitterImage) {
        setGeneratedImages({
          favicon,
          ogImage,
          twitterImage,
        });

        // Create download links
        const downloadImage = (dataUrl: string, filename: string) => {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        downloadImage(favicon, 'favicon.png');
        downloadImage(ogImage, 'og-image.png');
        downloadImage(twitterImage, 'twitter-image.png');
      }
    } catch (error) {
      console.error('Error generating images:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Metadata Image Generator
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            Generate and manage metadata images for Famous Since
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Logo Preview */}
            <div className="bg-black p-6 rounded-lg shadow border border-white/20">
              <h2 className="text-lg font-medium text-white">Logo Preview</h2>
              <div className="mt-4 aspect-[4/1] bg-black flex items-center justify-center p-4">
                <span 
                  className="text-4xl md:text-5xl font-bold text-white tracking-wider whitespace-nowrap"
                  style={{ 
                    fontFamily: 'Chalkduster',
                    textShadow: '0 0 2px rgba(255,255,255,0.5)'
                  }}
                >
                  FAMOUS SINCE
                </span>
              </div>
            </div>

            {/* Generated Images */}
            <div className="bg-black p-6 rounded-lg shadow border border-white/20">
              <h2 className="text-lg font-medium text-white">Generated Images</h2>
              <div className="mt-4 space-y-4">
                {generatedImages ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-300 mb-2">Favicon (32x32)</p>
                      <div className="relative h-8 w-8 mx-auto border border-white/20">
                        <Image
                          src={generatedImages.favicon}
                          alt="Favicon preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300 mb-2">OG Image (1200x630)</p>
                      <div className="relative aspect-[1200/630] w-full border border-white/20">
                        <Image
                          src={generatedImages.ogImage}
                          alt="OG Image preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300 mb-2">Twitter Image (1200x600)</p>
                      <div className="relative aspect-[1200/600] w-full border border-white/20">
                        <Image
                          src={generatedImages.twitterImage}
                          alt="Twitter Image preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-300">No images generated yet</p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-black p-6 rounded-lg shadow border border-white/20">
              <h2 className="text-lg font-medium text-white">Controls</h2>
              <div className="mt-4">
                <button
                  onClick={generateImages}
                  className="w-full flex justify-center py-2 px-4 border border-white/20 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                >
                  Generate Images
                </button>
                <p className="mt-2 text-xs text-gray-300 text-center">
                  Click to generate and download all metadata images
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-16 text-center text-sm text-gray-500">
        site designed and developed by <span className="font-medium">Gabriel Valerio</span>
      </footer>
    </div>
  );
} 