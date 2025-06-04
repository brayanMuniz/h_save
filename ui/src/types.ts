export type Doujinshi = {
  id: number;
  source: string;
  externalId: string;
  progress: Progress;


  title: string;
  pages: string;
  uploaded: string; // ISO string from backend
  folderName: string;
  oCount: number;

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

// Filter browsing page
export interface BrowseFilters {
  artists: FilterGroup;
  groups: FilterGroup;
  tags: FilterGroup;
  characters: FilterGroup;
  parodies: FilterGroup;
  languages: string[];
  rating: { min: number; max: number };
  oCount: { min: number; max: number };
  formats: string[];
  genres: string[];
  search: string;
}

export interface FilterGroup {
  included: string[];
  excluded: string[];
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
