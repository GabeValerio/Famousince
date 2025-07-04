"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Loader2 } from "lucide-react"
import ModelSelector, { Model, MODELS } from "@/app/components/ModelSelector"
import StayFamousPreset, { DEFAULT_PRESET, StayFamousText } from "@/app/components/StayFamousPreset"
import Image from "next/image"
import styled from "styled-components"
import { useCart } from "@/lib/CartContext"
import { useRouter } from "next/navigation"
import React from "react"
import { createProductWithImage, checkExistingProduct } from "@/app/utils/productUtils"
import { generateAndUploadImage } from "@/app/utils/imageUtils"

const CustomizationContainer = styled.div`
  display: flex;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const PreviewSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const CustomizationSection = styled.div`
  flex: 1;
  max-width: 400px;
`

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  aspect-ratio: 4/5;
  margin-bottom: 24px;
  height: auto;
`

const TextOverlay = styled.div<{ 
  $position: { 
    top: number; 
    left: number; 
    fontSize: number;
  }, 
  $verticalOffset: number, 
  $isMobile: boolean,
  $allowWrap?: boolean,
  $debug?: boolean
}>`
  position: absolute;
  top: ${props => {
    const baseTop = props.$position.top + props.$verticalOffset;
    // Reduced wrapAdjustment from 2 to 0.5 to bring wrapped text closer to FAMOUS SINCE
    const wrapAdjustment = props.$allowWrap ? 0.5 : 0;
    return props.$isMobile 
      ? `${(baseTop + wrapAdjustment) * 1.00}%` 
      : `${baseTop + wrapAdjustment}%`;
  }};
  left: ${props => props.$position.left}%;
  transform: translate(-50%, -50%);
  z-index: 10;
  text-align: center;
  color: white;
  font-size: ${props => {
    const fontSize = props.$position.fontSize;
    return props.$isMobile ? `${fontSize * 0.6}px` : `${fontSize}px`;
  }};
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  font-family: 'Chalkduster', cursive;
  white-space: ${props => props.$allowWrap ? 'pre-wrap' : 'nowrap'};
  max-width: ${props => props.$allowWrap ? '171px' : 'none'};
  line-height: 1.3;
  ${props => props.$debug && `
    &::after {
      content: " [" attr(data-width) "px @ " attr(data-font-size) "px]";
      font-size: 12px;
      font-family: monospace;
      color: yellow;
      text-shadow: none;
      margin-left: 8px;
    }
  `}
`

const ProductOptions = styled.div`
  margin-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 16px;
  space-y: 16px;
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 14px;
  margin-top: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  width: 100%;
`;

const SIZES = ["S", "M", "L", "XL", "2XL"] as const;

interface SizeButtonProps {
  size: string;
  isSelected: boolean;
  onSelect: (size: string) => void;
}

interface ColorButtonProps {
  color: string;
  isSelected: boolean;
  onSelect: (color: string) => void;
}

const SizeButton = React.memo(({ size, isSelected, onSelect }: SizeButtonProps) => (
  <button
    type="button"
    className={`
      px-2 py-1 text-xs rounded-md border border-white/20
      transition-colors duration-100
      ${isSelected 
        ? 'bg-white text-black' 
        : 'bg-black/40 text-white hover:bg-white/10'
      }
    `}
    onClick={() => onSelect(size)}
  >
    {size}
  </button>
));

SizeButton.displayName = 'SizeButton';

const ColorButton = React.memo(({ color, isSelected, onSelect }: ColorButtonProps) => (
  <button
    type="button"
    className={`
      px-2 py-1 text-xs rounded-md border border-white/20
      transition-colors duration-100
      ${isSelected 
        ? 'bg-white text-black' 
        : 'bg-black/40 text-white hover:bg-white/10'
      }
    `}
    onClick={() => onSelect(color)}
  >
    {color}
  </button>
));

ColorButton.displayName = 'ColorButton';

interface LoadingState {
  isLoading: boolean;
  step: 'idle' | 'generating_image' | 'checking_product' | 'creating_product' | 'adding_to_cart' | 'redirecting';
  error: string | null;
}

export default function StayFamousPage({ params }: { params: { description: string } }) {
  // Convert underscores back to spaces and decode URI component
  const description = decodeURIComponent(params.description).replace(/_+/g, ' ');
  
  return (
    <StayFamousContent description={description} />
  );
}

function StayFamousContent({ description }: { description: string }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [selectedModel, setSelectedModel] = useState<Model>(MODELS[0])
  const [customLine, setCustomLine] = useState("")
  const [originalDescription, setOriginalDescription] = useState(description)
  const [textPreset, setTextPreset] = useState<StayFamousText>(DEFAULT_PRESET)
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedBy, setExpandedBy] = useState<'cart' | 'buy' | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    step: 'idle',
    error: null
  });
  const imageContainerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [topFontSize, setTopFontSize] = useState(26);
  const [bottomFontSize, setBottomFontSize] = useState(22);
  const [shouldWrapBottom, setShouldWrapBottom] = useState(false);
  const [formattedBottomText, setFormattedBottomText] = useState(description);

  useEffect(() => {
    setCustomLine(description);
    setOriginalDescription(description);
    setTextPreset({
      ...DEFAULT_PRESET,
      bottomLine: {
        ...DEFAULT_PRESET.bottomLine,
        text: description,
      },
    });
  }, [description]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTextChange = useCallback((newText: string) => {
    const upperText = newText.toUpperCase();
    setCustomLine(upperText);
    setOriginalDescription(newText);
    setTextPreset(prev => ({
      ...prev,
      bottomLine: {
        ...prev.bottomLine,
        text: upperText,
      },
    }));
  }, []);

  // Update text preset with custom font sizes
  const customTextPreset = useMemo(() => ({
    ...textPreset,
    topLine: {
      ...textPreset.topLine,
      fontSize: topFontSize
    },
    bottomLine: {
      ...textPreset.bottomLine,
      fontSize: bottomFontSize,
      text: formattedBottomText
    }
  }), [textPreset, topFontSize, bottomFontSize, formattedBottomText]);

  const getLoadingMessage = (step: LoadingState['step']) => {
    switch (step) {
      case 'generating_image':
        return 'Generating your custom design...';
      case 'checking_product':
        return 'Checking product details...';
      case 'creating_product':
        return 'Creating your custom product...';
      case 'adding_to_cart':
        return 'Adding to cart...';
      case 'redirecting':
        return 'Taking you to checkout...';
      default:
        return 'Processing...';
    }
  };

  const createCartItem = useCallback(async () => {
    if (!selectedSize || !selectedColor) {
      setLoadingState(prev => ({ ...prev, error: "Please select both size and color" }));
      return null;
    }

    try {
      setLoadingState(prev => ({ ...prev, step: 'generating_image', error: null }));
      
      // Generate the customized image
      const customImageUrl = await generateAndUploadImage(
        imageContainerRef.current!,
        customTextPreset,
        selectedModel.id
      );

      if (!customImageUrl) {
        throw new Error('Failed to generate customized image');
      }

      return {
        id: `custom-${selectedModel.id}-${selectedSize}-${selectedColor}-${encodeURIComponent(customTextPreset.bottomLine.text)}`,
        product_id: 'custom',
        variant_id: `${selectedSize}-${selectedColor}`,
        name: `Famous Since ${customTextPreset.bottomLine.text} T-Shirt`,
        description: customTextPreset.bottomLine.text,
        price: 38.00,
        quantity: quantity,
        image: customImageUrl,
        size: selectedSize,
        color: selectedColor,
        customization: {
          topLine: customTextPreset.topLine.text,
          bottomLine: customTextPreset.bottomLine.text,
        }
      }
    } catch (error) {
      console.error('Error creating cart item:', error);
      setLoadingState(prev => ({
        ...prev,
        error: 'Failed to generate customized image. Please try again.'
      }));
      return null;
    }
  }, [selectedSize, selectedColor, selectedModel, quantity, customTextPreset, imageContainerRef]);

  const handleAddToCart = useCallback(async () => {
    setLoadingState({ isLoading: true, step: 'generating_image', error: null });
    
    try {
      const cartItem = await createCartItem();
      if (cartItem) {
        setLoadingState(prev => ({ ...prev, step: 'adding_to_cart' }));
        addToCart(cartItem);
        setLoadingState({ isLoading: false, step: 'idle', error: null });
        setIsExpanded(false);
        setExpandedBy(null);
      }
    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to add item to cart. Please try again.'
      }));
    }
  }, [createCartItem, addToCart]);

  const onBuyNow = useCallback(async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setExpandedBy('buy');
      return;
    }

    try {
      setLoadingState({ isLoading: true, step: 'generating_image', error: null });

      const cartItem = await createCartItem();
      if (!cartItem) {
        return;
      }

      setLoadingState(prev => ({ ...prev, step: 'checking_product' }));
      const currentText = customTextPreset.bottomLine.text;
      const existingProduct = await checkExistingProduct(currentText);
      
      if (!existingProduct) {
        setLoadingState(prev => ({ ...prev, step: 'creating_product' }));
        const result = await createProductWithImage({
          description: currentText,
          textPreset: customTextPreset,
          imageContainerRef: imageContainerRef.current!,
          modelId: selectedModel.id
        });

        if (!result.success) {
          throw result.error || new Error('Failed to create product');
        }
      }

      setLoadingState(prev => ({ ...prev, step: 'adding_to_cart' }));
      addToCart(cartItem);
      setIsExpanded(false);
      setExpandedBy(null);

      setLoadingState(prev => ({ ...prev, step: 'redirecting' }));
      router.push('/shop/checkout');
    } catch (error) {
      console.error("Error in buy now flow:", error);
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: "There was an error processing your request. Please try again."
      }));
    }
  }, [isExpanded, createCartItem, customTextPreset, selectedModel.id, imageContainerRef, addToCart, router]);

  const onCartClick = useCallback(() => {
    setIsExpanded(!isExpanded);
    setExpandedBy(isExpanded ? null : 'cart');
  }, [isExpanded]);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(Math.max(1, parseInt(e.target.value)));
  }, []);

  const handleSizeSelect = useCallback((size: string) => {
    setSelectedSize(size);
    setLoadingState(prev => ({ ...prev, error: null }));
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    setLoadingState(prev => ({ ...prev, error: null }));
  }, []);

  // Memoize size buttons
  const sizeButtons = useMemo(() => (
    SIZES.map(size => (
      <SizeButton
        key={size}
        size={size}
        isSelected={selectedSize === size}
        onSelect={handleSizeSelect}
      />
    ))
  ), [selectedSize, handleSizeSelect]);

  // Function to measure text width
  const measureTextWidth = useCallback((text: string, fontSize: number) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    context.font = `${fontSize}px Chalkduster, cursive`;
    return Math.round(context.measureText(text).width);
  }, []);

  // Function to calculate font size that keeps text width under maxWidth
  const calculateMaxFontSize = useCallback((text: string, maxWidth: number, defaultSize: number = 22) => {
    if (!text) return { fontSize: defaultSize, shouldWrap: false, formattedText: '' };
    
    // First try with default size
    const defaultWidth = measureTextWidth(text, defaultSize);
    if (defaultWidth <= maxWidth) {
      return { fontSize: defaultSize, shouldWrap: false, formattedText: text };
    }
    
    // Try reducing size down to 12px
    let fontSize = defaultSize;
    while (fontSize > 12 && measureTextWidth(text, fontSize) > maxWidth) {
      fontSize--;
    }
    
    // If we hit 12px and it's still too wide, we should wrap
    if (fontSize === 12 && measureTextWidth(text, fontSize) > maxWidth) {
      // Split text into words
      const words = text.split(' ');
      let firstLine = '';
      let secondLine = '';
      let currentLine = '';
      
      // Build first line word by word until we exceed maxWidth
      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
        const lineWidth = measureTextWidth(testLine, 12);
        
        if (lineWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          // If this is the first word and it's too long, keep it on first line
          if (i === 0) {
            firstLine = words[0];
            secondLine = words.slice(1).join(' ');
          } else {
            firstLine = currentLine;
            secondLine = words.slice(i).join(' ');
          }
          break;
        }
      }
      
      // If we haven't set the lines yet (meaning all words fit on first line)
      if (!firstLine) {
        firstLine = currentLine;
        secondLine = '';
      }
      
      const firstLineWidth = measureTextWidth(firstLine, 12);
      const secondLineWidth = measureTextWidth(secondLine, 12);
      
      if (Math.max(firstLineWidth, secondLineWidth) <= maxWidth) {
        return { 
          fontSize: 12, 
          shouldWrap: true, 
          formattedText: secondLine ? `${firstLine}\n${secondLine}` : firstLine
        };
      }
    }
    
    return { fontSize, shouldWrap: false, formattedText: text };
  }, [measureTextWidth]);

  // Calculate bottom font size based on max width
  const maxBottomWidth = 171;
  
  useEffect(() => {
    if (customLine) {
      const { fontSize, shouldWrap, formattedText } = calculateMaxFontSize(customLine, maxBottomWidth);
      setBottomFontSize(fontSize);
      setShouldWrapBottom(shouldWrap);
      setFormattedBottomText(formattedText);
      
      console.log('Font size calculation:', {
        text: customLine,
        fontSize,
        shouldWrap,
        formattedText,
        width: measureTextWidth(customLine, fontSize),
        maxWidth: maxBottomWidth
      });
    }
  }, [customLine, calculateMaxFontSize, measureTextWidth]);

  return (
    <div className="min-h-screen bg-black text-white">
      <CustomizationContainer>
        <PreviewSection>
          <ImageContainer ref={imageContainerRef}>
            <Image
              src={selectedModel.imagePath}
              alt="T-shirt preview"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "contain", width: "100%", height: "100%" }}
            />
            <TextOverlay 
              $position={customTextPreset.topLine}
              $verticalOffset={selectedModel.verticalOffset}
              $isMobile={isMobile}
              $debug={debugMode}
              data-width={measureTextWidth(customTextPreset.topLine.text, customTextPreset.topLine.fontSize)}
              data-font-size={customTextPreset.topLine.fontSize}
            >
              {customTextPreset.topLine.text}
            </TextOverlay>
            <TextOverlay 
              $position={customTextPreset.bottomLine}
              $verticalOffset={selectedModel.verticalOffset}
              $isMobile={isMobile}
              $debug={debugMode}
              $allowWrap={shouldWrapBottom}
              data-width={measureTextWidth(customTextPreset.bottomLine.text.split('\n')[0], customTextPreset.bottomLine.fontSize)}
              data-font-size={customTextPreset.bottomLine.fontSize}
            >
              {customTextPreset.bottomLine.text}
            </TextOverlay>
          </ImageContainer>
          
          {/* Debug Controls */}
          <div className="w-full max-w-[600px] p-4 bg-white/10 rounded-md mt-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm text-white">Debug Mode</Label>
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 hover:bg-white/20"
                onClick={() => setDebugMode(!debugMode)}
              >
                {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
              </Button>
            </div>
            
            {debugMode && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-white mb-2">Top Text Font Size: {topFontSize}px</Label>
                  <input
                    type="range"
                    min="12"
                    max="40"
                    value={topFontSize}
                    onChange={(e) => setTopFontSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="text-sm text-white mb-2">Bottom Text Font Size: {bottomFontSize}px</Label>
                  <input
                    type="range"
                    min="12"
                    max="40"
                    value={bottomFontSize}
                    onChange={(e) => setBottomFontSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </PreviewSection>

        <CustomizationSection>
          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
          
          <div className="mt-6">
            <StayFamousPreset 
              customText={customLine}
              originalDescription={originalDescription}
              onTextChange={handleTextChange}
            />
            
            <div className="flex items-center justify-between mt-4">
              <p className="text-2xl font-bold">$38.00</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 hover:bg-white/20 flex items-center gap-2"
                  onClick={onCartClick}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  className="bg-white text-black hover:bg-white/90"
                  onClick={onBuyNow}
                  disabled={loadingState.isLoading}
                >
                  {loadingState.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{getLoadingMessage(loadingState.step)}</span>
                    </div>
                  ) : (
                    'Buy Now'
                  )}
                </Button>
              </div>
            </div>

            {isExpanded && (
              <ProductOptions>
                <div className="space-y-4">
                  {/* Quantity Row */}
                  <div className="flex items-center gap-4">
                    <Label className="text-sm text-white whitespace-nowrap">Quantity:</Label>
                    <input 
                      type="number"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="w-16 text-center border border-white/20 rounded-md p-1 bg-black/40 text-white text-sm"
                      min="1"
                    />
                  </div>

                  {/* Size Row */}
                  <div className="flex items-center gap-4">
                    <Label className="text-sm text-white whitespace-nowrap">Size:</Label>
                    <div className="flex gap-1">
                      {sizeButtons}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div className="flex items-center gap-4">
                    <Label className="text-sm text-white whitespace-nowrap">Color:</Label>
                    <div className="flex gap-1">
                      <ColorButton
                        color="Black"
                        isSelected={selectedColor === "Black"}
                        onSelect={handleColorSelect}
                      />
                      <ColorButton
                        color="White"
                        isSelected={selectedColor === "White"}
                        onSelect={handleColorSelect}
                      />
                    </div>
                  </div>
                </div>

                {loadingState.error && (
                  <ErrorMessage>{loadingState.error}</ErrorMessage>
                )}

                <Button
                  className="w-full bg-white text-black hover:bg-white/90 mt-4"
                  onClick={expandedBy === 'cart' ? handleAddToCart : onBuyNow}
                  disabled={loadingState.isLoading}
                >
                  {loadingState.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{getLoadingMessage(loadingState.step)}</span>
                    </div>
                  ) : (
                    expandedBy === 'cart' ? 'Add to Cart' : 'Buy Now'
                  )}
                </Button>
              </ProductOptions>
            )}
          </div>
        </CustomizationSection>
      </CustomizationContainer>
    </div>
  )
}
