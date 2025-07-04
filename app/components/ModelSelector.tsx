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

export interface Model {
  id: string;
  name: string;
  imagePath: string;
  verticalOffset: number;
}

const MODELS: Model[] = [
  {
    id: 'model1-short',
    name: 'Short Sleeve',
    imagePath: '/MockUp/Model1_ShortSleeve.JPG',
    verticalOffset: 0,
  },
  {
    id: 'model1-hoodie',
    name: 'Hoodie Style 1',
    imagePath: '/MockUp/Model1_Hoodie.JPG',
    verticalOffset: 0,
  },
  {
    id: 'model2-hoodie',
    name: 'Hoodie Style 2',
    imagePath: '/MockUp/Model2_Hoodie.JPG',
    verticalOffset: 3,
  },
];

interface ModelSelectorProps {
  selectedModel: Model;
  onSelectModel: (model: Model) => void;
}

export default function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  return (
    <div>
      <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Select Model</h3>
      <ModelGrid>
        {MODELS.map((model) => (
          <ModelCard
            key={model.id}
            $isSelected={selectedModel.id === model.id}
            onClick={() => onSelectModel(model)}
          >
            <ImageWrapper>
              <Image
                src={model.imagePath}
                alt={model.name}
                fill
                sizes="(max-width: 768px) 33vw, 20vw"
                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              />
            </ImageWrapper>
            <ModelName>{model.name}</ModelName>
          </ModelCard>
        ))}
      </ModelGrid>
    </div>
  );
}

export { MODELS }; 