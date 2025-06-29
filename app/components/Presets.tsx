'use client';

import styled from 'styled-components';

const PresetButton = styled.button`
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 16px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;

  &:hover {
    background-color: #e5e7eb;
  }

  &:active {
    background-color: #d1d5db;
  }
`;

const PresetTitle = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const PresetDescription = styled.div`
  font-size: 12px;
  color: #666;
`;

export interface TextPreset {
  topLine: {
    text: string;
    fontSize: number;
    top: number;
    left: number;
  };
  bottomLine: {
    text: string;
    fontSize: number;
    top: number;
    left: number;
  };
}

interface PresetsProps {
  onSelectPreset: (preset: TextPreset) => void;
}

const PRESETS: { [key: string]: TextPreset } = {
  'Famous Prompt': {
    topLine: {
      text: 'FAMOUS SINCE',
      fontSize: 22,
      top: 33,
      left: 51,
    },
    bottomLine: {
      text: 'THAT PROMPT',
      fontSize: 22,
      top: 37,
      left: 51,
    },
  },
  // Add more presets here as needed
};

export default function Presets({ onSelectPreset }: PresetsProps) {
  return (
    <div>
      <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Presets</h3>
      {Object.entries(PRESETS).map(([name, preset]) => (
        <PresetButton
          key={name}
          onClick={() => onSelectPreset(preset)}
        >
          <PresetTitle>{name}</PresetTitle>
          <PresetDescription>
            Top: "{preset.topLine.text}" ({preset.topLine.fontSize}px)<br />
            Bottom: "{preset.bottomLine.text}" ({preset.bottomLine.fontSize}px)
          </PresetDescription>
        </PresetButton>
      ))}
    </div>
  );
} 