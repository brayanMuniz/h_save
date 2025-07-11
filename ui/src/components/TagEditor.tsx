import React, { useState, useEffect, useRef } from 'react';
import type { Image } from '../types';

interface EntityEditorProps {
  image: Image;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  entityType?: 'tag' | 'artist' | 'character' | 'parody' | 'group';
  availableTags?: string[];
  availableArtists?: string[];
  availableCharacters?: string[];
  availableParodies?: string[];
  availableGroups?: string[];
}

const EntityEditor: React.FC<EntityEditorProps> = ({ image, isOpen, onClose, onUpdate, entityType = 'tag',
  availableTags,
  availableArtists,
  availableCharacters,
  availableParodies,
  availableGroups,
}) => {
  const getEntities = (): string[] => {
    switch (entityType) {
      case 'tag': return image.tags || [];
      case 'artist': return image.artists || [];
      case 'character': return image.characters || [];
      case 'parody': return image.parodies || [];
      case 'group': return image.groups || [];
      default: return [];
    }
  };

  const [entities, setEntities] = useState<string[]>(getEntities());
  const [newEntity, setNewEntity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allEntities, setAllEntities] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEntities(getEntities());
  }, [image.id, entityType]);

  // Use global entity lists if provided, otherwise fallback to fetch
  useEffect(() => {
    if (!isOpen) return;
    let list: string[] | undefined;
    switch (entityType) {
      case 'tag': list = availableTags; break;
      case 'artist': list = availableArtists; break;
      case 'character': list = availableCharacters; break;
      case 'parody': list = availableParodies; break;
      case 'group': list = availableGroups; break;
      default: list = undefined;
    }
    if (list !== undefined) {
      setAllEntities(list);
    } else {
      // fallback: fetch from API
      fetch(`/api/${entityType}s`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data[entityType + 's']) && data[entityType + 's'].length > 0 && typeof data[entityType + 's'][0] === 'object') {
            setAllEntities(data[entityType + 's'].map((t: any) => t.name));
          } else {
            setAllEntities(data[entityType + 's'] || []);
          }
        })
        .catch(() => setAllEntities([]));
    }
  }, [isOpen, entityType, availableTags, availableArtists, availableCharacters, availableParodies, availableGroups]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const addEntity = async (entityToAdd?: string) => {
    const trimmedEntity = (entityToAdd ?? newEntity).trim();
    if (!trimmedEntity || entities.includes(trimmedEntity)) {
      setNewEntity('');
      setShowDropdown(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/images/${image.id}/${entityType}s`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`${entityType}s`]: [trimmedEntity] })
      });
      if (!response.ok) throw new Error(`Failed to add ${entityType}`);
      setEntities([...entities, trimmedEntity]);
      setNewEntity('');
      setShowDropdown(false);
      onUpdate?.();
    } catch (error) {
      console.error(`Failed to add ${entityType}:`, error);
      alert(`Failed to add ${entityType}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeEntity = async (entityToRemove: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/images/${image.id}/${entityType}s`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`${entityType}s`]: [entityToRemove] })
      });
      if (!response.ok) throw new Error(`Failed to remove ${entityType}`);
      setEntities(entities.filter(e => e !== entityToRemove));
      onUpdate?.();
    } catch (error) {
      console.error(`Failed to remove ${entityType}:`, error);
      alert(`Failed to remove ${entityType}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && showDropdown) {
        addEntity(filteredSuggestions[0]);
      } else {
        addEntity();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleEntityKeyDown = (e: React.KeyboardEvent, entity: string) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removeEntity(entity);
    }
  };

  // Filter suggestions for dropdown
  const filteredSuggestions = newEntity.trim()
    ? allEntities.filter(
        t =>
          t.toLowerCase().includes(newEntity.trim().toLowerCase()) &&
          !entities.includes(t)
      )
    : [];

  if (!isOpen) return null;

  // Capitalize entityType for UI
  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-70">
      <div 
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">Edit {entityLabel}s</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 relative">
          <div className="flex gap-2 mb-2">
            <input
              ref={inputRef}
              type="text"
              value={newEntity}
              onChange={e => {
                setNewEntity(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              onKeyDown={handleKeyDown}
              placeholder={`Add new ${entityType}...`}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              onClick={() => addEntity()}
              disabled={isLoading || !newEntity.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
            >
              Add
            </button>
          </div>
          {/* Dropdown suggestions */}
          {showDropdown && filteredSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded shadow-lg z-80 max-h-40 overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion}
                  className="px-3 py-2 text-white hover:bg-blue-700 cursor-pointer text-sm"
                  onMouseDown={e => { e.preventDefault(); addEntity(suggestion); }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <h4 className="text-white text-sm font-medium mb-2">Current {entityLabel}s:</h4>
          {entities.length === 0 ? (
            <p className="text-gray-400 text-sm">No {entityLabel.toLowerCase()}s added yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {entities.map((entity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-gray-700 text-white px-3 py-1 rounded-full text-sm"
                >
                  <span>{entity}</span>
                  <button
                    onClick={() => removeEntity(entity)}
                    onKeyDown={e => handleEntityKeyDown(e, entity)}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-red-400 transition ml-1"
                    tabIndex={0}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-400">
          <p>• Press Enter to add a {entityType} or select from dropdown</p>
          <p>• Press Delete/Backspace on a {entityType} to remove it</p>
          <p>• Press Escape to close</p>
        </div>
      </div>
    </div>
  );
};

export default EntityEditor; 