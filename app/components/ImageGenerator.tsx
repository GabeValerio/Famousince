'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styled from 'styled-components';
import * as htmlToImage from 'html-to-image';
import Presets, { TextPreset } from './Presets';
import ModelSelector, { Model, MODELS } from './ModelSelector';

// Define fixed dimensions for consistency
const FIXED_WIDTH = 600;
const FIXED_HEIGHT = 750;

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr ${FIXED_WIDTH}px;
  gap: 16px;
  width: 100%;
  margin: 0;
  padding: 0;
  background: black;
  color: white;
  align-items: start;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: ${FIXED_HEIGHT + 32}px;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: black;
  height: fit-content;
`;

const TextControlsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 8px;
`;

const PreviewContainer = styled.div<{ matchHeight?: number }>`
  width: ${FIXED_WIDTH}px;
  height: ${props => props.matchHeight ? `${props.matchHeight}px` : 'fit-content'};
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const ImageContainer = styled.div`
  position: relative;
  width: ${FIXED_WIDTH - 32}px;
  height: ${FIXED_HEIGHT - 32}px;
  background: white;
`;

const StyledImage = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: white;
`;

interface TextOverlayProps {
  fontSize: number;
  top: number;
  left: number;
}

const TextOverlay = styled.div<TextOverlayProps>`
  position: absolute;
  top: ${props => props.top}%;
  left: ${props => props.left}%;
  transform: translate(-50%, -50%);
  color: white;
  font-family: "Chalkduster", cursive;
  font-size: ${props => props.fontSize}px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  width: 80%;
  word-wrap: break-word;
  pointer-events: none;
  line-height: normal;
`;

const TextBoundingBox = styled.div`
  position: absolute;
  border: 2px solid red;
  pointer-events: none;
  background-color: rgba(255, 255, 255, 0.1);
`;

const TextSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: white;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin: 0;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const Input = styled.input`
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  width: 100%;
  background: black;
  color: white;

  &[type="range"] {
    margin: 4px 0;
    accent-color: white;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const PositionDisplay = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
`;

interface TextLine {
  text: string;
  fontSize: number;
  top: number;
  left: number;
}

interface ImageGeneratorProps {
  width?: number;
  height?: number;
}

const DownloadButton = styled.button`
  background-color: white;
  color: black;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  font-family: 'Chalkduster', fantasy;
  margin-top: 8px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }

  &:disabled {
    background-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.4);
    cursor: not-allowed;
  }
`;

const SectionDivider = styled.div`
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const GridSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BoundingBoxControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: black;
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  width: 100%;
`;

const CheckboxLabel = styled.label`
  font-size: 12px;
  color: red;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: white;
`;

const DimensionsDisplay = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
`;

export default function ImageGenerator() {
  const [selectedModel, setSelectedModel] = useState<Model>(MODELS[0]);
  const [topLine, setTopLine] = useState<TextLine>({
    text: '',
    fontSize: 32,
    top: 30,
    left: 50,
  });

  const [bottomLine, setBottomLine] = useState<TextLine>({
    text: '',
    fontSize: 32,
    top: 70,
    left: 50,
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [controlsHeight, setControlsHeight] = useState<number>(0);
  const [showBoundingBox, setShowBoundingBox] = useState(false);
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (controlsRef.current) {
        const height = controlsRef.current.offsetHeight;
        setControlsHeight(height);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    
    // Use a timeout to ensure content is fully rendered
    const timeout = setTimeout(updateHeight, 100);

    return () => {
      window.removeEventListener('resize', updateHeight);
      clearTimeout(timeout);
    };
  }, [topLine, bottomLine, selectedModel]);

  const updateTextLine = (
    isTop: boolean,
    field: keyof TextLine,
    value: string | number
  ) => {
    const setter = isTop ? setTopLine : setBottomLine;
    setter(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePresetSelect = (preset: TextPreset) => {
    setTopLine(preset.topLine);
    setBottomLine(preset.bottomLine);
  };

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
  };

  const handleDownload = async () => {
    if (!imageContainerRef.current) return;
    
    try {
      setIsDownloading(true);
      const dataUrl = await htmlToImage.toPng(imageContainerRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        skipAutoScale: true,
        style: {
          transform: 'none'
        }
      });
      
      // Format the date as YYYYMMDD
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      
      // Clean up text for filename (remove spaces and special characters)
      const cleanText = (text: string) => {
        return text.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      };
      
      const topTextClean = cleanText(topLine.text || 'notext');
      const bottomTextClean = cleanText(bottomLine.text || 'notext');
      const modelNameClean = cleanText(selectedModel.name);
      
      const fileName = `${modelNameClean}_${topTextClean}_${bottomTextClean}_${dateStr}.png`;
      
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Calculate bounding box for both texts
  const calculateBoundingBox = () => {
    if (!topLine.text && !bottomLine.text) return null;
    
    // More accurate text width estimation for Chalkduster font
    const estimateTextWidth = (text: string, fontSize: number) => {
      // Chalkduster is a wider font, using 0.8-0.9 multiplier for better accuracy
      // Also account for the 80% width constraint of TextOverlay
      const charWidth = fontSize * 0.7; // Increased from 0.6 to 0.85
      const pixelWidth = text.length * charWidth;
      // Convert to percentage of container width, accounting for 80% max-width of text
      return Math.min((pixelWidth / (FIXED_WIDTH - 32)) * 100, 80); // Cap at 80% as per TextOverlay width
    };
    
    const estimateTextHeight = (fontSize: number) => {
      // Line height estimation
      return (fontSize * 1.3) / (FIXED_HEIGHT - 32) * 100; // Increased from 1.2 to 1.3
    };
    
    let minY = 100, maxY = 0, maxWidth = 0;
    let centerX = 50;
    
    if (topLine.text) {
      const textWidth = estimateTextWidth(topLine.text, topLine.fontSize);
      const textHeight = estimateTextHeight(topLine.fontSize);
      minY = Math.min(minY, topLine.top - textHeight / 2);
      maxY = Math.max(maxY, topLine.top + textHeight / 2);
      maxWidth = Math.max(maxWidth, textWidth);
      centerX = topLine.left;
    }
    
    if (bottomLine.text) {
      const textWidth = estimateTextWidth(bottomLine.text, bottomLine.fontSize);
      const textHeight = estimateTextHeight(bottomLine.fontSize);
      minY = Math.min(minY, bottomLine.top - textHeight / 2);
      maxY = Math.max(maxY, bottomLine.top + textHeight / 2);
      maxWidth = Math.max(maxWidth, textWidth);
      if (topLine.text) {
        centerX = (topLine.left + bottomLine.left) / 2;
      } else {
        centerX = bottomLine.left;
      }
    }
    
    return {
      top: minY,
      left: centerX - maxWidth / 2,
      width: maxWidth,
      height: maxY - minY
    };
  };

  // Convert percentage dimensions to inches (assuming shirt is about 12 inches wide)
  const convertToInches = (boundingBox: any) => {
    if (!boundingBox) return { width: 0, height: 0 };
    
    // Assuming the shirt area is approximately 12 inches wide and 15 inches tall
    const shirtWidthInches = 12;
    const shirtHeightInches = 15;
    
    const widthInches = (boundingBox.width / 100) * shirtWidthInches;
    const heightInches = (boundingBox.height / 100) * shirtHeightInches;
    
    return {
      width: Math.round(widthInches * 100) / 100, // Round to 2 decimal places
      height: Math.round(heightInches * 100) / 100
    };
  };

  const boundingBox = calculateBoundingBox();
  const dimensions = convertToInches(boundingBox);

  return (
    <Container>
      <Controls ref={controlsRef}>
        <ControlsGrid>
          <GridSection>
            <ModelSelector
              selectedModel={selectedModel}
              onSelectModel={handleModelSelect}
            />
          </GridSection>

          <GridSection>
            <Presets onSelectPreset={handlePresetSelect} />
            <BoundingBoxControls>
              <CheckboxGroup>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Checkbox
                    type="checkbox"
                    id="showBoundingBox"
                    checked={showBoundingBox}
                    onChange={(e) => setShowBoundingBox(e.target.checked)}
                  />
                  <CheckboxLabel htmlFor="showBoundingBox">Show Text Box</CheckboxLabel>
                </div>
                {boundingBox && (
                  <DimensionsDisplay>
                    {dimensions.width}" W × {dimensions.height}" H
                  </DimensionsDisplay>
                )}
              </CheckboxGroup>
            </BoundingBoxControls>
          </GridSection>
        </ControlsGrid>

        <TextControlsGrid>
          <TextSection>
            <SectionTitle>Top Text</SectionTitle>
            <InputGroup>
              <Label>Text</Label>
              <Input
                type="text"
                placeholder="Enter top text"
                value={topLine.text}
                onChange={(e) => updateTextLine(true, 'text', e.target.value)}
              />
            </InputGroup>
            <InputGroup>
              <Label>Font Size</Label>
              <Input
                type="number"
                value={topLine.fontSize}
                min={12}
                max={100}
                onChange={(e) => updateTextLine(true, 'fontSize', Number(e.target.value))}
              />
            </InputGroup>
            <InputGroup>
              <Label>Vertical Position</Label>
              <Input
                type="range"
                min={0}
                max={100}
                value={topLine.top}
                onChange={(e) => updateTextLine(true, 'top', Number(e.target.value))}
              />
              <PositionDisplay>{topLine.top}% from top</PositionDisplay>
            </InputGroup>
            <InputGroup>
              <Label>Horizontal Position</Label>
              <Input
                type="range"
                min={0}
                max={100}
                value={topLine.left}
                onChange={(e) => updateTextLine(true, 'left', Number(e.target.value))}
              />
              <PositionDisplay>{topLine.left}% from left</PositionDisplay>
            </InputGroup>
          </TextSection>

          <TextSection>
            <SectionTitle>Bottom Text</SectionTitle>
            <InputGroup>
              <Label>Text</Label>
              <Input
                type="text"
                placeholder="Enter bottom text"
                value={bottomLine.text}
                onChange={(e) => updateTextLine(false, 'text', e.target.value)}
              />
            </InputGroup>
            <InputGroup>
              <Label>Font Size</Label>
              <Input
                type="number"
                value={bottomLine.fontSize}
                min={12}
                max={100}
                onChange={(e) => updateTextLine(false, 'fontSize', Number(e.target.value))}
              />
            </InputGroup>
            <InputGroup>
              <Label>Vertical Position</Label>
              <Input
                type="range"
                min={0}
                max={100}
                value={bottomLine.top}
                onChange={(e) => updateTextLine(false, 'top', Number(e.target.value))}
              />
              <PositionDisplay>{bottomLine.top}% from top</PositionDisplay>
            </InputGroup>
            <InputGroup>
              <Label>Horizontal Position</Label>
              <Input
                type="range"
                min={0}
                max={100}
                value={bottomLine.left}
                onChange={(e) => updateTextLine(false, 'left', Number(e.target.value))}
              />
              <PositionDisplay>{bottomLine.left}% from left</PositionDisplay>
            </InputGroup>
          </TextSection>
        </TextControlsGrid>

        <DownloadButton 
          onClick={handleDownload}
          disabled={isDownloading || (!topLine.text && !bottomLine.text)}
        >
          {isDownloading ? 'Generating...' : 'Download Design'}
        </DownloadButton>
      </Controls>

      <PreviewContainer matchHeight={controlsHeight}>
        <ImageContainer ref={imageContainerRef}>
          <StyledImage
            src={selectedModel.imagePath}
            alt={selectedModel.name}
            width={FIXED_WIDTH - 32}
            height={FIXED_HEIGHT - 32}
            priority
          />
          {boundingBox && showBoundingBox && (
            <TextBoundingBox
              style={{
                top: `${boundingBox.top + selectedModel.verticalOffset}%`,
                left: `${boundingBox.left}%`,
                width: `${boundingBox.width}%`,
                height: `${boundingBox.height}%`
              }}
            />
          )}
          {topLine.text && (
            <TextOverlay
              fontSize={topLine.fontSize}
              top={topLine.top + selectedModel.verticalOffset}
              left={topLine.left}
            >
              {topLine.text}
            </TextOverlay>
          )}
          {bottomLine.text && (
            <TextOverlay
              fontSize={bottomLine.fontSize}
              top={bottomLine.top + selectedModel.verticalOffset}
              left={bottomLine.left}
            >
              {bottomLine.text}
            </TextOverlay>
          )}
        </ImageContainer>
      </PreviewContainer>
    </Container>
  );
} 