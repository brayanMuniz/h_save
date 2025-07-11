import React, { useState, useEffect } from 'react';

interface BatchTaggingModeProps {
  isActive: boolean;
  onToggle: () => void;
  onImagesUpdated: () => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedArtists: string[];
  onArtistsChange: (artists: string[]) => void;
  selectedCharacters: string[];
  onCharactersChange: (characters: string[]) => void;
  selectedParodies: string[];
  onParodiesChange: (parodies: string[]) => void;
  selectedGroups: string[];
  onGroupsChange: (groups: string[]) => void;
  availableTags: string[];
  availableArtists: string[];
  availableCharacters: string[];
  availableParodies: string[];
  availableGroups: string[];
  selectedImages: Set<number>;
  onSelectedImagesChange: (selected: Set<number>) => void;
}

type EntityType = 'tags' | 'artists' | 'characters' | 'parodies' | 'groups';

const BatchTaggingMode: React.FC<BatchTaggingModeProps> = ({
  isActive,
  onToggle,
  onImagesUpdated,
  selectedTags,
  onTagsChange,
  selectedArtists,
  onArtistsChange,
  selectedCharacters,
  onCharactersChange,
  selectedParodies,
  onParodiesChange,
  selectedGroups,
  onGroupsChange,
  availableTags,
  availableArtists,
  availableCharacters,
  availableParodies,
  availableGroups,
  selectedImages,
  onSelectedImagesChange,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeEntityType, setActiveEntityType] = useState<EntityType>('tags');
  const [entityInput, setEntityInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Clear selections when mode is deactivated
  useEffect(() => {
    if (!isActive) {
      onSelectedImagesChange(new Set());
      setEntityInput('');
      setActiveEntityType('tags');
    }
  }, [isActive, onSelectedImagesChange]);

  const getSelectedEntities = (type: EntityType): string[] => {
    switch (type) {
      case 'tags': return selectedTags;
      case 'artists': return selectedArtists;
      case 'characters': return selectedCharacters;
      case 'parodies': return selectedParodies;
      case 'groups': return selectedGroups;
    }
  };

  const getAvailableEntities = (type: EntityType): string[] => {
    switch (type) {
      case 'tags': return availableTags;
      case 'artists': return availableArtists;
      case 'characters': return availableCharacters;
      case 'parodies': return availableParodies;
      case 'groups': return availableGroups;
    }
  };

  const getOnEntitiesChange = (type: EntityType) => {
    switch (type) {
      case 'tags': return onTagsChange;
      case 'artists': return onArtistsChange;
      case 'characters': return onCharactersChange;
      case 'parodies': return onParodiesChange;
      case 'groups': return onGroupsChange;
    }
  };

  const getEntityTypeLabel = (type: EntityType): string => {
    switch (type) {
      case 'tags': return 'Tags';
      case 'artists': return 'Artists';
      case 'characters': return 'Characters';
      case 'parodies': return 'Parodies';
      case 'groups': return 'Groups';
    }
  };

  const getEntityTypeIcon = (type: EntityType): string => {
    switch (type) {
      case 'tags': return '🏷️';
      case 'artists': return '🎨';
      case 'characters': return '👤';
      case 'parodies': return '📚';
      case 'groups': return '👥';
    }
  };

  const handleAddEntity = (customEntity?: string) => {
    const trimmedEntity = (customEntity ?? entityInput).trim();
    if (!trimmedEntity) return;

    const selectedEntities = getSelectedEntities(activeEntityType);
    const onEntitiesChange = getOnEntitiesChange(activeEntityType);

    if (!selectedEntities.includes(trimmedEntity)) {
      onEntitiesChange([...selectedEntities, trimmedEntity]);
      setEntityInput('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveEntity = (entityToRemove: string) => {
    const selectedEntities = getSelectedEntities(activeEntityType);
    const onEntitiesChange = getOnEntitiesChange(activeEntityType);

    onEntitiesChange(selectedEntities.filter(entity => entity !== entityToRemove));
  };

  const handleSubmit = async () => {
    if (selectedImages.size === 0) {
      alert('Please select at least one image.');
      return;
    }

    const hasSelectedEntities = selectedTags.length > 0 || selectedArtists.length > 0 || 
                               selectedCharacters.length > 0 || selectedParodies.length > 0 || 
                               selectedGroups.length > 0;

    if (!hasSelectedEntities) {
      alert('Please select at least one entity to add.');
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = [];

      // Submit each entity type that has selections
      if (selectedTags.length > 0) {
        promises.push(
          fetch('/api/images/batch/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_ids: Array.from(selectedImages),
              tags: selectedTags,
            }),
          })
        );
      }

      if (selectedArtists.length > 0) {
        promises.push(
          fetch('/api/images/batch/artists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_ids: Array.from(selectedImages),
              artists: selectedArtists,
            }),
          })
        );
      }

      if (selectedCharacters.length > 0) {
        promises.push(
          fetch('/api/images/batch/characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_ids: Array.from(selectedImages),
              characters: selectedCharacters,
            }),
          })
        );
      }

      if (selectedParodies.length > 0) {
        promises.push(
          fetch('/api/images/batch/parodies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_ids: Array.from(selectedImages),
              parodies: selectedParodies,
            }),
          })
        );
      }

      if (selectedGroups.length > 0) {
        promises.push(
          fetch('/api/images/batch/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_ids: Array.from(selectedImages),
              groups: selectedGroups,
            }),
          })
        );
      }

      const results = await Promise.all(promises);
      
      // Check if all requests were successful
      const failedRequests = results.filter(response => !response.ok);
      if (failedRequests.length > 0) {
        throw new Error('Some requests failed');
      }

      const entityTypes = [];
      if (selectedTags.length > 0) entityTypes.push(`${selectedTags.length} tags`);
      if (selectedArtists.length > 0) entityTypes.push(`${selectedArtists.length} artists`);
      if (selectedCharacters.length > 0) entityTypes.push(`${selectedCharacters.length} characters`);
      if (selectedParodies.length > 0) entityTypes.push(`${selectedParodies.length} parodies`);
      if (selectedGroups.length > 0) entityTypes.push(`${selectedGroups.length} groups`);

      alert(`Successfully updated ${selectedImages.size} images with: ${entityTypes.join(', ')}`);
      
      // Clear selections and refresh images
      onSelectedImagesChange(new Set());
      onTagsChange([]);
      onArtistsChange([]);
      onCharactersChange([]);
      onParodiesChange([]);
      onGroupsChange([]);
      onImagesUpdated();
    } catch (error) {
      console.error('Error updating images:', error);
      alert('Failed to update images. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddEntity();
    }
  };

  if (!isActive) {
    return (
      <div className="mb-4">
        <button
          onClick={onToggle}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🏷️ Batch Tagging Mode
        </button>
      </div>
    );
  }

  const selectedEntities = getSelectedEntities(activeEntityType);
  const availableEntities = getAvailableEntities(activeEntityType);
  const hasSelectedEntities = selectedTags.length > 0 || selectedArtists.length > 0 || 
                             selectedCharacters.length > 0 || selectedParodies.length > 0 || 
                             selectedGroups.length > 0;

  // Filtered suggestions for autocomplete
  const filteredSuggestions = getAvailableEntities(activeEntityType)
    .filter(entity =>
      entity.toLowerCase().includes(entityInput.trim().toLowerCase()) &&
      !getSelectedEntities(activeEntityType).includes(entity)
    );

  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-blue-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Batch Tagging Mode</h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Entity Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Entity Type:
        </label>
        <div className="flex flex-wrap gap-2">
          {(['tags', 'artists', 'characters', 'parodies', 'groups'] as EntityType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveEntityType(type)}
              className={`px-3 py-2 rounded-md transition-colors ${
                activeEntityType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {getEntityTypeIcon(type)} {getEntityTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Entity Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select {getEntityTypeLabel(activeEntityType)} to Add:
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedEntities.map((entity) => (
            <span
              key={entity}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {entity}
              <button
                onClick={() => handleRemoveEntity(entity)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={entityInput}
            onChange={(e) => {
              setEntityInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                if (filteredSuggestions.length > 0 && filteredSuggestions[0].toLowerCase() === entityInput.trim().toLowerCase()) {
                  handleAddEntity(filteredSuggestions[0]);
                } else {
                  handleAddEntity();
                }
              }
            }}
            placeholder={`Enter ${getEntityTypeLabel(activeEntityType).toLowerCase()} name...`}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />
          <button
            onClick={() => handleAddEntity()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            Add
          </button>
          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && (
            <div className="absolute left-0 right-0 top-full z-10 bg-gray-800 border border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((suggestion) => (
                  <div
                    key={suggestion}
                    className="px-3 py-2 cursor-pointer hover:bg-blue-600 hover:text-white text-gray-200"
                    onMouseDown={() => handleAddEntity(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-400 text-sm text-center">
                  {entityInput.trim()
                    ? `No ${getEntityTypeLabel(activeEntityType).toLowerCase()} found matching "${entityInput.trim()}"`
                    : `No available ${getEntityTypeLabel(activeEntityType).toLowerCase()}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Entity Suggestions */}
      {availableEntities.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quick Add {getEntityTypeLabel(activeEntityType)}:
          </label>
          <div className="flex flex-wrap gap-1">
            {availableEntities.slice(0, 10).map((entity) => (
              <button
                key={entity}
                onClick={() => {
                  if (!selectedEntities.includes(entity)) {
                    const onEntitiesChange = getOnEntitiesChange(activeEntityType);
                    onEntitiesChange([...selectedEntities, entity]);
                  }
                }}
                disabled={selectedEntities.includes(entity)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  selectedEntities.includes(entity)
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                {entity}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selection Info */}
      <div className="mb-4 p-3 bg-gray-700 rounded-md">
        <div className="text-sm text-gray-300">
          <span className="font-medium">{selectedImages.size}</span> images selected
          {hasSelectedEntities && (
            <>
              {' • '}
              <span className="font-medium">
                {selectedTags.length + selectedArtists.length + selectedCharacters.length + selectedParodies.length + selectedGroups.length}
              </span> entities to add
            </>
          )}
        </div>
        {selectedImages.size > 0 && hasSelectedEntities && (
          <div className="text-xs text-gray-400 mt-1">
            Click on images to select/deselect them, then click "Apply Entities" to update all selected images.
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={selectedImages.size === 0 || !hasSelectedEntities || isSubmitting}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedImages.size === 0 || !hasSelectedEntities || isSubmitting
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isSubmitting ? 'Updating...' : 'Apply Entities'}
        </button>
        <button
          onClick={() => onSelectedImagesChange(new Set())}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
};

export default BatchTaggingMode; 