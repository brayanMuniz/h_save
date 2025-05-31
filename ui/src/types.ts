export type Doujinshi = {
  id: number;
  source: string;
  externalId: string;

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
