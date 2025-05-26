export type Doujinshi = {
  Id: number;
  Title: string;
  GalleryID: string;
  Pages: string;
  Uploaded: string; // ISO string from backend
  Pending: number;
  Tags: string[];
  Artists: string[];
  Characters: string[];
  Parodies: string[];
  Groups: string[];
  Languages: string[];
  Categories: string[];
  thumbnail_url: string;
};

