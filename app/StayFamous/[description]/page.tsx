"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Loader2 } from "lucide-react"
import ModelSelector from "@/app/components/ModelSelector"
import StayFamousPreset, { DEFAULT_PRESET, StayFamousText } from "@/app/components/StayFamousPreset"
import Image from "next/image"
import styled from "styled-components"
import { useCart } from "@/lib/CartContext"
import { useRouter } from "next/navigation"
import React from "react"
import { createProductWithImage, checkExistingProduct } from "@/app/utils/productUtils"
import { generateAndUploadImage } from "@/app/utils/imageUtils"
import { supabase } from "@/lib/supabaseClient"

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
  padding: 8px 12px;
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  text-align: center;
  width: 100%;
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

interface LoadingState {
  isLoading: boolean;
  step: 'idle' | 'generating_image' | 'checking_product' | 'creating_product' | 'adding_to_cart' | 'redirecting';
  error: string | null;
}

interface ProductType {
  id: string;
  name: string;
  active: boolean;
  images?: ProductTypeImage[];
  base_price: number;
  is_default: boolean;
}

interface ProductTypeImage {
  id: string;
  product_type_id: string;
  image_path: string;
  vertical_offset: number;
  is_default_model: boolean;
}

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

const COLORS = ["Black", "White"] as const;

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
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [customLine, setCustomLine] = useState("");
  const [originalDescription, setOriginalDescription] = useState(description);
  const [textPreset, setTextPreset] = useState<StayFamousText>(DEFAULT_PRESET);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    step: 'idle',
    error: null
  });
  const [selectedProductPrice, setSelectedProductPrice] = useState<number>(0);
  const imageContainerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [topFontSize, setTopFontSize] = useState(26);
  const [bottomFontSize, setBottomFontSize] = useState(22);
  const [shouldWrapBottom, setShouldWrapBottom] = useState(false);
  const [formattedBottomText, setFormattedBottomText] = useState(description);
  const [productSizes, setProductSizes] = useState<Array<{ id: string, size: string }>>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedModelPath, setSelectedModelPath] = useState<string | null>(null);
  const [selectedVerticalOffset, setSelectedVerticalOffset] = useState(0);
  const [selectedModelTypeId, setSelectedModelTypeId] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchProductTypes(),
          fetchSizes()
        ]);
        setLoadingState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize data'
        }));
      }
    };

    initializeData();
  }, []);

  const fetchProductTypes = async () => {
    try {
      const { data: types, error: typesError } = await supabase
        .from('product_types')
        .select('*')
        .eq('active', true)
        .order('name');

      if (typesError) throw typesError;

      const { data: images, error: imagesError } = await supabase
        .from('product_type_images')
        .select('*')
        .in('product_type_id', types.map(t => t.id));

      if (imagesError) throw imagesError;

      const typesWithImages = types.map(type => ({
        ...type,
        images: images.filter((img: ProductTypeImage) => img.product_type_id === type.id) || []
      }));

      setProductTypes(typesWithImages);
      
      // Find the default product type
      const defaultType = typesWithImages.find(type => type.is_default);
      if (defaultType) {
        setSelectedProductType(defaultType.id);
        setSelectedProductPrice(defaultType.base_price);
        
        // Find the default model for this product type
        const defaultModel = defaultType.images?.find((img: ProductTypeImage) => img.is_default_model);
        if (defaultModel) {
          handleModelSelect(defaultModel.image_path, defaultModel.vertical_offset, defaultType.id);
        }
      } else if (typesWithImages.length > 0) {
        // Fallback to first product type if no default is set
        setSelectedProductType(typesWithImages[0].id);
        setSelectedProductPrice(typesWithImages[0].base_price);
      }
    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        error: 'Failed to fetch product types'
      }));
    }
  };

  const fetchSizes = async () => {
    if (!selectedProductType) return;
    
    try {
      const { data, error } = await supabase
        .from('product_sizes')
        .select('id, size')
        .eq('product_type_id', selectedProductType)
        .order('size_order', { ascending: true });

      if (error) throw error;
      setProductSizes(data || []);
      if (data && data.length > 0) {
        setSelectedSize(data[0].size);
      }
    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        error: 'Failed to fetch sizes'
      }));
    }
  };

  // Fetch sizes when product type changes
  useEffect(() => {
    fetchSizes();
  }, [selectedProductType]);

  // Update price when product type changes
  useEffect(() => {
    if (selectedProductType) {
      const selectedType = productTypes.find(type => type.id === selectedProductType);
      if (selectedType) {
        setSelectedProductPrice(selectedType.base_price);
      }
    }
  }, [selectedProductType, productTypes]);

  const handleModelSelect = useCallback((modelPath: string, verticalOffset: number, productTypeId: string) => {
    setSelectedModelPath(modelPath);
    setSelectedVerticalOffset(verticalOffset);
    setSelectedModelTypeId(productTypeId);
    setSelectedSize(''); // Reset size when model changes
    
    // Reset any error states
    setLoadingState(prev => ({ ...prev, error: null }));
  }, []);

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

  // Add a function to get a shorter loading message for mobile
  const getLoadingMessage = (step: LoadingState['step'], isMobile: boolean) => {
    if (isMobile) {
      switch (step) {
        case 'generating_image':
          return 'Generating...';
        case 'checking_product':
          return 'Checking...';
        case 'creating_product':
          return 'Creating...';
        case 'adding_to_cart':
          return 'Adding...';
        case 'redirecting':
          return 'Redirecting...';
        default:
          return 'Processing...';
      }
    }

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
      
      // Get the product type name
      const selectedType = productTypes.find(type => type.id === selectedModelTypeId);
      if (!selectedType) {
        throw new Error('Selected product type not found');
      }

      // Generate the customized image
      const customImageUrl = await generateAndUploadImage(
        imageContainerRef.current!,
        customTextPreset,
        selectedModelTypeId!
      );

      if (!customImageUrl) {
        throw new Error('Failed to generate customized image');
      }

      return {
        id: `custom-${selectedModelTypeId}-${selectedSize}-${selectedColor}-${encodeURIComponent(customTextPreset.bottomLine.text)}`,
        product_id: 'custom',
        variant_id: `${selectedSize}-${selectedColor}`,
        name: `Famous Since ${selectedType.name}`,
        description: customTextPreset.bottomLine.text,
        price: selectedProductPrice,
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
  }, [selectedSize, selectedColor, selectedModelTypeId, quantity, customTextPreset, imageContainerRef, selectedProductPrice, productTypes]);

  const handleAddToCart = useCallback(async () => {
    setLoadingState({ isLoading: true, step: 'generating_image', error: null });
    
    try {
      const cartItem = await createCartItem();
      if (cartItem) {
        setLoadingState(prev => ({ ...prev, step: 'adding_to_cart' }));
        addToCart(cartItem);
        setLoadingState({ isLoading: false, step: 'idle', error: null });
      }
    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to add item to cart. Please try again.'
      }));
    }
  }, [createCartItem, addToCart]);

  const onCartClick = useCallback(async () => {
    handleAddToCart();
  }, [handleAddToCart]);

  const onBuyNow = useCallback(async () => {
    if (!selectedSize || !selectedColor) {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: "Please select both size and color before proceeding"
      }));
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
          modelId: selectedModelTypeId!
        });

        if (!result.success) {
          throw result.error || new Error('Failed to create product');
        }
      }

      setLoadingState(prev => ({ ...prev, step: 'adding_to_cart' }));
      addToCart(cartItem);

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
  }, [createCartItem, customTextPreset, selectedModelTypeId, imageContainerRef, addToCart, router, selectedSize, selectedColor]);

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
    }
  }, [customLine, calculateMaxFontSize, measureTextWidth]);

  return (
    <div className="min-h-screen bg-black text-white">
      <CustomizationContainer>
        <PreviewSection>
          <ImageContainer ref={imageContainerRef}>
            {selectedModelPath ? (
              <>
                <Image
                  src={selectedModelPath}
                  alt="Product preview"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "contain" }}
                />
                <TextOverlay 
                  $position={customTextPreset.topLine}
                  $verticalOffset={selectedVerticalOffset}
                  $isMobile={isMobile}
                  $debug={debugMode}
                  data-width={measureTextWidth(customTextPreset.topLine.text, customTextPreset.topLine.fontSize)}
                  data-font-size={customTextPreset.topLine.fontSize}
                  data-text-overlay="top"
                >
                  {customTextPreset.topLine.text}
                </TextOverlay>
                <TextOverlay 
                  $position={customTextPreset.bottomLine}
                  $verticalOffset={selectedVerticalOffset}
                  $isMobile={isMobile}
                  $debug={debugMode}
                  $allowWrap={shouldWrapBottom}
                  data-width={measureTextWidth(customTextPreset.bottomLine.text.split('\n')[0], customTextPreset.bottomLine.fontSize)}
                  data-font-size={customTextPreset.bottomLine.fontSize}
                  data-text-overlay="bottom"
                >
                  {customTextPreset.bottomLine.text}
                </TextOverlay>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-lg">
                <div className="animate-pulse text-white/40">Select a product type to preview</div>
              </div>
            )}
          </ImageContainer>
          
          {/* Debug Controls */}
          {/* Removed debug controls section */}
        </PreviewSection>

        <CustomizationSection>
          {/* Product Type Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {productTypes.map((type) => (
                <Button
                  key={type.id}
                  onClick={() => setSelectedProductType(type.id)}
                  variant="outline"
                  className={`${
                    selectedProductType === type.id
                      ? 'bg-white text-black'
                      : 'bg-black/40 text-white hover:bg-white/10'
                  }`}
                >
                  {type.name}
                </Button>
              ))}
            </div>

            {/* Model Selection */}
            <ModelSelector
              selectedProductType={selectedProductType}
              selectedModel={selectedModelPath}
              onModelSelect={handleModelSelect}
              productTypes={productTypes}
            />
          </div>

          {/* Product Options */}
          <ProductOptions>
            <StayFamousPreset 
              customText={customLine}
              onTextChange={handleTextChange}
              textPreset={textPreset}
              setTextPreset={setTextPreset}
            />

            <div className="space-y-4 mt-4">
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

            <div className="flex flex-col gap-4 mt-4">
              <p className="text-2xl font-bold">${selectedProductPrice.toFixed(2)}</p>
              {loadingState.error && (
                <ErrorMessage>{loadingState.error}</ErrorMessage>
              )}
              <div className="flex items-center justify-end gap-2 w-full">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 hover:bg-white/20 flex items-center gap-2 whitespace-nowrap"
                  onClick={onCartClick}
                  disabled={loadingState.isLoading}
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Add to Cart</span>
                  <span className="sm:hidden">Add to Cart</span>
                </Button>
                <Button
                  variant="outline"
                  className="bg-white text-black hover:bg-white/90 whitespace-nowrap min-w-[90px]"
                  onClick={onBuyNow}
                  disabled={loadingState.isLoading}
                >
                  {loadingState.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="truncate">{getLoadingMessage(loadingState.step, isMobile)}</span>
                    </div>
                  ) : (
                    'Buy Now'
                  )}
                </Button>
              </div>
            </div>
          </ProductOptions>
        </CustomizationSection>
      </CustomizationContainer>
    </div>
  );
}
