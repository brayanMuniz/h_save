import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  id: string;
  item: string;
  isExcluded: boolean;
  onToggleExclude: (item: string) => void;
  color: string;
  index: number;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  item,
  isExcluded,
  onToggleExclude,
  color,
  index,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded border transition-all duration-200
        ${isDragging ? 'shadow-lg z-10' : ''}
        ${isExcluded
          ? "bg-gray-700 text-gray-400 border-gray-500"
          : `${color} text-white border-white`
        }`}
    >
      {/* Priority indicator */}
      <span className="text-xs font-bold w-6 text-center">
        {index + 1}
      </span>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing px-1 py-1 hover:bg-black/20 rounded"
        title="Drag to reorder"
      >
        ⋮⋮
      </div>

      {/* Item content */}
      <button
        onClick={() => onToggleExclude(item)}
        className={`flex-1 text-left px-2 py-1 rounded transition
          ${isExcluded ? "line-through" : "hover:bg-black/20"}
        `}
        title={isExcluded ? "Click to include" : "Click to exclude"}
      >
        {item}
      </button>
    </div>
  );
};

interface FilterSectionProps {
  label: string;
  items: string[];
  excluded: Set<string>;
  onToggleExclude: (item: string) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  color: string;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  label,
  items,
  excluded,
  onToggleExclude,
  onReorder,
  color,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item === active.id);
      const newIndex = items.findIndex((item) => item === over?.id);
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <div className="mb-6">
      <div className="font-bold mb-3 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-xs text-gray-400">
          {items.length - excluded.size}/{items.length} active
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item, index) => (
              <SortableItem
                key={item}
                id={item}
                item={item}
                index={index}
                isExcluded={excluded.has(item)}
                onToggleExclude={onToggleExclude}
                color={color}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

interface FilterState {
  characters: { ordered: string[]; excluded: Set<string> };
  parodies: { ordered: string[]; excluded: Set<string> };
  tags: { ordered: string[]; excluded: Set<string> };
}

interface DoujinOverviewFilterProps {
  characters: string[];
  parodies: string[];
  tags: string[];
  onFilterChange?: (filterState: FilterState) => void; // Make optional with default
}

const DoujinOverviewFilter: React.FC<DoujinOverviewFilterProps> = ({
  characters,
  parodies,
  tags,
  onFilterChange,
}) => {
  const [orderedCharacters, setOrderedCharacters] = useState<string[]>(characters);
  const [orderedParodies, setOrderedParodies] = useState<string[]>(parodies);
  const [orderedTags, setOrderedTags] = useState<string[]>(tags);

  const [excludedChars, setExcludedChars] = useState<Set<string>>(new Set());
  const [excludedParodies, setExcludedParodies] = useState<Set<string>>(new Set());
  const [excludedTags, setExcludedTags] = useState<Set<string>>(new Set());

  // Initialize ordered arrays when props change
  useEffect(() => {
    setOrderedCharacters(characters);
  }, [characters]);

  useEffect(() => {
    setOrderedParodies(parodies);
  }, [parodies]);

  useEffect(() => {
    setOrderedTags(tags);
  }, [tags]);

  useEffect(() => {
    if (onFilterChange && typeof onFilterChange === 'function') {
      // Only call if there's actually a change
      const newState = {
        characters: { ordered: orderedCharacters, excluded: excludedChars },
        parodies: { ordered: orderedParodies, excluded: excludedParodies },
        tags: { ordered: orderedTags, excluded: excludedTags },
      };

      onFilterChange(newState);
    }
  }, [
    orderedCharacters.join(','), // Convert to string for comparison
    orderedParodies.join(','),
    orderedTags.join(','),
    Array.from(excludedChars).sort().join(','), // Convert Set to sorted string
    Array.from(excludedParodies).sort().join(','),
    Array.from(excludedTags).sort().join(','),
  ]);


  const handleCharacterReorder = (oldIndex: number, newIndex: number) => {
    setOrderedCharacters((items) => arrayMove(items, oldIndex, newIndex));
  };

  const handleParodyReorder = (oldIndex: number, newIndex: number) => {
    setOrderedParodies((items) => arrayMove(items, oldIndex, newIndex));
  };

  const handleTagReorder = (oldIndex: number, newIndex: number) => {
    setOrderedTags((items) => arrayMove(items, oldIndex, newIndex));
  };

  const toggleCharacterExclusion = (item: string) => {
    setExcludedChars((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item)) newSet.delete(item);
      else newSet.add(item);
      return newSet;
    });
  };

  const toggleParodyExclusion = (item: string) => {
    setExcludedParodies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item)) newSet.delete(item);
      else newSet.add(item);
      return newSet;
    });
  };

  const toggleTagExclusion = (item: string) => {
    setExcludedTags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item)) newSet.delete(item);
      else newSet.add(item);
      return newSet;
    });
  };

  const clearAllFilters = () => {
    setExcludedChars(new Set());
    setExcludedParodies(new Set());
    setExcludedTags(new Set());
  };

  useEffect(() => {
    if (Array.isArray(characters)) {
      setOrderedCharacters(characters);
    }
  }, [characters]);

  useEffect(() => {
    if (Array.isArray(parodies)) {
      setOrderedParodies(parodies);
    }
  }, [parodies]);

  useEffect(() => {
    if (Array.isArray(tags)) {
      setOrderedTags(tags);
    }
  }, [tags]);

  const totalExcluded = excludedChars.size + excludedParodies.size + excludedTags.size;

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col sticky top-0 h-screen bg-gray-800 rounded-lg p-4 text-gray-200">
      <Link
        to="/"
        className="mb-6 text-2xl font-bold text-white hover:text-indigo-400 transition"
        aria-label="Back to Home"
        title="Back to Home"
      >
        Ecchi
      </Link>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {totalExcluded > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded transition"
            title="Clear all filters"
          >
            Clear ({totalExcluded})
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {orderedCharacters.length > 0 && (
          <FilterSection
            label="Characters"
            items={orderedCharacters}
            excluded={excludedChars}
            onToggleExclude={toggleCharacterExclusion}
            onReorder={handleCharacterReorder}
            color="bg-green-700"
          />
        )}

        {orderedParodies.length > 0 && (
          <FilterSection
            label="Parodies"
            items={orderedParodies}
            excluded={excludedParodies}
            onToggleExclude={toggleParodyExclusion}
            onReorder={handleParodyReorder}
            color="bg-yellow-700"
          />
        )}

        {orderedTags.length > 0 && (
          <FilterSection
            label="Tags"
            items={orderedTags}
            excluded={excludedTags}
            onToggleExclude={toggleTagExclusion}
            onReorder={handleTagReorder}
            color="bg-indigo-700"
          />
        )}
      </div>
    </aside>
  );
};

export default DoujinOverviewFilter;
