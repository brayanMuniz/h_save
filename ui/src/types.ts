export type SortKey = "uploaded" | "rating" | "oCount" | "title";
export type SortOrder = "asc" | "desc";

export interface SortState {
  key: SortKey;
  order: SortOrder;
}

export type Doujinshi = {
  id: number;
  source: string;
  externalId: string;
  progress: Progress;


  title: string;
  secondTitle: string;
  pages: string;
  uploaded: string; // ISO string from backend
  folderName: string;
  oCount: number;
  bookmarkCount: number;

  tags: string[];
  artists: string[];
  characters: string[];
  parodies: string[];
  groups: string[];
  languages: string[];
  categories: string[];
  thumbnail_url: string;
};

export type Progress = {
  doujinshiId: number;
  rating: number | null;
  lastPage: number | null;
};

// For filtering on card
export interface FilterState {
  characters: {
    ordered: string[];
    excluded: Set<string>;
  };
  parodies: {
    ordered: string[];
    excluded: Set<string>;
  };
  tags: {
    ordered: string[];
    excluded: Set<string>;
  };
}

export interface BrowseFilters {
  artists: FilterGroup;
  groups: FilterGroup;
  tags: FilterGroup;
  characters: FilterGroup;
  parodies: FilterGroup;
  languages: string[];
  formats: string[];
  genres: string[];
  search: string;
  rating: RangeFilter;
  oCount: RangeFilter;
  pageCount: RangeFilter;
  bookmarkCount: RangeFilter;
  currentlyReading: boolean;
}

export interface FilterGroup {
  included: string[];
  excluded: string[];
}
export interface RangeFilter {
  min: number;
  max: number;
}

export interface SavedFilter {
  id: number;
  name: string;
  filters: BrowseFilters;
  createdAt: string; // The backend provides this as an ISO string
}

export interface FilterSection {
  id: keyof BrowseFilters;
  label: string;
  icon: string;
  collapsed: boolean;
}

export type FilterType = "artists" | "groups" | "tags" | "characters" | "parodies";

export interface Artist {
  id: number;
  name: string;
  isFavorite: boolean;
  doujinCount: number;
  totalOCount: number;
  averageRating: number | null; // Can be null if no rated doujinshi
}

export interface ArtistPageResponse {
  artistDetails: Artist;
  doujinshiList: Doujinshi[];
}

export interface Tag {
  id: number;
  name: string;
  isFavorite: boolean;
  doujinCount: number;
  totalOCount: number;
  averageRating: number | null;
}

export interface TagPageResponse {
  tagDetails: Tag;
  doujinshiList: Doujinshi[];
}

export interface Group {
  id: number;
  name: string;
  isFavorite: boolean;
  doujinCount: number;
  totalOCount: number;
  averageRating: number | null;
}

export interface GroupPageResponse {
  groupDetails: Group;
  doujinshiList: Doujinshi[];
}

export interface Entity {
  id: number;
  name: string;
  isFavorite: boolean;
  doujinCount: number;
  totalOCount: number;
  averageRating: number | null;
}

export type EntitySortKey = "name" | "doujinCount" | "totalOCount" | "averageRating";

export interface EntitySortState {
  key: EntitySortKey;
  order: SortOrder;
}

// A generic shape that Artist, Tag, Group, etc., details will conform to.
export interface EntityDetail {
  id: number;
  name: string;
  isFavorite: boolean;
  doujinCount: number;
  totalOCount: number;
  averageRating: number | null;
}

// A generic shape for the API response for any entity detail page.
export interface EntityPageResponse {
  details: EntityDetail;
  doujinshiList: Doujinshi[];
}

export interface SortState {
  key: SortKey;
  order: SortOrder;
}

export interface Character {
  id: number;
  name: string;
  isFavorite: boolean;
  doujinCount: number;
  totalOCount: number;
  averageRating: number | null;
}

export interface CharacterPageResponse {
  characterDetails: Character;
  doujinshiList: Doujinshi[];
}

export interface Parody {
  id: number;
  name: string;
  isFavorite: boolean;
  doujinCount: number;
  totalOCount: number;
  averageRating: number | null;
}

export interface ParodyPageResponse {
  parodyDetails: Parody;
  doujinshiList: Doujinshi[];
}

export interface Image {
  id: number;
  source: string;
  external_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  width: number;
  height: number;
  format: string;
  uploaded: string;
  hash: string;

  // Metadata
  tags: string[];
  artists: string[];
  characters: string[];
  parodies: string[];
  groups: string[];
  categories: string[];

  // Progress
  rating: number;
  o_count: number;
  view_count: number;

  // From API wrapper
  thumbnail_url: string;
}

export interface ImageBrowseFilters {
  artists: FilterGroup;
  groups: FilterGroup;
  tags: FilterGroup;
  characters: FilterGroup;
  parodies: FilterGroup;
  categories: FilterGroup;
  search: string;
  rating: RangeFilter;
  oCount: RangeFilter;
  unratedOnly: boolean; // For quick rating workflow
  formats: string[]; // jpg, png, webp, etc.
}

export interface ImageCollection {
  id: number;
  name: string;
  description: string;
  created_at: string;
  image_count?: number; // Optional, populated by backend
}

export interface SavedImageFilter {
  id: number;
  name: string;
  filters: ImageBrowseFilters;
  createdAt: string;
}
