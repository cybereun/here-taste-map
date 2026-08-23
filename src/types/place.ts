export interface Place {
  id: string;
  title: string;
  place_name: string;
  address: string;
  lat: number;
  lng: number;
  tel?: string;
  place_id?: string;
  city: string;
  category: string;
  sub_category?: string;
  date: string;
  thumbnail: string;
  images?: string[];
  summary: string;
  url: string;
  distance?: number; // meters from current user position
}

export type SortType = 'latest' | 'distance' | 'name';
