export type Doujinshi = {
  ID: number;
  Source: string;
  ExternalID: string;
  Title: string;
  Pages: string;
  Uploaded: string; // ISO string from backend
  FolderName: string;
  Tags: string[];
  Artists: string[];
  Characters: string[];
  Parodies: string[];
  Groups: string[];
  Languages: string[];
  Categories: string[];
  thumbnail_url: string;
};

