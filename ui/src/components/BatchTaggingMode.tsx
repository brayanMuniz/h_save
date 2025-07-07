import React, { useState, useEffect } from 'react';

interface BatchTaggingModeProps {
  isActive: boolean;
  onToggle: () => void;
  onImagesUpdated: () => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags: string[];
  selectedImages: Set<number>;
  onSelectedImagesChange: (selected: Set<number>) => void;
}

const BatchTaggingMode: React.FC<BatchTaggingModeProps> = ({
  isActive,
  onToggle,
  onImagesUpdated,
  selectedTags,
  onTagsChange,
  availableTags,
  selectedImages,
  onSelectedImagesChange,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Clear selections when mode is deactivated
  useEffect(() => {
    if (!isActive) {
      onSelectedImagesChange(new Set());
      setTagInput('');
    }
  }, [isActive, onSelectedImagesChange]);



  const handleAddTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      onTagsChange([...selectedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (selectedImages.size === 0 || selectedTags.length === 0) {
      alert('Please select at least one image and one tag.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/images/batch/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_ids: Array.from(selectedImages),
          tags: selectedTags,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update images');
      }

      const result = await response.json();
      alert(`Successfully updated ${result.updated_count} images with tags: ${selectedTags.join(', ')}`);
      
      // Clear selections and refresh images
      onSelectedImagesChange(new Set());
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
      handleAddTag();
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

      {/* Tag Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Tags to Add:
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter tag name..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddTag}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Quick Tag Suggestions */}
      {availableTags.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quick Add Tags:
          </label>
          <div className="flex flex-wrap gap-1">
            {availableTags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (!selectedTags.includes(tag)) {
                    onTagsChange([...selectedTags, tag]);
                  }
                }}
                disabled={selectedTags.includes(tag)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selection Info */}
      <div className="mb-4 p-3 bg-gray-700 rounded-md">
        <div className="text-sm text-gray-300">
          <span className="font-medium">{selectedImages.size}</span> images selected
          {selectedTags.length > 0 && (
            <>
              {' • '}
              <span className="font-medium">{selectedTags.length}</span> tags to add
            </>
          )}
        </div>
        {selectedImages.size > 0 && selectedTags.length > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            Click on images to select/deselect them, then click "Apply Tags" to update all selected images.
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={selectedImages.size === 0 || selectedTags.length === 0 || isSubmitting}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedImages.size === 0 || selectedTags.length === 0 || isSubmitting
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isSubmitting ? 'Updating...' : 'Apply Tags'}
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