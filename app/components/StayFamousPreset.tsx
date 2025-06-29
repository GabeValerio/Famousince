'use client';

import styled from 'styled-components';
import { useState } from 'react';
import { FaPencilAlt, FaCheck } from 'react-icons/fa';

const PresetContainer = styled.div`
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 16px;
  width: 100%;
  margin-bottom: 16px;
  text-align: center;
  position: relative;
`;

const PresetTitle = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
  color: black;
  
  span.famous {
    font-family: 'Chalkduster', cursive;
  }
`;

const PresetDescription = styled.div`
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const IconButton = styled.button<{ isEditing?: boolean }>`
  background: transparent;
  border: none;
  color: ${props => props.isEditing ? '#22C55E' : '#E53E3E'};
  cursor: pointer;
  padding: 8px;
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.isEditing ? '#16A34A' : '#C53030'};
  }
`;

const EditInput = styled.input`
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  width: 200px;
  text-align: center;
  
  &:focus {
    outline: none;
    border-color: #9CA3AF;
  }
`;

const BottomText = styled.span`
  text-align: center;
  min-width: 200px;
  display: inline-block;
  font-family: 'Chalkduster', cursive;
  font-size: 16px;
  color: black;
`;

export interface TextPosition {
  text: string;
  fontSize: number;
  top: number;
  left: number;
}

export interface StayFamousText {
  topLine: TextPosition;
  bottomLine: TextPosition;
}

const DEFAULT_PRESET: StayFamousText = {
  topLine: {
    text: 'FAMOUS SINCE',
    fontSize: 22,
    top: 33,
    left: 51,
  },
  bottomLine: {
    text: '', // This will be filled with user input
    fontSize: 22,
    top: 37,
    left: 51,
  },
};

interface StayFamousPresetProps {
  customText: string;
  onTextChange?: (text: string) => void;
}

export default function StayFamousPreset({ customText, onTextChange }: StayFamousPresetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(customText);

  const currentPreset: StayFamousText = {
    ...DEFAULT_PRESET,
    bottomLine: {
      ...DEFAULT_PRESET.bottomLine,
      text: customText,
    },
  };

  const handleSave = () => {
    onTextChange?.(editText.toUpperCase());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <PresetContainer>
      <IconButton 
        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        isEditing={isEditing}
        type="button"
      >
        {isEditing ? <FaCheck size={14} /> : <FaPencilAlt size={14} />}
      </IconButton>
      <PresetTitle>
        Your <span className="famous">FAMOUS</span> Moment
      </PresetTitle>
      <PresetDescription>
        {isEditing ? (
          <EditInput
            type="text"
            value={editText.toUpperCase()}
            onChange={(e) => setEditText(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <BottomText>{currentPreset.bottomLine.text}</BottomText>
        )}
      </PresetDescription>
    </PresetContainer>
  );
}

export { DEFAULT_PRESET }; 