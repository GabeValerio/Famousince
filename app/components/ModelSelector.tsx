'use client';

import styled from 'styled-components';
import Image from 'next/image';

const ModelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
`;

const ModelCard = styled.button<{ $isSelected: boolean }>`
  position: relative;
  padding: 4px;
  border: 2px solid ${props => props.$isSelected ? '#0070f3' : '#e5e7eb'};
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  aspect-ratio: 4/5;

  &:hover {
    border-color: ${props => props.$isSelected ? '#0070f3' : '#d1d5db'};
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const ModelName = styled.div`
  font-size: 12px;
  text-align: center;
  margin-top: 4px;
  color: #666;
  padding: 0 4px;
`;

export interface ProductType {
  id: string;
  name: string;
  active: boolean;
  images?: ProductTypeImage[];
}

export interface ProductTypeImage {
  id: string;
  product_type_id: string;
  image_path: string;
  vertical_offset: number;
}

interface ModelSelectorProps {
  selectedProductType: string;
  selectedModel: string | null;
  onModelSelect: (modelPath: string, verticalOffset: number, productTypeId: string) => void;
  productTypes: ProductType[];
}

export default function ModelSelector({ 
  selectedProductType,
  selectedModel,
  onModelSelect,
  productTypes
}: ModelSelectorProps) {
  // Find the selected product type
  const selectedType = productTypes.find(type => type.id === selectedProductType);
  const images = selectedType?.images || [];

  return (
    <div>
      <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Select Model</h3>
      <ModelGrid>
        {images.map((image) => (
          <ModelCard
            key={image.id}
            $isSelected={selectedModel === image.image_path}
            onClick={() => onModelSelect(image.image_path, image.vertical_offset, image.product_type_id)}
          >
            <ImageWrapper>
              <Image
                src={image.image_path}
                alt={`Model ${image.id}`}
                fill
                sizes="(max-width: 768px) 33vw, 20vw"
                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              />
            </ImageWrapper>
          </ModelCard>
        ))}
      </ModelGrid>
    </div>
  );
} 