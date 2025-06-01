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
