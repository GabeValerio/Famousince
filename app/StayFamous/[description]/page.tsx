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
`

const TextOverlay = styled.div<{ $position: { top: number; left: number; fontSize: number }, $verticalOffset: number, $isMobile: boolean }>`
  position: absolute;
  top: ${props => {
    const baseTop = props.$position.top + props.$verticalOffset;
    return props.$isMobile ? `${baseTop * 1.00}%` : `${baseTop}%`;
  }};
  left: ${props => props.$position.left}%;
  transform: translate(-50%, -50%);
  z-index: 10;
  text-align: center;
  color: white;
  font-size: ${props => {
    const baseFontSize = props.$position.fontSize;
    return props.$isMobile ? `${baseFontSize * 0.6}px` : `${baseFontSize}px`;
  }};
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  font-family: 'Chalkduster', cursive;
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
  const [textPreset, setTextPreset] = useState<StayFamousText>(DEFAULT_PRESET)
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedBy, setExpandedBy] = useState<'cart' | 'buy' | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const imageContainerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setCustomLine(description);
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
    setCustomLine(upperText)
    localStorage.setItem("customLine", upperText)
    setTextPreset({
      ...textPreset,
      bottomLine: {
        ...textPreset.bottomLine,
        text: upperText,
      },
    })
  }, [textPreset]);

  const createCartItem = useCallback(() => {
    if (!selectedSize || !selectedColor) {
      setErrorMessage("Please select both size and color")
      return null
    }

    return {
      id: `custom-${selectedModel.id}-${selectedSize}-${selectedColor}-${encodeURIComponent(textPreset.bottomLine.text)}`,
      product_id: 'custom',
      variant_id: `${selectedSize}-${selectedColor}`,
      name: `Famous Since ${textPreset.bottomLine.text} T-Shirt`,
      description: textPreset.bottomLine.text,
      price: 28.00,
      quantity: quantity,
      image: selectedModel.imagePath,
      size: selectedSize,
      color: selectedColor,
      customization: {
        topLine: textPreset.topLine.text,
        bottomLine: textPreset.bottomLine.text,
      }
    }
  }, [selectedSize, selectedColor, selectedModel, quantity, textPreset]);

  const handleAddToCart = useCallback(() => {
    const cartItem = createCartItem();
    if (cartItem) {
      addToCart(cartItem);
      setErrorMessage("");
      setIsExpanded(false);
      setExpandedBy(null);
    }
  }, [createCartItem, addToCart]);

  const onBuyNow = useCallback(async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setExpandedBy('buy');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const cartItem = createCartItem();
      if (!cartItem) {
        setIsLoading(false);
        return;
      }

      const currentText = textPreset.bottomLine.text;
      const existingProduct = await checkExistingProduct(currentText);
      
      if (!existingProduct) {
        const result = await createProductWithImage({
          description: currentText,
          textPreset,
          imageContainerRef: imageContainerRef.current!,
          modelId: selectedModel.id
        });

        if (!result.success) {
          throw result.error || new Error('Failed to create product');
        }
      }

      addToCart(cartItem);
      setIsExpanded(false);
      setExpandedBy(null);
      router.push('/shop/checkout');
    } catch (error) {
      console.error("Error in buy now flow:", error);
      setErrorMessage("There was an error processing your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isExpanded, createCartItem, textPreset, selectedModel.id, imageContainerRef, addToCart, router]);

  const onCartClick = useCallback(() => {
    setIsExpanded(!isExpanded);
    setExpandedBy(isExpanded ? null : 'cart');
  }, [isExpanded]);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(Math.max(1, parseInt(e.target.value)));
  }, []);

  const handleSizeSelect = useCallback((size: string) => {
    setSelectedSize(size);
    setErrorMessage("");
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    setErrorMessage("");
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
              style={{ objectFit: "contain" }}
            />
            <TextOverlay 
              $position={textPreset.topLine}
              $verticalOffset={selectedModel.verticalOffset}
              $isMobile={isMobile}
            >
              {textPreset.topLine.text}
            </TextOverlay>
            <TextOverlay 
              $position={textPreset.bottomLine}
              $verticalOffset={selectedModel.verticalOffset}
              $isMobile={isMobile}
            >
              {textPreset.bottomLine.text}
            </TextOverlay>
          </ImageContainer>
        </PreviewSection>

        <CustomizationSection>
          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
          
          <div className="mt-6">
            <StayFamousPreset 
              customText={customLine} 
              onTextChange={handleTextChange}
            />
            
            <div className="flex items-center justify-between mt-4">
              <p className="text-2xl font-bold">$28.00</p>
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
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
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
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <ErrorMessage>{errorMessage}</ErrorMessage>
                )}

                <Button
                  className="w-full bg-white text-black hover:bg-white/90 mt-4"
                  onClick={expandedBy === 'cart' ? handleAddToCart : onBuyNow}
                  disabled={isLoading}
                >
                  {expandedBy === 'cart' ? 'Add to Cart' : (
                    isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Buy Now'
                    )
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
